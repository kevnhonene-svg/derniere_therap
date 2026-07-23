from rest_framework import serializers
from dos_app.comptes.models import ConfigurationApplication, Invite, TableGala


class TableGalaSerializer(serializers.ModelSerializer):
    places_occupees = serializers.IntegerField(read_only=True)
    places_restantes = serializers.IntegerField(read_only=True)
    est_pleine = serializers.BooleanField(read_only=True)

    class Meta:
        model = TableGala
        fields = ['id', 'nom', 'nombre_places', 'places_occupees', 'places_restantes', 'est_pleine', 'active']


class InviteSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    categorie_billet_label = serializers.CharField(source='get_categorie_billet_display', read_only=True)
    table = TableGalaSerializer(read_only=True)
    table_id = serializers.PrimaryKeyRelatedField(
        queryset=TableGala.objects.all(),
        source='table',
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Invite
        fields = [
            'id', 'nom', 'postnom', 'prenom', 'nom_complet', 'telephone', 'email',
            'code_billet', 'categorie_billet', 'categorie_billet_label', 'table',
            'table_id', 'est_protocole', 'actif',
        ]


class ConfigurationApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationApplication
        fields = ['nom_application', 'nom_evenement', 'sous_titre', 'notice_client']


def table_to_dict(table):
    return TableGalaSerializer(table).data


def invite_to_dict(invite):
    return InviteSerializer(invite).data


def config_to_dict(config):
    return ConfigurationApplicationSerializer(config).data
