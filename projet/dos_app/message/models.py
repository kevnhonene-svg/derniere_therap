from django.db import models
from dos_app.comptes.models import Invite


class MessageConversation(models.Model):
    CLIENT = 'client'
    PROTOCOLE = 'protocole'

    AUTEURS = [
        (CLIENT, 'Client'),
        (PROTOCOLE, 'Protocole'),
    ]

    invite = models.ForeignKey(Invite, related_name='messages', on_delete=models.CASCADE)
    auteur = models.CharField(max_length=20, choices=AUTEURS)
    contenu = models.TextField()
    lu = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['cree_le']

    def __str__(self):
        return f'{self.get_auteur_display()} - {self.invite.nom_complet}'
