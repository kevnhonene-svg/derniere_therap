import secrets

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from dos_app.comptes.utils import error, json_body, success
from dos_app.presence_biometrique.models import MouvementPresenceBiometrique, PresenceBiometrique
from dos_app.presence_biometrique.serializers import PresenceBiometriqueSerializer, presence_to_dict


def is_superadmin(request):
    user = request._request.user
    session = request._request.session
    return (user.is_authenticated and user.is_superuser) or session.get('role') == 'superadmin'


def admin_identity(request):
    user = request._request.user
    if user.is_authenticated:
        return user, user.username
    return None, request._request.session.get('admin_username', 'Superadmin')


def next_identifiant():
    last = PresenceBiometrique.objects.order_by('-id').first()
    number = (last.id + 1) if last else 1
    return f'PRES-{number:04d}'


def challenge():
    return secrets.token_urlsafe(32)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def presences(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    qs = PresenceBiometrique.objects.prefetch_related('mouvements').all()[:80]
    return success({'presences': PresenceBiometriqueSerializer(qs, many=True).data})


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def options_enregistrement(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    identifiant = next_identifiant()
    value = challenge()
    request._request.session['presence_biometrique_register'] = {
        'challenge': value,
        'identifiant': identifiant,
    }
    return success({
        'publicKey': {
            'challenge': value,
            'rp': {'name': 'Presence Gala'},
            'user': {
                'id': secrets.token_urlsafe(16),
                'name': identifiant,
                'displayName': identifiant,
            },
            'pubKeyCredParams': [
                {'type': 'public-key', 'alg': -7},
                {'type': 'public-key', 'alg': -257},
            ],
            'authenticatorSelection': {
                'userVerification': 'required',
                'residentKey': 'preferred',
            },
            'timeout': 60000,
            'attestation': 'none',
        },
        'identifiant': identifiant,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def confirmer_enregistrement(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    pending = request._request.session.get('presence_biometrique_register')
    if not pending:
        return error('Aucune session d enregistrement biometrie active.')

    data = json_body(request)
    credential_id = str(data.get('credential_id', '')).strip()
    nom_appareil = str(data.get('nom_appareil', '')).strip()
    if not credential_id:
        return error('Empreinte non reconnue par l appareil.')

    if PresenceBiometrique.objects.filter(credential_id=credential_id).exists():
        return error('Cette empreinte securisee existe deja dans le registre.')

    user, username = admin_identity(request)
    presence = PresenceBiometrique.objects.create(
        identifiant=pending['identifiant'],
        credential_id=credential_id,
        nom_appareil=nom_appareil,
        cree_par=user,
        cree_par_session=username,
    )
    request._request.session.pop('presence_biometrique_register', None)
    return success({'presence': presence_to_dict(presence)}, status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def options_action(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    credentials = list(
        PresenceBiometrique.objects
        .filter(actif=True)
        .values_list('credential_id', flat=True)
    )
    if not credentials:
        return error('Aucune empreinte enregistree pour les presences.')

    value = challenge()
    request._request.session['presence_biometrique_action'] = value
    return success({
        'publicKey': {
            'challenge': value,
            'allowCredentials': [
                {'type': 'public-key', 'id': credential_id}
                for credential_id in credentials
            ],
            'userVerification': 'required',
            'timeout': 60000,
        },
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def confirmer_action(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    if not request._request.session.get('presence_biometrique_action'):
        return error('Aucune verification biometrie active.')

    data = json_body(request)
    credential_id = str(data.get('credential_id', '')).strip()
    nom_appareil = str(data.get('nom_appareil', '')).strip()
    if not credential_id:
        return error('Empreinte non reconnue par l appareil.')

    try:
        with transaction.atomic():
            presence = PresenceBiometrique.objects.select_for_update().get(credential_id=credential_id, actif=True)
            user, username = admin_identity(request)
            type_mouvement = (
                MouvementPresenceBiometrique.SORTIE
                if presence.statut == PresenceBiometrique.DANS_SALLE
                else MouvementPresenceBiometrique.ENTREE
            )
            presence.statut = (
                PresenceBiometrique.SORTI
                if type_mouvement == MouvementPresenceBiometrique.SORTIE
                else PresenceBiometrique.DANS_SALLE
            )
            presence.nom_appareil = nom_appareil or presence.nom_appareil
            presence.save(update_fields=['statut', 'nom_appareil', 'mise_a_jour'])
            MouvementPresenceBiometrique.objects.create(
                presence=presence,
                type_mouvement=type_mouvement,
                admin=user,
                admin_session=username,
                nom_appareil=nom_appareil,
            )
    except PresenceBiometrique.DoesNotExist:
        return error('Empreinte inconnue dans le registre.')

    request._request.session.pop('presence_biometrique_action', None)
    return success({
        'presence': presence_to_dict(presence),
        'message': f"{presence.identifiant}: {'Sortie' if type_mouvement == MouvementPresenceBiometrique.SORTIE else 'Entree'} enregistree.",
    }, status.HTTP_201_CREATED)
