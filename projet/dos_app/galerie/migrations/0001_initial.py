# Generated manually for the gala gallery module.

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='AlbumGalerie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(max_length=140, unique=True)),
                ('description', models.TextField(blank=True)),
                ('categorie', models.CharField(blank=True, max_length=80)),
                ('date_evenement', models.DateField(blank=True, null=True)),
                ('ordre', models.PositiveIntegerField(default=0)),
                ('actif', models.BooleanField(default=True)),
                ('cree_le', models.DateTimeField(auto_now_add=True)),
                ('mise_a_jour', models.DateTimeField(auto_now=True)),
            ],
            options={'ordering': ['ordre', 'titre']},
        ),
        migrations.CreateModel(
            name='PhotoGalerie',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('titre', models.CharField(blank=True, max_length=140)),
                ('description', models.TextField(blank=True)),
                ('image', models.ImageField(upload_to='galerie/photos/')),
                ('miniature', models.ImageField(blank=True, null=True, upload_to='galerie/miniatures/')),
                ('photographe', models.CharField(blank=True, max_length=120)),
                ('lieu', models.CharField(blank=True, max_length=120)),
                ('mots_cles', models.CharField(blank=True, max_length=220)),
                ('moment_fort', models.BooleanField(default=False)),
                ('actif', models.BooleanField(default=True)),
                ('telechargements', models.PositiveIntegerField(default=0)),
                ('ordre', models.PositiveIntegerField(default=0)),
                ('cree_le', models.DateTimeField(auto_now_add=True)),
                ('mise_a_jour', models.DateTimeField(auto_now=True)),
                ('album', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='galerie.albumgalerie')),
            ],
            options={'ordering': ['ordre', '-cree_le']},
        ),
    ]
