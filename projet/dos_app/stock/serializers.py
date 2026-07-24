from rest_framework import serializers
from dos_app.stock.models import Boisson


class BoissonSerializer(serializers.ModelSerializer):
    est_disponible = serializers.BooleanField(read_only=True)
    stock_faible = serializers.BooleanField(read_only=True)
    MAX_PHOTO_SIZE = 5 * 1024 * 1024

    class Meta:
        model = Boisson
        fields = [
            'id', 'nom', 'description', 'categorie', 'prix_indicatif',
            'quantite_stock', 'seuil_alerte', 'photo', 'actif',
            'est_disponible', 'stock_faible',
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not instance.photo:
            data['photo'] = ''
            return data
        request = self.context.get('request')
        data['photo'] = request.build_absolute_uri(instance.photo.url) if request else instance.photo.url
        return data

    def validate_photo(self, value):
        if value and value.size > self.MAX_PHOTO_SIZE:
            raise serializers.ValidationError('La photo ne doit pas depasser 5 Mo.')
        return value


def boisson_to_dict(boisson, request=None):
    return BoissonSerializer(boisson, context={'request': request}).data
