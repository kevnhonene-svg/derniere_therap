from django.contrib import admin
from dos_app.message.models import MessageConversation


@admin.register(MessageConversation)
class MessageConversationAdmin(admin.ModelAdmin):
    list_display = ('invite', 'auteur', 'lu', 'cree_le')
    search_fields = ('invite__nom', 'invite__code_billet', 'contenu')
    list_filter = ('auteur', 'lu')
