from django.db import models
from django.core.files.base import ContentFile
from PIL import Image, ImageOps
from io import BytesIO


class Boisson(models.Model):
    nom = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=80, blank=True)
    prix_indicatif = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quantite_stock = models.PositiveIntegerField(default=0)
    seuil_alerte = models.PositiveIntegerField(default=5)
    photo = models.ImageField(upload_to='boissons/', blank=True, null=True)
    actif = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom']

    @property
    def est_disponible(self):
        return self.actif and self.quantite_stock > 0

    @property
    def stock_faible(self):
        return self.quantite_stock <= self.seuil_alerte

    def save(self, *args, **kwargs):
        if self.photo and not self.photo.name.lower().endswith('.webp'):
            image = ImageOps.exif_transpose(Image.open(self.photo))
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')

            image.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
            output = BytesIO()
            image.save(output, format='WEBP', quality=82, method=6)
            base_name = self.photo.name.rsplit('.', 1)[0].split('/')[-1]
            self.photo.save(f'{base_name}.webp', ContentFile(output.getvalue()), save=False)

        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.nom} ({self.quantite_stock})'
