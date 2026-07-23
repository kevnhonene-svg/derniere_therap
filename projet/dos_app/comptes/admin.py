from django.contrib import admin
from dos_app.comptes.models import ConfigurationApplication, Invite, TableGala


@admin.register(ConfigurationApplication)
class ConfigurationApplicationAdmin(admin.ModelAdmin):
    list_display = ('nom_application', 'nom_evenement', 'mise_a_jour')


@admin.register(TableGala)
class TableGalaAdmin(admin.ModelAdmin):
    list_display = ('nom', 'nombre_places', 'places_occupees', 'places_restantes', 'active')
    search_fields = ('nom',)
    list_filter = ('active',)


@admin.register(Invite)
class InviteAdmin(admin.ModelAdmin):
    list_display = ('nom_complet', 'code_billet', 'categorie_billet', 'table', 'est_protocole', 'actif')
    search_fields = ('nom', 'postnom', 'prenom', 'code_billet', 'telephone')
    list_filter = ('categorie_billet', 'est_protocole', 'actif')
