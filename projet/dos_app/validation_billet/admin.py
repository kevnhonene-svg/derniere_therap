from django.contrib import admin
from dos_app.validation_billet.models import ValidationBillet


@admin.register(ValidationBillet)
class ValidationBilletAdmin(admin.ModelAdmin):
    list_display = ('invite', 'numero_personne', 'valide_par', 'valide_par_session', 'cree_le')
    list_filter = ('invite__categorie_billet', 'cree_le')
    search_fields = ('invite__nom', 'invite__postnom', 'invite__prenom', 'invite__code_billet')
