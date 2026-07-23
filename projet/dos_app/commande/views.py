from django.core.exceptions import ValidationError
from django.db import models, transaction
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from dos_app.commande.models import Commande, LigneCommande, QuotaBillet
from dos_app.commande.serializers import CommandeSerializer, QuotaBilletSerializer, commande_to_dict, quota_to_dict
from dos_app.comptes.models import Invite
from dos_app.comptes.utils import current_invite_id, error, json_body, protocol_or_admin, success
from dos_app.stock.models import Boisson


def is_superadmin(request):
    user = request._request.user
    session = request._request.session
    return (user.is_authenticated and user.is_superuser) or session.get('role') == 'superadmin'


def quota_info_for(invite):
    quota, _ = QuotaBillet.objects.get_or_create(
        categorie_billet=invite.categorie_billet,
        defaults={'nombre_bouteilles': 1},
    )
    utilise = LigneCommande.objects.filter(
        commande__invite=invite,
        commande__statut__in=[Commande.EN_ATTENTE, Commande.VALIDEE, Commande.LIVREE],
    ).aggregate(total=models.Sum('quantite'))['total'] or 0
    restant = max(quota.nombre_bouteilles - utilise, 0)
    return quota, utilise, restant


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def quota_courant(request):
    invite_id = current_invite_id(request)
    if not invite_id:
        return error('Veuillez vous connecter avec votre code billet.', status.HTTP_401_UNAUTHORIZED)
    invite = Invite.objects.get(pk=invite_id)
    quota, utilise, restant = quota_info_for(invite)
    return success({
        'quota': quota_to_dict(quota),
        'utilise': utilise,
        'restant': restant,
    })


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def quotas_admin(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        quotas = QuotaBillet.objects.all()
        return success({'quotas': QuotaBilletSerializer(quotas, many=True).data})

    data = json_body(request)
    quota, _ = QuotaBillet.objects.update_or_create(
        categorie_billet=data.get('categorie_billet', Invite.CLASSIQUE),
        defaults={
            'nombre_bouteilles': int(data.get('nombre_bouteilles') or 1),
            'actif': bool(data.get('actif', True)),
        },
    )
    return success({'quota': quota_to_dict(quota)}, status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def commandes(request):
    invite_id = current_invite_id(request)
    if request.method == 'GET':
        if protocol_or_admin(request):
            qs = Commande.objects.select_related('invite', 'invite__table').prefetch_related('lignes__boisson')
        elif invite_id:
            qs = Commande.objects.filter(invite_id=invite_id).select_related('invite', 'invite__table').prefetch_related('lignes__boisson')
        else:
            return error('Connexion requise.', status.HTTP_401_UNAUTHORIZED)
        return success({'commandes': CommandeSerializer(qs, many=True, context={'request': request}).data})

    if not invite_id or request._request.session.get('role') != 'client':
        return error('Seuls les clients connectes peuvent commander.', status.HTTP_403_FORBIDDEN)

    data = json_body(request)
    lignes = data.get('lignes', [])
    if not lignes:
        return error('Votre panier est vide.')

    invite = Invite.objects.get(pk=invite_id)
    _, _, restant = quota_info_for(invite)
    total_demande = sum(int(item.get('quantite') or 0) for item in lignes)
    if total_demande <= 0:
        return error('Selectionnez au moins une boisson.')
    if total_demande > restant:
        return error(f'Quota depasse. Il vous reste {restant} bouteille(s).')

    try:
        with transaction.atomic():
            commande = Commande.objects.create(
                invite=invite,
                note_client=data.get('note_client', '').strip(),
            )
            for item in lignes:
                boisson = Boisson.objects.select_for_update().get(pk=item.get('boisson_id'), actif=True)
                quantite = int(item.get('quantite') or 0)
                if quantite <= 0:
                    continue
                if boisson.quantite_stock < quantite:
                    raise ValidationError(f'Stock insuffisant pour {boisson.nom}.')
                LigneCommande.objects.create(commande=commande, boisson=boisson, quantite=quantite)
    except Boisson.DoesNotExist:
        return error('Une boisson du panier est introuvable.')
    except ValidationError as exc:
        return error(exc.messages if hasattr(exc, 'messages') else str(exc))

    return success({'commande': commande_to_dict(commande, request)}, status.HTTP_201_CREATED)


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def changer_statut(request, commande_id):
    if not protocol_or_admin(request):
        return error('Acces reserve au protocole et au superadmin.', status.HTTP_403_FORBIDDEN)

    data = json_body(request)
    statut_commande = data.get('statut')
    if statut_commande not in dict(Commande.STATUTS):
        return error('Statut invalide.')
    if statut_commande == Commande.VALIDEE:
        statut_commande = Commande.LIVREE

    commande = Commande.objects.prefetch_related('lignes__boisson').get(pk=commande_id)
    if commande.statut == Commande.LIVREE:
        return error('Cette commande est deja livree et ne peut plus etre modifiee.')

    commande.statut = statut_commande
    commande.note_protocole = data.get('note_protocole', commande.note_protocole)
    commande.save()
    try:
        commande.deduire_stock_si_livree()
    except ValidationError as exc:
        return error(exc.messages if hasattr(exc, 'messages') else str(exc))
    return success({'commande': commande_to_dict(commande, request)})
