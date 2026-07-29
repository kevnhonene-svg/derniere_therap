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
    validations_en_attente = sum(1 for validation in validations if not validation.est_complete)
    en_attente = validations_en_attente > 0
    deja_valide = completes + (validations_en_attente * 0.5)
    restant = max(capacite - deja_valide, 0)
    return {
        'invite': invite_to_dict(invite),
        'capacite': capacite,
        'deja_valide': deja_valide,
        'restant': restant,
        'statut': 'utilise' if restant == 0 else 'valide',
        'validation_en_attente': en_attente,
        'validations_en_attente': validations_en_attente,
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

            validations = list(ValidationBillet.objects.select_for_update().filter(invite=invite).order_by('numero_personne'))
            capacite = capacite_billet(invite)
            current_admin_key, user, admin_name = admin_identity(request)
            completes = sum(1 for validation in validations if validation.est_complete)
            validations_en_attente = [validation for validation in validations if not validation.est_complete]
            validation_a_confirmer = next(
                (
                    validation for validation in validations_en_attente
                    if validation_admin_key(validation) != current_admin_key
                ),
                None,
            )
            action = 'started'

            if not validation_a_confirmer and completes >= capacite:
                return error('Ce billet est deja utilise. Aucune entree restante pour ce code.')

            if validation_a_confirmer:
                validation_a_confirmer.confirme_par = user
                validation_a_confirmer.confirme_par_session = admin_name
                validation_a_confirmer.confirme_le = timezone.now()
                validation_a_confirmer.save(update_fields=['confirme_par', 'confirme_par_session', 'confirme_le'])
                action = 'confirmed'
            else:
                entrees_deja_ouvertes = completes + len(validations_en_attente)
                if entrees_deja_ouvertes >= capacite:
                    return error(
                        "La deuxieme validation doit etre faite par un autre admin. "
                        "Toutes les entrees disponibles de ce billet sont deja en attente de confirmation."
                    )
                numeros_existants = {validation.numero_personne for validation in validations}
                numero_personne = next(
                    numero for numero in range(1, capacite + 1)
                    if numero not in numeros_existants
                )
                ValidationBillet.objects.create(
                    invite=invite,
                    numero_personne=numero_personne,
                    valide_par=user,
                    valide_par_session=admin_name,
                )
    except Invite.DoesNotExist:
        return error('Code billet invalide.', status.HTTP_404_NOT_FOUND)

    payload = validation_payload(invite)
    if action == 'confirmed' and payload['restant'] == 0:
        payload['message'] = 'Deuxieme validation acceptee. Ce code est maintenant totalement utilise.'
    elif action == 'confirmed':
        payload['message'] = 'Deuxieme validation acceptee. Cette personne est validee.'
    elif payload['validations_en_attente'] > 1:
        payload['message'] = 'Validation partielle enregistree. Les deux entrees attendent maintenant un autre admin.'
    else:
        payload['message'] = 'Premiere validation enregistree. Une deuxieme validation par un autre admin est necessaire.'
    return success(payload, status.HTTP_201_CREATED)
