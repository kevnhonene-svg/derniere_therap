from django.contrib import admin
from dos_app.commande.models import Commande, IndicationQuotaBillet, LigneCommande, QuotaBillet


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0


@admin.register(QuotaBillet)
class QuotaBilletAdmin(admin.ModelAdmin):
    list_display = ('categorie_billet', 'nombre_bouteilles', 'actif')
    list_filter = ('actif',)


@admin.register(IndicationQuotaBillet)
class IndicationQuotaBilletAdmin(admin.ModelAdmin):
    list_display = ('categorie_billet', 'titre', 'nombre_bouteilles_indicatif', 'actif')
    list_filter = ('actif', 'categorie_billet')
    search_fields = ('titre', 'description')


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('id', 'invite', 'statut', 'total_bouteilles', 'stock_deduit', 'cree_le')
    list_filter = ('statut', 'invite__categorie_billet')
    search_fields = ('invite__nom', 'invite__code_billet')
    inlines = [LigneCommandeInline]
