from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from dos_app.comptes.models import ConfigurationApplication, Invite
from dos_app.comptes.utils import current_invite_id, error, json_body, protocol_or_admin, success
from dos_app.message.models import MessageConversation
from dos_app.message.serializers import MessageConversationSerializer, message_to_dict


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def messages(request):
    invite_id = current_invite_id(request)

    if request.method == 'GET':
        mark_read = request.query_params.get('mark_read') == '1'
        selected_invite_id = request.query_params.get('invite_id')
        if protocol_or_admin(request):
            qs = MessageConversation.objects.select_related('invite').all()
            if mark_read:
                read_qs = MessageConversation.objects.filter(auteur=MessageConversation.CLIENT, lu=False)
                if selected_invite_id:
                    read_qs = read_qs.filter(invite_id=selected_invite_id)
                read_qs.update(lu=True)
        elif invite_id:
            qs = MessageConversation.objects.select_related('invite').filter(invite_id=invite_id)
            if mark_read:
                qs.filter(auteur=MessageConversation.PROTOCOLE, lu=False).update(lu=True)
        else:
            return error('Connexion requise.', status.HTTP_401_UNAUTHORIZED)
        return success({'messages': MessageConversationSerializer(qs, many=True).data})

    data = json_body(request)
    contenu = data.get('contenu', '').strip()
    if not contenu:
        return error('Le message est vide.')

    if protocol_or_admin(request):
        cible_id = data.get('invite_id')
        if not cible_id:
            return error('Choisissez le client a contacter.')
        invite = Invite.objects.get(pk=cible_id)
        auteur = MessageConversation.PROTOCOLE
    elif invite_id:
        config, _ = ConfigurationApplication.objects.get_or_create(pk=1)
        if not config.messages_clients_actifs:
            return error("L'envoi de messages est momentanement bloque par l'administration.")
        invite = Invite.objects.get(pk=invite_id)
        auteur = MessageConversation.CLIENT
    else:
        return error('Connexion requise.', status.HTTP_401_UNAUTHORIZED)

    message = MessageConversation.objects.create(invite=invite, auteur=auteur, contenu=contenu)
    return success({'message': message_to_dict(message)}, status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def conversations(request):
    if not protocol_or_admin(request):
        return error('Acces reserve au protocole et au superadmin.', status.HTTP_403_FORBIDDEN)

    invites = Invite.objects.filter(messages__isnull=False).distinct()
    data = []
    for invite in invites:
        dernier = invite.messages.order_by('-cree_le').first()
        data.append({
            'invite_id': invite.id,
            'invite_nom': invite.nom_complet,
            'categorie_billet': invite.categorie_billet,
            'dernier_message': message_to_dict(dernier) if dernier else None,
        })
    return success({'conversations': data})
