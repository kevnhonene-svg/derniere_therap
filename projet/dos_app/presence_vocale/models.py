from django.conf import settings
from django.db import models


class PresenceVocale(models.Model):
    DANS_SALLE = 'dans_salle'
    SORTI = 'sorti'

    STATUTS = [
        (DANS_SALLE, 'Dans la salle'),
        (SORTI, 'Sorti'),
    ]

    identifiant = models.CharField(max_length=30, unique=True)
    empreinte_vocale = models.JSONField()
    phrase_reference = models.CharField(max_length=180, default='Je confirme ma sortie de la salle')
    score_reference = models.FloatField(default=0)
    statut = models.CharField(max_length=20, choices=STATUTS, default=SORTI)
    actif = models.BooleanField(default=True)
    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='presences_vocales_creees',
    )
    cree_par_session = models.CharField(max_length=120, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-cree_le']

    def __str__(self):
        return self.identifiant


class MouvementPresenceVocale(models.Model):
    ENTREE = 'entree'
    SORTIE = 'sortie'

    TYPES = [
        (SORTIE, 'Sortie'),
        (ENTREE, 'Entree'),
    ]

    presence = models.ForeignKey(PresenceVocale, related_name='mouvements', on_delete=models.CASCADE)
    type_mouvement = models.CharField(max_length=20, choices=TYPES)
    score = models.FloatField(default=0)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='mouvements_presences_vocales',
    )
    admin_session = models.CharField(max_length=120, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']

    def __str__(self):
        return f'{self.presence.identifiant} - {self.get_type_mouvement_display()}'
