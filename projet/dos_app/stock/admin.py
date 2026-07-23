from django.contrib import admin
from dos_app.stock.models import Boisson


@admin.register(Boisson)
class BoissonAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie', 'quantite_stock', 'seuil_alerte', 'actif')
    search_fields = ('nom', 'categorie')
    list_filter = ('actif', 'categorie')
