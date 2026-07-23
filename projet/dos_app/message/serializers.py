from rest_framework import serializers
from dos_app.message.models import MessageConversation


class MessageConversationSerializer(serializers.ModelSerializer):
    invite_nom = serializers.CharField(source='invite.nom_complet', read_only=True)
    invite_table = serializers.SerializerMethodField()
    auteur_label = serializers.CharField(source='get_auteur_display', read_only=True)

    class Meta:
        model = MessageConversation
        fields = ['id', 'invite_id', 'invite_nom', 'invite_table', 'auteur', 'auteur_label', 'contenu', 'lu', 'cree_le']

    def get_invite_table(self, obj):
        return obj.invite.table.nom if obj.invite.table else 'Sans table'


def message_to_dict(message):
    return MessageConversationSerializer(message).data
