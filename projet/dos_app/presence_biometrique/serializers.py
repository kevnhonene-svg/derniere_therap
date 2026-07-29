from rest_framework import serializers
from dos_app.presence_biometrique.models import MouvementPresenceBiometrique, PresenceBiometrique


class MouvementPresenceBiometriqueSerializer(serializers.ModelSerializer):
    type_mouvement_label = serializers.CharField(source='get_type_mouvement_display', read_only=True)
    admin_nom = serializers.SerializerMethodField()

    class Meta:
        model = MouvementPresenceBiometrique
        fields = [
            'id', 'type_mouvement', 'type_mouvement_label', 'admin_nom',
            'admin_session', 'nom_appareil', 'cree_le',
        ]

    def get_admin_nom(self, obj):
        return obj.admin.username if obj.admin else obj.admin_session


class PresenceBiometriqueSerializer(serializers.ModelSerializer):
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    total_entrees = serializers.SerializerMethodField()
    total_sorties = serializers.SerializerMethodField()
    dernier_mouvement = serializers.SerializerMethodField()

    class Meta:
        model = PresenceBiometrique
        fields = [
            'id', 'identifiant', 'statut', 'statut_label', 'nom_appareil',
            'actif', 'total_entrees', 'total_sorties', 'dernier_mouvement',
            'cree_le', 'mise_a_jour',
        ]

    def get_total_entrees(self, obj):
        return sum(1 for mouvement in obj.mouvements.all() if mouvement.type_mouvement == MouvementPresenceBiometrique.ENTREE)

    def get_total_sorties(self, obj):
        return sum(1 for mouvement in obj.mouvements.all() if mouvement.type_mouvement == MouvementPresenceBiometrique.SORTIE)

    def get_dernier_mouvement(self, obj):
        mouvements = list(obj.mouvements.all())
        mouvement = mouvements[0] if mouvements else None
        return MouvementPresenceBiometriqueSerializer(mouvement).data if mouvement else None


def presence_to_dict(presence):
    return PresenceBiometriqueSerializer(presence).data
