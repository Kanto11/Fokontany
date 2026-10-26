from datetime import date
from .models import(Tarif,Cotisation)

def mois_depuis(carnet , jusqu_a = None):
    fin = jusqu_a or date.today()
    a , m = carnet.date_creation.year ,  carnet.date_creation.month
    mois = []

    while(a,m) <= (fin.year,fin.month):
        mois.append((a,m))
        m += 1

        if (m == 13):
            a , m = (a+1) , 1
    return mois

def mois_impayes(carnet , jusqu_a = None):
    paye = set(carnet.cotisation.filter(status_Cot=Cotisation.PAYE).values_list("annee_Cot","mois_Cot"))
    return [am for am in mois_depuis(carnet ,  jusqu_a) if am not in payes]

def tarif_actuel(quartier):
    return (Tarif.objects.filter(quartier=quartier ,  date_debut__lte = date.today()).order_by("date_debut").first())