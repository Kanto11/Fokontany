from django.contrib import admin

from .models import (
    Type, User, Quartier, Secteur, Logement, Nationalite, Profession,
    TypeResponsable, Responsable, Parent, Carnet, Enfant, PieceIdentite,
    Tarif, Paiement, Cotisation, Residence, Message, Publication,
)

for modele in (Type, User, Quartier, Secteur, Logement, Nationalite, Profession,
               TypeResponsable, Responsable, Parent, Carnet, Enfant, PieceIdentite,
               Tarif, Paiement, Cotisation, Residence, Message, Publication):
    admin.site.register(modele)