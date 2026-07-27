from django.db import transaction
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


def validation_payload(invite):
    validations = ValidationBillet.objects.filter(invite=invite).order_by('numero_personne')
    capacite = capacite_billet(invite)
    deja_valide = validations.count()
    restant = max(capacite - deja_valide, 0)
    return {
        'invite': invite_to_dict(invite),
        'capacite': capacite,
        'deja_valide': deja_valide,
        'restant': restant,
        'statut': 'utilise' if restant == 0 else 'valide',
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
            invite = Invite.objects.select_for_update().select_related('table').get(code_billet__iexact=code, actif=True)
            validations = ValidationBillet.objects.select_for_update().filter(invite=invite)
            capacite = capacite_billet(invite)
            deja_valide = validations.count()
            if deja_valide >= capacite:
                return error('Ce billet est deja utilise. Aucune entree restante pour ce code.')

            user = request._request.user if request._request.user.is_authenticated else None
            ValidationBillet.objects.create(
                invite=invite,
                numero_personne=deja_valide + 1,
                valide_par=user,
                valide_par_session=request._request.session.get('admin_username', ''),
            )
    except Invite.DoesNotExist:
        return error('Code billet invalide.', status.HTTP_404_NOT_FOUND)

    payload = validation_payload(invite)
    payload['message'] = (
        'Billet valide avec succes.'
        if payload['restant'] > 0
        else 'Billet valide avec succes. Ce code est maintenant totalement utilise.'
    )
    return success(payload, status.HTTP_201_CREATED)
