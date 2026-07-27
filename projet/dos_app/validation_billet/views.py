from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from dos_app.comptes.models import Invite
from dos_app.comptes.serializers import invite_to_dict
from dos_app.comptes.utils import error, json_body, success
from dos_app.validation_billet.models import ValidationBillet
from dos_app.validation_billet.serializers import ValidationBilletSerializer


def is_superadmin(request):
    user = request._request.user
    session = request._request.session
    return (user.is_authenticated and user.is_superuser) or session.get('role') == 'superadmin'


def capacite_billet(invite):
    if invite.categorie_billet in [Invite.VIP_COUPLE, Invite.VIP_PREMIUM]:
        return 2
    return 1


def admin_identity(request):
    user = request._request.user
    if user.is_authenticated:
        return f'user:{user.pk}', user, user.username
    username = request._request.session.get('admin_username', 'Superadmin')
    return f'session:{username}', None, username


def validation_admin_key(validation):
    if validation.valide_par_id:
        return f'user:{validation.valide_par_id}'
    return f'session:{validation.valide_par_session or "Superadmin"}'


def validation_payload(invite):
    validations = ValidationBillet.objects.filter(invite=invite).order_by('numero_personne')
    capacite = capacite_billet(invite)
    completes = sum(1 for validation in validations if validation.est_complete)
    en_attente = any(not validation.est_complete for validation in validations)
    deja_valide = completes + (0.5 if en_attente else 0)
    restant = max(capacite - deja_valide, 0)
    return {
        'invite': invite_to_dict(invite),
        'capacite': capacite,
        'deja_valide': deja_valide,
        'restant': restant,
        'statut': 'utilise' if restant == 0 else 'valide',
        'validation_en_attente': en_attente,
        'validations': ValidationBilletSerializer(validations, many=True).data,
    }


def get_invite_by_code(code):
    return Invite.objects.select_related('table').get(code_billet__iexact=code, actif=True)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def rechercher_billet(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    code = request.GET.get('code', '').strip()
    if not code:
        return error('Veuillez entrer le code billet.')

    try:
        invite = get_invite_by_code(code)
    except Invite.DoesNotExist:
        return error('Code billet invalide.', status.HTTP_404_NOT_FOUND)

    return success(validation_payload(invite))


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def valider_billet(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    code = str(json_body(request).get('code_billet', '')).strip()
    if not code:
        return error('Veuillez entrer le code billet.')

    try:
        with transaction.atomic():
            invite = Invite.objects.select_for_update().get(code_billet__iexact=code, actif=True)
            if not invite.table_id:
                return error(
                    "Validation refusee. Cet invite n'a pas encore de table affectee. "
                    "Veuillez d'abord lui affecter une table avant de valider son entree."
                )

            validations = ValidationBillet.objects.select_for_update().filter(invite=invite)
            capacite = capacite_billet(invite)
            completes = validations.filter(confirme_le__isnull=False).count()
            validation_en_attente = validations.filter(confirme_le__isnull=True).order_by('numero_personne').first()
            current_admin_key, user, admin_name = admin_identity(request)

            if not validation_en_attente and completes >= capacite:
                return error('Ce billet est deja utilise. Aucune entree restante pour ce code.')

            if validation_en_attente:
                if validation_admin_key(validation_en_attente) == current_admin_key:
                    return error(
                        "La deuxieme validation doit etre faite par un autre admin. "
                        "Ce billet est encore a 0,5 et attend une confirmation."
                    )
                validation_en_attente.confirme_par = user
                validation_en_attente.confirme_par_session = admin_name
                validation_en_attente.confirme_le = timezone.now()
                validation_en_attente.save(update_fields=['confirme_par', 'confirme_par_session', 'confirme_le'])
            else:
                ValidationBillet.objects.create(
                    invite=invite,
                    numero_personne=completes + 1,
                    valide_par=user,
                    valide_par_session=admin_name,
                )
    except Invite.DoesNotExist:
        return error('Code billet invalide.', status.HTTP_404_NOT_FOUND)

    payload = validation_payload(invite)
    if payload['restant'] == 0:
        payload['message'] = 'Deuxieme validation acceptee. Ce code est maintenant totalement utilise.'
    elif payload['validation_en_attente']:
        payload['message'] = 'Premiere validation enregistree. Une deuxieme validation par un autre admin est necessaire.'
    else:
        payload['message'] = 'Deuxieme validation acceptee. Cette personne est validee.'
    return success(payload, status.HTTP_201_CREATED)
