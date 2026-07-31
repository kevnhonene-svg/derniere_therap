from django.contrib import admin
from dos_app.galerie.models import AlbumGalerie, PhotoGalerie


@admin.register(AlbumGalerie)
class AlbumGalerieAdmin(admin.ModelAdmin):
    list_display = ['titre', 'categorie', 'date_evenement', 'actif', 'ordre']
    search_fields = ['titre', 'description', 'categorie']
    list_filter = ['actif', 'categorie', 'date_evenement']


@admin.register(PhotoGalerie)
class PhotoGalerieAdmin(admin.ModelAdmin):
    list_display = ['titre', 'album', 'photographe', 'moment_fort', 'actif', 'telechargements']
    search_fields = ['titre', 'description', 'photographe', 'lieu', 'mots_cles', 'album__titre']
    list_filter = ['actif', 'moment_fort', 'album']
