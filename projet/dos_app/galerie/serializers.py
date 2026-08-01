from rest_framework import serializers
from dos_app.galerie.models import AlbumGalerie, PhotoGalerie


def absolute_api_url(request, path):
    return request.build_absolute_uri(path) if request else path


def file_url(request, image):
    if not image:
        return ''
    try:
        url = image.url
    except ValueError:
        return ''
    if url.startswith('http://') or url.startswith('https://'):
        return url
    return request.build_absolute_uri(url) if request else url


class AlbumGalerieSerializer(serializers.ModelSerializer):
    nombre_photos = serializers.SerializerMethodField()
    couverture = serializers.SerializerMethodField()

    class Meta:
        model = AlbumGalerie
        fields = [
            'id', 'titre', 'description', 'categorie', 'date_evenement',
            'ordre', 'actif', 'nombre_photos', 'couverture',
        ]

    def get_couverture(self, obj):
        photos = list(getattr(obj, 'active_photos_cache', []))
        photo = photos[0] if photos else obj.photos.filter(actif=True).first()
        if not photo:
            return ''
        request = self.context.get('request')
        return file_url(request, photo.miniature or photo.image) or absolute_api_url(request, f'/api/galerie/photos/{photo.pk}/miniature/')

    def get_nombre_photos(self, obj):
        return getattr(obj, 'nombre_photos', None) or obj.photos.count()


class PhotoGalerieSerializer(serializers.ModelSerializer):
    album_titre = serializers.CharField(source='album.titre', read_only=True)
    image_url = serializers.SerializerMethodField()
    miniature_url = serializers.SerializerMethodField()
    image_proxy_url = serializers.SerializerMethodField()
    miniature_proxy_url = serializers.SerializerMethodField()

    class Meta:
        model = PhotoGalerie
        fields = [
            'id', 'album', 'album_titre', 'titre', 'description', 'image',
            'image_url', 'miniature_url', 'image_proxy_url', 'miniature_proxy_url',
            'photographe', 'lieu', 'mots_cles',
            'moment_fort', 'actif', 'telechargements', 'ordre', 'cree_le',
        ]
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        if not obj.image:
            return ''
        request = self.context.get('request')
        return file_url(request, obj.image) or self.get_image_proxy_url(obj)

    def get_miniature_url(self, obj):
        image = obj.miniature or obj.image
        if not image:
            return ''
        request = self.context.get('request')
        return file_url(request, image) or self.get_miniature_proxy_url(obj)

    def get_image_proxy_url(self, obj):
        request = self.context.get('request')
        return absolute_api_url(request, f'/api/galerie/photos/{obj.pk}/image/')

    def get_miniature_proxy_url(self, obj):
        request = self.context.get('request')
        return absolute_api_url(request, f'/api/galerie/photos/{obj.pk}/miniature/')

    def validate_image(self, value):
        if value and value.size > 12 * 1024 * 1024:
            raise serializers.ValidationError('La photo ne doit pas depasser 12 Mo.')
        return value


def album_to_dict(album, request=None):
    return AlbumGalerieSerializer(album, context={'request': request}).data


def photo_to_dict(photo, request=None):
    return PhotoGalerieSerializer(photo, context={'request': request}).data
