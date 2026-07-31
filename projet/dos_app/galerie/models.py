from io import BytesIO

from django.core.files.base import ContentFile
from django.db import models
from PIL import Image, ImageOps


class AlbumGalerie(models.Model):
    titre = models.CharField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=80, blank=True)
    date_evenement = models.DateField(blank=True, null=True)
    ordre = models.PositiveIntegerField(default=0)
    actif = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', 'titre']

    def __str__(self):
        return self.titre


class PhotoGalerie(models.Model):
    album = models.ForeignKey(AlbumGalerie, related_name='photos', on_delete=models.CASCADE)
    titre = models.CharField(max_length=140, blank=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='galerie/photos/')
    miniature = models.ImageField(upload_to='galerie/miniatures/', blank=True, null=True)
    photographe = models.CharField(max_length=120, blank=True)
    lieu = models.CharField(max_length=120, blank=True)
    mots_cles = models.CharField(max_length=220, blank=True)
    moment_fort = models.BooleanField(default=False)
    actif = models.BooleanField(default=True)
    telechargements = models.PositiveIntegerField(default=0)
    ordre = models.PositiveIntegerField(default=0)
    cree_le = models.DateTimeField(auto_now_add=True)
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ordre', '-cree_le']

    def __str__(self):
        return self.titre or f'Photo {self.pk or ""}'

    def save(self, *args, **kwargs):
        if self.image and not self.image.name.lower().endswith('.webp'):
            image = ImageOps.exif_transpose(Image.open(self.image))
            if image.mode not in ('RGB', 'RGBA'):
                image = image.convert('RGB')

            base_name = self.image.name.rsplit('.', 1)[0].split('/')[-1]

            large = image.copy()
            large.thumbnail((2200, 2200), Image.Resampling.LANCZOS)
            large_output = BytesIO()
            large.save(large_output, format='WEBP', quality=86, method=6)
            self.image.save(f'{base_name}.webp', ContentFile(large_output.getvalue()), save=False)

            thumb = image.copy()
            thumb.thumbnail((720, 720), Image.Resampling.LANCZOS)
            thumb_output = BytesIO()
            thumb.save(thumb_output, format='WEBP', quality=78, method=6)
            self.miniature.save(f'{base_name}_mini.webp', ContentFile(thumb_output.getvalue()), save=False)

        super().save(*args, **kwargs)
