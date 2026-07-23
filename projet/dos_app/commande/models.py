from django.db import models
from django.core.exceptions import ValidationError
from django.db import transaction
from dos_app.comptes.models import Invite
from dos_app.stock.models import Boisson


class QuotaBillet(models.Model):
    categorie_billet = models.CharField(
        max_length=30,
        choices=Invite.CATEGORIES_BILLET,
        unique=True,
    )
    nombre_bouteilles = models.PositiveIntegerField(default=1)
    actif = models.BooleanField(default=True)

    class Meta:
        ordering = ['categorie_billet']

    def __str__(self):
        return f'{self.get_categorie_billet_display()} - {self.nombre_bouteilles}'


class Commande(models.Model):
    EN_ATTENTE = 'en_attente'
    VALIDEE = 'validee'
    LIVREE = 'livree'
    ANNULEE = 'annulee'

    STATUTS = [
        (EN_ATTENTE, 'En attente'),
        (VALIDEE, 'Validee'),
        (LIVREE, 'Livree'),
        (ANNULEE, 'Annulee'),
    ]

    invite = models.ForeignKey(Invite, related_name='commandes', on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUTS, default=EN_ATTENTE)
    note_client = models.TextField(blank=True)
    note_protocole = models.TextField(blank=True)
    stock_deduit = models.BooleanField(default=False)
    cree_le = models.DateTimeField(auto_now_add=True)
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-cree_le']

    @property
    def total_bouteilles(self):
        return sum(ligne.quantite for ligne in self.lignes.all())

    def deduire_stock_si_livree(self):
        if self.statut != self.LIVREE or self.stock_deduit:
            return

        with transaction.atomic():
            lignes = self.lignes.select_related('boisson').select_for_update()
            for ligne in lignes:
                if ligne.boisson.quantite_stock < ligne.quantite:
                    raise ValidationError(f'Stock insuffisant pour {ligne.boisson.nom}.')
            for ligne in lignes:
                ligne.boisson.quantite_stock -= ligne.quantite
                ligne.boisson.save(update_fields=['quantite_stock', 'mise_a_jour'])
            self.stock_deduit = True
            self.save(update_fields=['stock_deduit', 'mise_a_jour'])

    def __str__(self):
        return f'Commande #{self.pk} - {self.invite.nom_complet}'


class LigneCommande(models.Model):
    commande = models.ForeignKey(Commande, related_name='lignes', on_delete=models.CASCADE)
    boisson = models.ForeignKey(Boisson, related_name='lignes_commande', on_delete=models.PROTECT)
    quantite = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('commande', 'boisson')

    def __str__(self):
        return f'{self.boisson.nom} x {self.quantite}'
