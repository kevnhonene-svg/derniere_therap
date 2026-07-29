from django.contrib import admin
from dos_app.presence_biometrique.models import MouvementPresenceBiometrique, PresenceBiometrique


@admin.register(PresenceBiometrique)
class PresenceBiometriqueAdmin(admin.ModelAdmin):
    list_display = ['identifiant', 'statut', 'nom_appareil', 'actif', 'cree_le']
    search_fields = ['identifiant', 'nom_appareil', 'credential_id']
    list_filter = ['statut', 'actif', 'cree_le']


@admin.register(MouvementPresenceBiometrique)
class MouvementPresenceBiometriqueAdmin(admin.ModelAdmin):
    list_display = ['presence', 'type_mouvement', 'admin', 'admin_session', 'cree_le']
    search_fields = ['presence__identifiant', 'admin__username', 'admin_session']
    list_filter = ['type_mouvement', 'cree_le']
