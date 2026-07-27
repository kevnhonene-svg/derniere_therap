from rest_framework import serializers
from dos_app.validation_billet.models import ValidationBillet


class ValidationBilletSerializer(serializers.ModelSerializer):
    valide_par_nom = serializers.SerializerMethodField()
    confirme_par_nom = serializers.SerializerMethodField()
    est_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = ValidationBillet
        fields = [
            'id', 'numero_personne', 'valide_par_nom', 'valide_par_session',
            'cree_le', 'confirme_par_nom', 'confirme_par_session', 'confirme_le',
            'est_complete',
        ]

    def get_valide_par_nom(self, obj):
        return obj.valide_par.username if obj.valide_par else obj.valide_par_session

    def get_confirme_par_nom(self, obj):
        return obj.confirme_par.username if obj.confirme_par else obj.confirme_par_session
