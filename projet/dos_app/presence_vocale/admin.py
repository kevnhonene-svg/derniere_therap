from django.contrib import admin
from dos_app.presence_vocale.models import MouvementPresenceVocale, PresenceVocale


@admin.register(PresenceVocale)
class PresenceVocaleAdmin(admin.ModelAdmin):
    list_display = ['identifiant', 'statut', 'score_reference', 'actif', 'cree_le']
    search_fields = ['identifiant', 'phrase_reference']
    list_filter = ['statut', 'actif', 'cree_le']


@admin.register(MouvementPresenceVocale)
class MouvementPresenceVocaleAdmin(admin.ModelAdmin):
    list_display = ['presence', 'type_mouvement', 'score', 'admin', 'admin_session', 'cree_le']
    search_fields = ['presence__identifiant', 'admin__username', 'admin_session']
    list_filter = ['type_mouvement', 'cree_le']
