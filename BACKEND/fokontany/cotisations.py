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
    payes = set(carnet.cotisation.filter(status_Cot=Cotisation.PAYE).values_list("annee_Cot","mois_Cot"))
    return [am for am in mois_depuis(carnet ,  jusqu_a) if am not in payes]

def tarif_actuel(quartier):
    return (Tarif.objects.filter(quartier=quartier ,  date_debut__lte = date.today()).order_by("-date_debut").first())


def tarifs_cotisations(quartier) :
    return list(Tarif.objects.filter(quartier = quartier,nom_Tf = "Cotisations par mois" ).order_by("date_debut"))

def tarif_du_mois(tarifs,annee,mois):
    trouve = None
    for t in tarifs :
        if (t.date_debut.year, t.date_debut.month) <= (annee ,mois):
            trouve = t
        else: 
            break
    return trouve

def prix_du_mois(tarifs,annee,mois):
    t =  tarif_du_mois(tarifs,annee,mois)
    return t.prix_Tf if t else None

def situation_carnet(carnet  , tarifs ,  aujourdhui=None):
    aujourdhui =  aujourdhui or date.today()
    payes = {(c.annee_Cot ,c.mois_Cot) for c in carnet.cotisations.all()
        if c.status_Cot == "PAYE"}

    impayes = []
    a , m = carnet.date_creation.year , carnet.date_creation.month
    while (a,m) <= (aujourdhui.year , aujourdhui.month):
        if (a,m) not in payes :
            prix =  prix_du_mois(tarifs ,a ,m)
            if prix is not None :
                impayes.append({"annee":a , "mois" : m ,"prix" : float(prix)})
        m += 1
        if m == 13 :
            a , m = a+1 , 1

    return impayes, (max(payes) if payes else None)

def tarif_residence(quartier,jour=None):
    jour = jour or date.today()
    return (Tarif.objects.filter(quartier=quartier, nom_Tf = "Demande de residence" ,date_debut__lte=jour).order_by("-date_debut").first())

def controle_auto(residence):
    raisons = []
    carnet = residence.carnet
    quartier = carnet.logement.secteur.quartier
    impayes, _ = situation_carnet(carnet,tarifs_cotisations(quartier))
    if impayes:
        raisons.append(f"{len(impayes)}")
    return raisons
