from django.db import models


class ConfigurationApplication(models.Model):
    nom_application = models.CharField(max_length=120, default='Gala Doctorat')
    nom_evenement = models.CharField(
        max_length=180,
        default='Derniere fete des etudiants de troisieme doctorat',
    )
    sous_titre = models.CharField(
        max_length=255,
        default="Universite Joseph Kasa-Vubu",
    )
    notice_client = models.TextField(
        default=(
            "Bienvenue. Entrez votre code billet, choisissez vos boissons dans "
            "la limite de votre categorie, puis suivez l'etat de votre commande."
        )
    )
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "configuration de l'application"
        verbose_name_plural = "configuration de l'application"

    def __str__(self):
        return self.nom_application


class TableGala(models.Model):
    nom = models.CharField(max_length=80, unique=True)
    nombre_places = models.PositiveIntegerField(default=1)
    active = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nom']

    @property
    def places_occupees(self):
        return sum(invite.places_table for invite in self.invites.all())

    @property
    def places_restantes(self):
        return max(self.nombre_places - self.places_occupees, 0)

    @property
    def est_pleine(self):
        return self.places_restantes <= 0

    def __str__(self):
        return f'{self.nom} ({self.places_occupees}/{self.nombre_places})'


class Invite(models.Model):
    CLASSIQUE = 'classique'
    VIP_COUPLE = 'vip_couple'
    VIP_CORPS_ACADEMIQUE = 'vip_corps_academique'
    VIP_PREMIUM = 'vip_premium'

    CATEGORIES_BILLET = [
        (CLASSIQUE, 'Classique'),
        (VIP_COUPLE, 'VIP Couple'),
        (VIP_CORPS_ACADEMIQUE, 'VIP corps academique'),
        (VIP_PREMIUM, 'VIP premium'),
    ]

    nom = models.CharField(max_length=80)
    postnom = models.CharField(max_length=80, blank=True)
    prenom = models.CharField(max_length=80, blank=True)
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    code_billet = models.CharField(max_length=40, unique=True)
    categorie_billet = models.CharField(max_length=30, choices=CATEGORIES_BILLET)
    table = models.ForeignKey(
        TableGala,
        related_name='invites',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    est_protocole = models.BooleanField(default=False)
    actif = models.BooleanField(default=True)
    cree_le = models.DateTimeField(auto_now_add=True)
    mise_a_jour = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nom', 'postnom', 'prenom']

    @property
    def nom_complet(self):
        return ' '.join(part for part in [self.nom, self.postnom, self.prenom] if part)

    @property
    def places_table(self):
        if self.categorie_billet in [self.VIP_COUPLE, self.VIP_PREMIUM]:
            return 2
        return 1

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.table:
            places_occupees = sum(invite.places_table for invite in self.table.invites.exclude(pk=self.pk))
            if places_occupees + self.places_table > self.table.nombre_places:
                raise ValidationError({'table': 'Cette table n a pas assez de places disponibles pour ce type de billet.'})

    def __str__(self):
        return f'{self.nom_complet} - {self.get_categorie_billet_display()}'
