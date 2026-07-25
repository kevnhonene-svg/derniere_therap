from rest_framework import serializers
from dos_app.commande.models import Commande, IndicationQuotaBillet, LigneCommande, QuotaBillet
from dos_app.stock.serializers import BoissonSerializer


class QuotaBilletSerializer(serializers.ModelSerializer):
    categorie_billet_label = serializers.CharField(source='get_categorie_billet_display', read_only=True)

    class Meta:
        model = QuotaBillet
        fields = ['id', 'categorie_billet', 'categorie_billet_label', 'nombre_bouteilles', 'actif']


class IndicationQuotaBilletSerializer(serializers.ModelSerializer):
    categorie_billet_label = serializers.CharField(source='get_categorie_billet_display', read_only=True)

    class Meta:
        model = IndicationQuotaBillet
        fields = [
            'id', 'categorie_billet', 'categorie_billet_label', 'titre',
            'nombre_bouteilles_indicatif', 'description', 'actif',
        ]


class LigneCommandeSerializer(serializers.ModelSerializer):
    boisson = BoissonSerializer(read_only=True)

    class Meta:
        model = LigneCommande
        fields = ['id', 'boisson', 'quantite']


class CommandeSerializer(serializers.ModelSerializer):
    invite = serializers.SerializerMethodField()
    statut_label = serializers.CharField(source='get_statut_display', read_only=True)
    total_bouteilles = serializers.IntegerField(read_only=True)
    lignes = LigneCommandeSerializer(many=True, read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'invite', 'statut', 'statut_label', 'note_client',
            'note_protocole', 'total_bouteilles', 'lignes', 'cree_le', 'mise_a_jour',
        ]

    def get_invite(self, obj):
        invite = obj.invite
        return {
            'id': invite.id,
            'nom_complet': invite.nom_complet,
            'categorie_billet': invite.categorie_billet,
            'categorie_billet_label': invite.get_categorie_billet_display(),
            'table': invite.table.nom if invite.table else '',
        }


def quota_to_dict(quota):
    return QuotaBilletSerializer(quota).data


def indication_quota_to_dict(indication):
    if not indication:
        return None
    return IndicationQuotaBilletSerializer(indication).data


def commande_to_dict(commande, request=None):
    return CommandeSerializer(commande, context={'request': request}).data
