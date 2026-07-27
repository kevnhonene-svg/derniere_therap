from django.conf import settings
from django.db import models
from dos_app.comptes.models import Invite


class ValidationBillet(models.Model):
    invite = models.ForeignKey(Invite, related_name='validations_billet', on_delete=models.CASCADE)
    numero_personne = models.PositiveSmallIntegerField(default=1)
    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='validations_billets',
    )
    valide_par_session = models.CharField(max_length=120, blank=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-cree_le']
        unique_together = ('invite', 'numero_personne')

    def __str__(self):
        return f'{self.invite.nom_complet} - entree {self.numero_personne}'
