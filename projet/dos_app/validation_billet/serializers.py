from rest_framework import serializers
from dos_app.validation_billet.models import ValidationBillet


class ValidationBilletSerializer(serializers.ModelSerializer):
    valide_par_nom = serializers.SerializerMethodField()

    class Meta:
        model = ValidationBillet
        fields = ['id', 'numero_personne', 'valide_par_nom', 'valide_par_session', 'cree_le']

    def get_valide_par_nom(self, obj):
        return obj.valide_par.username if obj.valide_par else obj.valide_par_session
