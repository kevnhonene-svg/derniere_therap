from rest_framework import serializers
from dos_app.presence_vocale.models import MouvementPresenceVocale, PresenceVocale


class MouvementPresenceVocaleSerializer(serializers.ModelSerializer):
    type_mouvement_label = serializers.CharField(source='get_type_mouvement_display', read_only=True)
    admin_nom = serializers.SerializerMethodField()

    class Meta:
        model = MouvementPresenceVocale
        fields = ['id', 'type_mouvement', 'type_mouvement_label', 'score', 'admin_nom', 'admin_session', 'cree_le']

    def get_admin_nom(self, obj):
        return obj.admin.username if obj.admin else obj.admin_session


class PresenceVocaleSerializer(serializers.ModelSerializer):
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    total_entrees = serializers.SerializerMethodField()
    total_sorties = serializers.SerializerMethodField()
    dernier_mouvement = serializers.SerializerMethodField()

    class Meta:
        model = PresenceVocale
        fields = [
            'id', 'identifiant', 'phrase_reference', 'score_reference',
            'statut', 'statut_label', 'actif', 'total_entrees', 'total_sorties',
            'dernier_mouvement', 'cree_le', 'mise_a_jour',
        ]

    def get_total_entrees(self, obj):
        return sum(1 for mouvement in obj.mouvements.all() if mouvement.type_mouvement == MouvementPresenceVocale.ENTREE)

    def get_total_sorties(self, obj):
        return sum(1 for mouvement in obj.mouvements.all() if mouvement.type_mouvement == MouvementPresenceVocale.SORTIE)

    def get_dernier_mouvement(self, obj):
        mouvements = list(obj.mouvements.all())
        mouvement = mouvements[0] if mouvements else None
        return MouvementPresenceVocaleSerializer(mouvement).data if mouvement else None


def presence_vocale_to_dict(presence):
    return PresenceVocaleSerializer(presence).data
