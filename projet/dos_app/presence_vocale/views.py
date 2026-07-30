import math

from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny

from dos_app.comptes.utils import error, json_body, success
from dos_app.presence_vocale.models import MouvementPresenceVocale, PresenceVocale
from dos_app.presence_vocale.serializers import PresenceVocaleSerializer, presence_vocale_to_dict


MATCH_THRESHOLD = 0.86
PHRASE_REFERENCE = 'Je confirme ma sortie de la salle'


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
    last = PresenceVocale.objects.order_by('-id').first()
    number = (last.id + 1) if last else 1
    return f'VOIX-{number:04d}'


def cosine_similarity(left, right):
    if not left or not right or len(left) != len(right):
        return 0
    dot = sum(float(a) * float(b) for a, b in zip(left, right))
    left_norm = math.sqrt(sum(float(a) * float(a) for a in left))
    right_norm = math.sqrt(sum(float(b) * float(b) for b in right))
    if not left_norm or not right_norm:
        return 0
    return dot / (left_norm * right_norm)


def best_match(vector):
    best_presence = None
    best_score = 0
    for presence in PresenceVocale.objects.filter(actif=True).prefetch_related('mouvements'):
        score = cosine_similarity(vector, presence.empreinte_vocale)
        if score > best_score:
            best_presence = presence
            best_score = score
    return best_presence, best_score


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def presences(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    qs = PresenceVocale.objects.prefetch_related('mouvements').all()[:80]
    return success({
        'presences': PresenceVocaleSerializer(qs, many=True).data,
        'phrase_reference': PHRASE_REFERENCE,
        'seuil': MATCH_THRESHOLD,
    })


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def scanner_voix(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    data = json_body(request)
    vector = data.get('empreinte_vocale') or []
    quality = float(data.get('qualite') or 0)
    if len(vector) < 12:
        return error('Empreinte vocale insuffisante. Demandez a la personne de parler plus clairement.')
    if quality < 0.015:
        return error('Voix trop faible. Rapprochez le telephone et recommencez.')

    user, username = admin_identity(request)
    with transaction.atomic():
        presence, score = best_match(vector)
        if presence and score >= MATCH_THRESHOLD:
            presence = PresenceVocale.objects.select_for_update().get(pk=presence.pk)
            type_mouvement = (
                MouvementPresenceVocale.SORTIE
                if presence.statut == PresenceVocale.DANS_SALLE
                else MouvementPresenceVocale.ENTREE
            )
            presence.statut = (
                PresenceVocale.SORTI
                if type_mouvement == MouvementPresenceVocale.SORTIE
                else PresenceVocale.DANS_SALLE
            )
            presence.save(update_fields=['statut', 'mise_a_jour'])
            MouvementPresenceVocale.objects.create(
                presence=presence,
                type_mouvement=type_mouvement,
                score=round(score, 4),
                admin=user,
                admin_session=username,
            )
            action = 'Sortie' if type_mouvement == MouvementPresenceVocale.SORTIE else 'Entree'
            message = f'{presence.identifiant}: {action} enregistree. Score vocal {round(score * 100)}%.'
        else:
            presence = PresenceVocale.objects.create(
                identifiant=next_identifiant(),
                empreinte_vocale=vector,
                phrase_reference=PHRASE_REFERENCE,
                score_reference=round(max(score, 0), 4),
                statut=PresenceVocale.SORTI,
                cree_par=user,
                cree_par_session=username,
            )
            MouvementPresenceVocale.objects.create(
                presence=presence,
                type_mouvement=MouvementPresenceVocale.SORTIE,
                score=1,
                admin=user,
                admin_session=username,
            )
            message = f'{presence.identifiant}: nouvelle voix enregistree et sortie marquee.'

    return success({'presence': presence_vocale_to_dict(presence), 'message': message}, status.HTTP_201_CREATED)
