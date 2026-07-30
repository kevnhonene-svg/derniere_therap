# Generated manually for the independent voice presence module.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PresenceVocale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('identifiant', models.CharField(max_length=30, unique=True)),
                ('empreinte_vocale', models.JSONField()),
                ('phrase_reference', models.CharField(default='Je confirme ma sortie de la salle', max_length=180)),
                ('score_reference', models.FloatField(default=0)),
                ('statut', models.CharField(choices=[('dans_salle', 'Dans la salle'), ('sorti', 'Sorti')], default='sorti', max_length=20)),
                ('actif', models.BooleanField(default=True)),
                ('cree_par_session', models.CharField(blank=True, max_length=120)),
                ('cree_le', models.DateTimeField(auto_now_add=True)),
                ('mise_a_jour', models.DateTimeField(auto_now=True)),
                ('cree_par', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='presences_vocales_creees', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-cree_le']},
        ),
        migrations.CreateModel(
            name='MouvementPresenceVocale',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type_mouvement', models.CharField(choices=[('sortie', 'Sortie'), ('entree', 'Entree')], max_length=20)),
                ('score', models.FloatField(default=0)),
                ('admin_session', models.CharField(blank=True, max_length=120)),
                ('cree_le', models.DateTimeField(auto_now_add=True)),
                ('admin', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='mouvements_presences_vocales', to=settings.AUTH_USER_MODEL)),
                ('presence', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='mouvements', to='presence_vocale.presencevocale')),
            ],
            options={'ordering': ['-cree_le']},
        ),
    ]
