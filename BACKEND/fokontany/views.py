from django.db import transaction, IntegrityError
import traceback
from django.shortcuts import render
from rest_framework.response import Response
from datetime import date
from django.utils.dateparse import parse_date
from decimal import Decimal
from django.core.paginator import Paginator ,EmptyPage,PageNotAnInteger
from django.http import HttpResponse

from rest_framework.views import APIView;
from rest_framework.generics import ListAPIView;
from rest_framework.generics import ListCreateAPIView;
from rest_framework.generics import RetrieveAPIView;
from rest_framework.permissions import AllowAny

from django.db.models import Q ,Sum
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework.permissions import IsAuthenticated
from .auth_api import EstResponsable
from .auth_api import EstHabitant
from .auth_api import  EstAuteurPublication
from .cotisations import  tarif_residence, controle_auto,mois_depuis ,situation_carnet,tarifs_cotisations, tarif_actuel , tarif_du_mois
from .serializers import ( ResidenceBureauSerializer,ResidenceDemandeSerializer,ResidenceHabitantSerializer,PaiementEspeceSerializer,LogementCreateSerializer,CarnetDetailSerializer,CarnetListSerializer,SecteurSerializer,PhotoSerializer,PublicationSerializer,PublicationCreateSerializer,MessageSerializer,MessageCreateSerializer,ResponsableSerializer,CarnetCreateSerializer,CarnetUpdateSerializer,NationaliteSerializer,LogementSerializer,QuartierSerializer,ProfessionSerializer,CarnetImpayeSerializer,PaiementEspeceSerializer)
from .certificat import *
from .models import *



class MoiView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request):
        user = request.user
        responsable = getattr(user , "responsable" , None)
        parent = getattr(user, "parent" ,  None)

        if responsable :
            nom , prenom , photo = responsable.nom_R , responsable.prenom_R ,  responsable.photo
            fonction = responsable.type_responsable.nom_TR
        elif parent :
            nom , prenom , photo = parent.nom_P , parent.prenom_P,parent.photo 
            fonction=None
        else : 
            nom ,prenom , photo,fonction = "" , "" ,None ,None

        return Response({"email":request.user.email ,
                         "type":request.user.type.nom_T,
                         "nom":nom,
                         "prenom" : prenom,
                         "fonction" : fonction,
                         "photo" : request.build_absolute_uri(photo.url) if photo else None})

class CarnetCreateView(APIView):
    permission_classes = [EstResponsable]
    serializer_class = CarnetCreateSerializer
    def post(self,request):
        s = CarnetCreateSerializer(data = request.data, context={"request": request})
        s.is_valid(raise_exception = True)
        carnet = s.save()

        return Response({
            "id" : carnet.id,
            "token" : str(carnet.token),
            "qr_code": request.build_absolute_uri(carnet.qr_code.url),
            "pere": carnet.pere_id,
            "mere": carnet.mere_id,
            "enfants": list(carnet.enfants.order_by("id").values_list("id", flat=True)),
        }, status=201)

    def get(self, request):
        quartier = request.user.responsable.quartier
        carnets = (Carnet.objects
                   .filter(logement__secteur__quartier=quartier)
                   .select_related("logement__secteur", "pere", "mere")
                   .order_by("-id"))

        q = request.query_params.get("q", "").strip()


        if q:
            filtre = (Q(pere__nom_P__icontains=q) | Q(pere__prenom_P__icontains=q)
                      | Q(mere__nom_P__icontains=q) | Q(mere__prenom_P__icontains=q))
            if q.isdigit():
                filtre |= Q(id=int(q))           
            carnets = carnets.filter(filtre)

        secteur = request.query_params.get("secteur", "")
        if secteur.isdigit():
            carnets = carnets.filter(logement__secteur_id=int(secteur))

        profession = request.query_params.get("profession", "")
        if profession.isdigit():
            carnets = carnets.filter(Q(pere__profession_id=int(profession))
                                     | Q(mere__profession_id=int(profession)))
        
        elements_par_page = 4
        paginator =Paginator(carnets,elements_par_page)
        numero_page = request.query_params.get('page',1)

        try:
            page_actuelle = paginator.page(numero_page)
        except PageNotAnInteger:
            page_actuelle = paginator.page(1)
        except EmptyPage:
            page_actuielle = paginator.page(paginator.num_pages)
        serializer = CarnetListSerializer(page_actuelle.object_list,many=True)


        return Response({
            "count" : paginator.count,
            "total_pages" : paginator.num_pages,
            "current_page" : page_actuelle.number,
            "has_next" : page_actuelle.has_next(),
            "has_previous" : page_actuelle.has_previous(),
            "results" : serializer.data

        })

class NationaliteListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Nationalite.objects.order_by("nationalite")
    serializer_class = NationaliteSerializer

class ProfessionListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Profession.objects.order_by("nom_Prof")
    serializer_class = ProfessionSerializer

class QuartierListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Quartier.objects.order_by("nom_Q")
    serializer_class = QuartierSerializer

class LogementListView(ListCreateAPIView):
    permission_classes = [EstResponsable]

    def get_serializer_class(self):
        if self.request.method =="POST":
            return LogementCreateSerializer
        return LogementSerializer

    def get_serializer_context(self):
        ctx = super() .get_serializer_context()
        ctx["quartier"] = quartier_de(self.request.user)
        return ctx

    def get_queryset(self):
        quartier = quartier_de(self.request.user)
        return Logement.objects.filter(secteur__quartier_id = quartier).order_by("adr_Log")   



class CotisationHabitantView(APIView):
    permission_classes = [EstHabitant]

    def get(self , request):
        parent = getattr(request.user , "parent" ,None )
        carnet = parent.carnet if parent else None

        if carnet is None :
            return Response({"detail": "Aucun carnet lié à ce compte"}, status=400)

        payes = set(carnet.cotisations.filter(status_Cot= Cotisation.PAYE).values_list("annee_Cot","mois_Cot"))
        mois = [{"annee": a , "mois":m , "status" : "PAYE" if (a,m) in payes else "IMPAYE"} for a,m in mois_depuis(carnet)]

        nb  = sum(1 for x in mois if x["status"]=="IMPAYE")
        tarif = tarif_actuel(carnet.logement.secteur.quartier)
        return Response({
            "carnet" : carnet.id,
            "montant_mensuel" : tarif.prix_Tf if tarif else None,
            "nb_impaye" : nb ,
            "total_du" : tarif.prix_Tf * nb if tarif else None,
            "mois" : mois,
        })

class CotisationResponsableView(APIView):
    permission_classes = [EstResponsable]

    def get(self,request) :
        quartier = quartier_de(request.user)
        aujourdhui = date.today()
        tarifs = tarifs_cotisations(quartier) 

        carnets =  (Carnet.objects.filter(logement__secteur__quartier = quartier).select_related("logement__secteur" ,"pere" , "mere").prefetch_related("cotisations")) 

        lignes = []
        for c in carnets:
            impayes,dernier = situation_carnet(c, tarifs , aujourdhui)
            chef =  c.pere or c.mere
            lignes.append({
                "carnet_id" : c.id,
                "chef" : f"{chef.nom_P} {chef.prenom_P}" if chef else "_",
                "secteur" : c.logement.secteur.nom_S or f"Secteur {c.logement.secteur_id}",
                "secteur_id" : c.logement.secteur_id,
                "dernier_mois_paye" : f"{dernier[0]}-{dernier[1]:02d}" if dernier else None,
                "nb_impayes" : len(impayes),
                "montant_du" : sum(float(i["prix"]) for i in impayes),
                "mois_impayes" : impayes
            })  

            #compteur
        encaisse = (Paiement.objects
                .filter(carnet__logement__secteur__quartier = quartier , status_Pay="VALIDE" , tarif__nom_Tf = "Cotisations par mois", date_Pay__year = aujourdhui.year , date_Pay__month =  aujourdhui.month)
                .aggregate(t = Sum("montant"))["t"] or 0)

        resume = {
                "encaisse_mois" : float(encaisse),
                "familles_a_jour" : sum(1 for l in lignes if l["nb_impayes"] == 0 ),
                "familles_en_retard" : sum(1 for l in lignes if l["nb_impayes"] > 0),

            }

            #filtres
        q =  request.query_params.get("q" , "").strip().lower()
        secteur =  request.query_params.get("secteur" , "")
        statut = request.query_params.get("statut" , "retard")

        if q :
            lignes = [l for l in lignes if q in l["chef"].lower()]

        if secteur :
            lignes = [l for l in lignes if str(l["secteur_id"]) == secteur]

        if statut == "retard":
            lignes = [l for l in lignes if l["nb_impayes"] > 0]

        elif statut == "jour" :
            lignes = [l for l in lignes if l["nb_impayes"] == 0]

        lignes.sort(key = lambda l:l["nb_impayes"], reverse = True)
        return Response ({"resume" : resume,"resultats" :lignes})

class ImpayeView(APIView):
    permission_classes = [EstResponsable]

    def get(self,request):
        today = date.today()

        try:
            annee = int(request.query_params.get("annee" ,today.year))
            mois = int(request.query_params.get("mois",today.month))

        except ValueError:
            return Response({"detail": "annee et mois doivent etre des nombres"},status=400)

        if not 1 <= mois <= 12:
             return Response({"detail": "mois doit être entre 1 et 12."}, status=400)

        quartier =  request.user.responsable.quartier
        payes = (Cotisation.objects.filter(status_Cot=Cotisation.PAYE ,annee_Cot=annee , mois_Cot=mois).values("carnet_id"))
        carnets =(Carnet.objects.filter(logement__secteur__quartier=quartier , statut = "ACTIF").filter(Q(date_creation__year__lt=annee)
                           | Q(date_creation__year=annee, date_creation__month__lte=mois))
                            .exclude(id__in=payes)
                            .select_related("logement", "pere", "mere")
                            .order_by("logement__adr_Log"))
        return Response({
            "annee" : annee, "mois" : mois , "nombre" : carnets.count(),
            "carnets": CarnetImpayeSerializer(carnets, many=True).data,
        })


class PaiementEspecesView(APIView):
    permission_classes = [EstResponsable]

    def post(self, request):
        responsable = request.user.responsable
        s = PaiementEspeceSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        carnet = d["carnet"]

        quartier = carnet.logement.secteur.quartier
        if quartier.id != responsable.quartier_id:
            return Response({"detail": "Ce carnet n'est pas dans ton quartier."}, status=403)

        tarif = tarifs_cotisations(quartier)
        if not tarif:
            return Response({"detail": "Aucun tarif défini pour ce quartier."}, status=400)

        demandes = {(x["annee"], x["mois"]) for x in d["mois"]}
        if len(demandes) != len(d["mois"]):
            return Response({"detail": "Un mois est répété dans la liste."}, status=400)


        deja = set(carnet.cotisations.filter(status_Cot=Cotisation.PAYE)
                   .values_list("annee_Cot", "mois_Cot"))
        if demandes & deja:
            return Response({"detail": "Certains mois sont déjà payés.",
                             "mois": sorted(demandes & deja)}, status=400)
        total = sum(tarif_du_mois(tarif,a,m).prix_Tf for a ,m in demandes)
        tarif = tarif_du_mois(tarif ,*max(demandes))
        
        try:
            with transaction.atomic():          
                paiement = Paiement.objects.create(
                    carnet=carnet, responsable=responsable, tarif=tarif,
                    mode_Pay="ESPECES", reference_Pay=d.get("reference", ""),
                    status_Pay="VALIDE", 
                    montant= total)
                for a, m in sorted(demandes):
                    cot, _ = Cotisation.objects.get_or_create(
                        carnet=carnet, annee_Cot=a, mois_Cot=m)
                    cot.paiement = paiement
                    cot.status_Cot = Cotisation.PAYE
                    cot.save()
        except IntegrityError:
            return Response({"detail": "Cette référence de reçu existe déjà."}, status=400)

        return Response({
            "paiement": paiement.id, "montant":  float(paiement.montant),
            "mois_payes": sorted(demandes),
        }, status=201)


def quartier_de(user):
        responsable = getattr(user, "responsable", None)
        if responsable:
            return responsable.quartier
        parent = getattr(user, "parent", None)
        carnet = parent.carnet if parent else None
        return carnet.logement.secteur.quartier if carnet else None


class ResponsablesQuartierView(ListAPIView):
    permission_classes = [EstHabitant]
    serializer_class = ResponsableSerializer

    def get_queryset(self):
        quartier = quartier_de(self.request.user)
        if quartier is None:
            return Responsable.objects.none()
        return Responsable.objects.filter(quartier=quartier).select_related("type_responsable")


class MessageHabitantView(APIView):
    permission_classes = [EstHabitant]

    def get(self, request):
        parent = getattr(request.user, "parent", None)
        if parent is None:
            return Response({"detail": "Aucun parent lié à ce compte."}, status=400)
        messages = (Message.objects.filter(expediteur=parent)
                    .select_related("expediteur", "destinataire").order_by("-date_envoi"))
        return Response(MessageSerializer(messages, many=True).data)

    def post(self, request):
        parent = getattr(request.user, "parent", None)
        quartier = quartier_de(request.user)
        if parent is None or quartier is None:
            return Response({"detail": "Aucun carnet lié à ce compte."}, status=400)
        s = MessageCreateSerializer(data=request.data, context={"quartier": quartier})
        s.is_valid(raise_exception=True)
        message = s.save(expediteur=parent)
        return Response(MessageSerializer(message).data, status=201)


class MessagesRecusView(ListAPIView):
    """Messages reçus. Filtre possible : ?lu=false"""
    permission_classes = [EstResponsable]
    serializer_class = MessageSerializer

    def get_queryset(self):
        qs = (Message.objects.filter(destinataire=self.request.user.responsable)
              .select_related("expediteur", "destinataire").order_by("-date_envoi"))
        if self.request.query_params.get("lu") == "false":
            qs = qs.filter(lu=False)
        return qs

class MessageLuView(APIView):
    permission_classes = [EstResponsable]

    def post(self, request, pk):
        message = get_object_or_404(Message, pk=pk, destinataire=request.user.responsable)
        message.lu = True
        message.save()
        return Response(MessageSerializer(message).data)


class PublicationView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [EstResponsable()]       
        return [IsAuthenticated()]          

    def get(self, request):
        quartier = quartier_de(request.user)
        if quartier is None:
            return Response([])
        publications = (Publication.objects.filter(quartier=quartier)
                        .select_related("responsable").order_by("-date_Pub"))
        
        #Nom
        nom = request.query_params.get("responsable","").strip()
        for mot in nom.split():
            publications = publications.filter(
                Q(responsable__nom_R__icontains=mot) |
                Q(responsable__prenom_R__icontains=mot)
            )

        #Date
        date_debut = parse_date(request.query_params.get("date_debut",""))
        date_fin = parse_date(request.query_params.get("date_fin",""))

        if date_debut:
            publications = publications.filter(date_Pub__date__gte=date_debut)
        if date_fin:
            publications = publications.filter(date_Pub__date__lte=date_fin)


        return  Response(PublicationSerializer(publications, many=True, context={"request": request}).data)
    
    def post(self, request):
        responsable = request.user.responsable
        s = PublicationCreateSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        publication = s.save(quartier=responsable.quartier, responsable=responsable)
        return  Response(PublicationSerializer(publication, context={"request": request}).data ,status=201)
class PublicationDetailView(APIView):
    permission_classes = [IsAuthenticated , EstAuteurPublication]

    def patch(self ,request,pk):
        publication = get_object_or_404(Publication , pk=pk)
        self.check_object_permissions(request , publication)
        serializer = PublicationSerializer(
            publication,                      
            data=request.data,                
            partial=True,                     
            context={"request": request},     
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



def _enregistrer_photo(request,personne,carnet):
    responsable = request.user.responsable

    if carnet is None or carnet.logement.secteur.quartier_id != responsable.quartier_id:
        return Response({"detail" : "Cette personne n'est pas dans ton quartier."},status =403)

    s = PhotoSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    personne.photo = s.validated_data["photo"]
    personne.save()
    return Response({"photo" : request.build_absolute_uri(personne.photo.url)})

class PhotoParentView(APIView):
    permission_classes = [EstResponsable]
    
    def post(self,request,pk):
        parent =  get_object_or_404(Parent, pk=pk)
        return _enregistrer_photo(request,parent , parent.carnet)


class PhotoEnfantView(APIView):
    permission_classes = [EstResponsable]

    def post(self,request,pk):
        enfant = get_object_or_404(Enfant , pk=pk)
        return _enregistrer_photo(request,enfant,enfant.carnet)

class SecteurListView(ListAPIView):
    permission_classes = [EstResponsable]
    serializer_class = SecteurSerializer

    def get_queryset(self):
        return Secteur.objects.filter(
            quartier=self.request.user.responsable.quartier).order_by("nom_S")

class CarnetDetailView(RetrieveAPIView):
    permission_classes = [EstResponsable]
    serializer_class = CarnetDetailSerializer

    def get_queryset(self):
        quartier = self.request.user.responsable.quartier
        return (
            Carnet.objects
            .filter(logement__secteur__quartier=quartier)
            .select_related(
                "pere",
                "mere",
                "logement",
                "logement__secteur",
            )
            .prefetch_related(
                "enfants__profession",
                "enfants__nationalite",
            )
        )

    def patch(self, request, *args, **kwargs):
        carnet = self.get_object()
        serializer = CarnetUpdateSerializer(
            carnet,
            data=request.data,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        carnet = serializer.save()
        carnet.refresh_from_db()

        response_data = CarnetDetailSerializer(
            carnet,
            context={"request": request},
        ).data
        response_data["enfants_ids"] = serializer.enfants_ids
        return Response(response_data)


class ResidenceHabitantView(APIView) :
    permission_classes = [EstHabitant]

    def get(self,request):
        parent = request.user.parent
        qs = (Residence.objects.filter(demandeur = parent).select_related("parent_concerne" ,"enfant_concerne").order_by("-id"))
        return Response(ResidenceHabitantSerializer(
            qs, many = True , context={"request" : request}
        ).data)

    def post(self,request):
        parent = request.user.parent
        s = ResidenceDemandeSerializer(data = request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        carnet = parent.carnet
        quartier = carnet.logement.secteur.quartier

        tarif =  tarif_residence(quartier)
        if tarif is None:
            return Response({"detail": "Le tarif de la residence n'est pas encore defini"},status=400)

        #cotisations a jour obligatoires

        impayes,_=situation_carnet(carnet,tarifs_cotisations(quartier))
        if impayes :
            return Response({
                "detail" : "Tu as des cotisations impayes a regler d'abord."
                ,"code" : "impayes" , "mois" :impayes,
                "montant_du" : sum(i["prix"] for i in impayes)
            },status=400)

        en_cours = Residence.objects.filter(carnet=carnet , parent_concerne = d.get("parent_concerne"),
        enfant_concerne =  d.get("enfant_concerne")
        ).filter(Q(status__in=["A_PAYER" , "EN_ATTENTE"]) | Q(status="VALIDE" , revoquee= False, valable_jusqu_au__gte=date.today()))

        if en_cours.exists():
            return Response({"detail" : "Une demande ou un certificat valable existe deja pour cette personne"},status = 400)

        r =  Residence(carnet=carnet , demandeur=parent , motif=d["motif"],parent_concerne = d.get("parent_concerne") , enfant_concerne = d.get("enfant_concerne"))

        try:
            r.full_clean()
        except DjangoValidationError as e :
            return Response({"detail": e.messages},status=400)
        r.save()
        return Response({"id" : r.id , "status" : r.status , "montant_a_payer" : float(tarif.prix_Tf)}, status=201)

class ResidenceEncaisserView(APIView):
        permission_classes = [EstResponsable]

        def post(self, request , pk):
            responsable = request.user.responsable
            residence =  get_object_or_404(Residence, pk = pk)
            quartier = residence.carnet.logement.secteur.quartier
            if quartier.id != responsable.quartier_id:
                return Response({"detail" : "Cette demande n'est pas dans ton quartier"},status = 403)

            if residence.status != "A_PAYER":
                return Response({"detail" : "Cette demande n'est pas dans ton quartier"} , status=400)

            tarif = tarif_residence(quartier)
            if tarif is None:
                return Response({"detail": "Le tarif de la résidence n'est pas défini."}, status=400)

            try:
                with transaction.atomic():
                    paiement, blocages = encaisser_residence(
                    residence, responsable, request.data.get("reference", ""))
            except IntegrityError:
                return Response({"detail": "Cette référence de reçu existe déjà."}, status=400)
            return Response({"status" : residence.status, "blocages" : blocages,"montant" : float(paiement.montant)}, status=201)

def demande_en_cours(carnet, parent_concerne, enfant_concerne):
    return (Residence.objects
            .filter(carnet=carnet, parent_concerne=parent_concerne,
                    enfant_concerne=enfant_concerne)
            .filter(Q(status__in=["A_PAYER", "EN_ATTENTE"]) |
                    Q(status="VALIDE", revoquee=False, valable_jusqu_au__gte=date.today()))
            .exists())

def encaisser_residence(residence, responsable, reference=""):
    quartier = residence.carnet.logement.secteur.quartier
    tarif = tarif_residence(quartier)
    paiement = Paiement.objects.create(
        carnet=residence.carnet, parent=residence.demandeur, responsable=responsable,
        tarif=tarif, mode_Pay="ESPECES", reference_Pay=reference,
        status_Pay="VALIDE", montant=tarif.prix_Tf)
    residence.paiement = paiement
    residence.status = "EN_ATTENTE"
    residence.save()
    blocages = controle_auto(residence)
    if not blocages:
        residence.valider(responsable=responsable, auto=True)        
    return paiement, blocages

def _ligne_residence(r, request):
    p = r.parent_concerne or r.enfant_concerne
    nom = f"{p.nom_P} {p.prenom_P}" if r.parent_concerne else f"{p.nom_Ef} {p.prenom_Ef}"
    chef = r.carnet.pere or r.carnet.mere
    return {
        "id": r.id,
        "personne": nom,
        "photo": request.build_absolute_uri(p.photo.url) if p.photo else None,
        "famille": f"{chef.nom_P} {chef.prenom_P}" if chef else "_",
        "secteur": r.carnet.logement.secteur.nom_S,
        "motif": r.motif,
        "status": r.status,
        "revoquee": r.revoquee,
        "date_demande": r.date_Resid,
        "date_validation": r.date_validation,
        "valable_jusqu_au": r.valable_jusqu_au,
        "validation_auto": r.validation_auto,
        "motif_refus": r.motif_refus,
        "montant_paye": float(r.paiement.montant) if r.paiement else None,
        "blocages": controle_auto(r) if r.status == "EN_ATTENTE" else [],
    }




class ResidenceBureauView(APIView):
    permission_classes = [EstResponsable]

    def post(self, request):
        responsable = request.user.responsable
        s = ResidenceBureauSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        carnet = d["carnet"]

        try:
            quartier = carnet.logement.secteur.quartier
            if quartier.id != responsable.quartier_id:
                return Response({"detail": "Ce carnet n'est pas dans ton quartier."}, status=403)
            if tarif_residence(quartier) is None:
                return Response({"detail": "Le tarif de la résidence n'est pas défini."}, status=400)
            if demande_en_cours(carnet, d.get("parent_concerne"), d.get("enfant_concerne")):
                return Response({"detail": "Une demande ou un certificat valable existe déjà pour cette personne."}, status=400)

            r = Residence(carnet=carnet, demandeur=d["demandeur"], motif=d["motif"], status="A_PAYER",
                          parent_concerne=d.get("parent_concerne"),
                          enfant_concerne=d.get("enfant_concerne"))
            
            try:
                r.full_clean()       
            except DjangoValidationError as e:
                return Response({"detail": e.messages}, status=400)

            blocages = []
            try:
                with transaction.atomic():
                    r.save()
                    if d["paye"]:
                        _, blocages = encaisser_residence(r, responsable, d.get("reference", ""))
            except IntegrityError:
                return Response({"detail": "Cette référence de reçu existe déjà."}, status=400)

            return Response({"id": r.id, "status": r.status, "blocages": blocages}, status=201)

        except Exception as e:
            print("--- DEBUT DU CRASH DETECTE ---")
            print(traceback.format_exc())
            print("--- FIN DU CRASH DETECTE ---")
            
            
            return Response({"detail": f"Erreur interne interceptée : {str(e)}"}, status=500)

class ResidenceResponsableListView(APIView):
    permission_classes = [EstResponsable]

    def get(self, request):
        quartier = quartier_de(request.user)
        base = (Residence.objects
                .filter(carnet__logement__secteur__quartier=quartier)
                .select_related("carnet__logement__secteur", "carnet__pere", "carnet__mere",
                                "parent_concerne", "enfant_concerne", "paiement"))

        compteurs = {
            "A_PAYER": base.filter(status="A_PAYER").count(),
            "EN_ATTENTE": base.filter(status="EN_ATTENTE").count(),
            "VALIDE": base.filter(status="VALIDE", revoquee=False).count(),
            "REFUSE": base.filter(status="REFUSE").count(),
            "REVOQUEE": base.filter(revoquee=True).count(),
        }

        statut = request.query_params.get("statut", "EN_ATTENTE")
        if statut == "REVOQUEE":
            qs = base.filter(revoquee=True)
        elif statut == "VALIDE":
            qs = base.filter(status="VALIDE", revoquee=False)
        elif statut in ("A_PAYER", "EN_ATTENTE", "REFUSE"):
            qs = base.filter(status=statut)
        else:                                   # "tous"
            qs = base

        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(
                Q(parent_concerne__nom_P__icontains=q) | Q(parent_concerne__prenom_P__icontains=q)
                | Q(enfant_concerne__nom_Ef__icontains=q) | Q(enfant_concerne__prenom_Ef__icontains=q)
                | Q(carnet__pere__nom_P__icontains=q) | Q(carnet__mere__nom_P__icontains=q))

        paginator = Paginator(qs.order_by("-id"), 4)
        page = paginator.get_page(request.query_params.get("page"))
        return Response({
            "compteurs": compteurs,
            "resultats": [_ligne_residence(r, request) for r in page],
            "pagination": {"page": page.number, "pages": paginator.num_pages,
                           "total": paginator.count},
        })

class ResidenceTraiterView(APIView):
    permission_classes = [EstResponsable]

    def post(self, request, pk):
        responsable = request.user.responsable
        r = get_object_or_404(Residence, pk=pk)
        if r.carnet.logement.secteur.quartier_id != responsable.quartier_id:
            return Response({"detail": "Cette demande n'est pas dans ton quartier."}, status=403)

        action = request.data.get("action")
        motif = (request.data.get("motif") or "").strip()

        if action == "valider":
            if r.status != "EN_ATTENTE":
                return Response({"detail": "Cette demande n'est pas en attente."}, status=400)
            r.valider(responsable=responsable)
        elif action == "refuser":
            if r.status != "EN_ATTENTE":
                return Response({"detail": "Cette demande n'est pas en attente."}, status=400)
            if not motif:
                return Response({"detail": "Le motif du refus est obligatoire."}, status=400)
            r.status, r.motif_refus, r.traite_par = "REFUSE", motif, responsable
            r.save()
        elif action == "revoquer":
            if r.status != "VALIDE" or r.revoquee:
                return Response({"detail": "Ce certificat n'est pas valide."}, status=400)
            if not motif:
                return Response({"detail": "Le motif de la révocation est obligatoire."}, status=400)
            r.revoquee, r.motif_refus, r.traite_par = True, motif, responsable
            r.save()
        else:
            return Response({"detail": "Action inconnue."}, status=400)

        return Response({"id": r.id, "status": r.status, "revoquee": r.revoquee})

def trouver_residence(code):
    code = code.strip()
    if code.upper().startswith("RES-"):
        try:
            _,num,cle=code.upper().split("-")
            r=Residence.objects.get(pk=int(num))
        except (ValueError,Residence.DoesNotExist):
            return None
        return r if r.numero.endswith(cle) else None
    
    try:
        return Residence.objects.get(token=code)
    except(Residence.DoesNotExist,ValueError,ValidationError):
        return None

class VerifierResidenceView(APIView):
    permission_classes = [AllowAny]
    authentification_classes = []

    def get(self,request,code):
        r = trouver_residence(code)
        if r is None or r.status != "VALIDE":
            return Response({"detail":"Aucun certificat "},status=404)

        if r.revoquee:
            etat = "REVOQUEE"
        elif not r.est_valable:
            etat = "EXPIREE"
        else:
            etat = "VALIDE"

        p = r.parent_concerne or r.enfant_concerne
        photo = getattr(p,"photo_P",None) or getattr(p,"photo_Ef",None)
        return Response({
            "etat" : etat,
            "numero" : r.numero,
            "nom" : getattr(p,"nom_P",None) or getattr(p,"nom_Ef",None),
            "prenom" : getattr(p,"prenom_P",None) or getattr(p,"prenom_Ef",None),
            "photo": request.build_absolute_uri(photo.url) if photo else None,
            "date_validation" : r.date_validation,
            "valable_jusqu_au" : r.valable_jusqu_au,
            "motif_revocation" : getattr(r,"motif_refus","") if etat == "REVOQUEE" else "",
        })

class CarnetPersonnesView(APIView):
    permission_classes = [EstResponsable]
    def get(self,request,pk):
        quartier = quartier_de(request.user)
        carnet =  get_object_or_404(Carnet , pk=pk , logement__secteur__quartier = quartier)
        parents = []

        if carnet.pere : 
            parents.append({"id" : carnet.pere.id , "role" : "Pere", "nom":f"{carnet.pere.nom_P} {carnet.pere.prenom_P}"})

        if carnet.mere : 
            parents.append({"id" : carnet.mere.id , "role" : "Mere" , "nom" : f"{carnet.mere.nom_P} {carnet.mere.prenom_P}"})

        enfants = [{"id" : e.id, "nom" : f"{e.nom_Ef} {e.prenom_Ef}"}
            for e in carnet.enfants.all()]
        return Response({"parents": parents ,"enfants" : enfants})

class ResidencePdfView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self,request ,pk):
        residence = get_object_or_404(Residence,pk=pk)
        carnet = residence.carnet
        user = request.user

        if user.type.nom_T == "RESPONSABLE":
            autorise = (carnet.logement.secteur.quartier_id == user.responsable.quartier_id )

        else:
            parent = getattr(user , "parent",None)
            autorise = parent is not None and parent.id in (carnet.pere_id,carnet.mere_id)
        if not autorise:
            return Response({"detail":"Acces réfusé"},status = 403) 

        if not residence.est_valable:
            return Response({"detail" : "Ce certificat n'est pas valide" "(non valide, expiré ou révoqué)."},status=400)
        reponse = HttpResponse(fabriquer_pdf(residence), content_type="application/pdf")
        reponse["Content-Disposition"] = f'inline; filename="residence_{residence.id}.pdf"'
        return reponse

def personnes_du_carnet(carnet):
    parents = []
    if carnet.pere:
        parents.append({"id" : carnet.pere.id , "role": "Père" , "nom":f"{carnet.pere.nom_P}{carnet.pere.prenom_P}"})

    if carnet.mere:
        parents.append({"id" : carnet.mere.id , "role" : "Mère","nom":f"{carnet.mere.nom_P} {carnet.mere.prenom_P}"})

    enfants = [{"id" : e.id,"nom" : f"{e.nom_Ef} {e.prenom_Ef}"} for e in carnet.enfants.all()]
    return {"parents" : parents , "enfants" : enfants}

class FamilleHabitantView(APIView):
    permission_classes = [EstHabitant]

    def get(self,request):
        carnet =  request.user.parent.carnet
        tarif = tarif_residence(carnet.logement.secteur.quartier)
        data = personnes_du_carnet(carnet)
        data["montant"] = float(tarif.prix_Tf) if tarif else None
        return Response (data)

class PublicationsHabitantView(APIView):
    permission_classes = [EstHabitant]

    def get(self, request):
        quartier = request.user.parent.carnet.logement.secteur.quartier
        qs = Publication.objects.filter(quartier=quartier).order_by("-date_Pub")

        paginator = Paginator(qs, 5)                      
        page = paginator.get_page(request.query_params.get("page"))
        return Response({
            "resultats": [{"id": p.id, "texte": p.texte_Pub, "date": p.date_Pub}
                          for p in page],
            "pagination": {"page": page.number, "pages": paginator.num_pages,
                           "total": paginator.count},
        })



class DashboardResponsableView(APIView):
    permission_classes = [EstResponsable]

    def get(self,request):
        quartier = quartier_de(request.user)
        aujourdhui = date.today()
        tarifs = tarifs_cotisations(quartier)

        carnets = (Carnet.objects.filter(logement__secteur__quartier=quartier).select_related("pere" , "mere").prefetch_related("cotisations"))

        en_retard = []
        for c in carnets:
            impayes , _ = situation_carnet(c,tarifs,aujourdhui)
            if impayes:
                chef = c.pere or c.mere
                en_retard.append({
                    "carnet_id" : c.id,
                    "chef" : f"{chef.nom_P} {chef.prenom_P}" if chef else "_",
                    "nb_impayes" : len(impayes),
                    "montant_du" :sum(i["prix"] for i in impayes),
                })
        en_retard.sort(key=lambda l:l["nb_impayes"],reverse=True)
        nb_familles = len(carnets)

        #encaissements des 6 derniers mois
        mois_liste = []
        a,m = aujourdhui.year,aujourdhui.month
        for _ in range(6):
            mois_liste.append((a,m))
            m -= 1
            if m == 0:
                a,m = a-1,12
        mois_liste.reverse()

        graphique = []
        for a,m in mois_liste:
            somme = (Paiement.objects.filter(carnet__logement__secteur__quartier= quartier,
                    status_Pay = "VALIDE",
                    tarif__nom_Tf="Cotisations par mois",
                    date_Pay__year =a,
                    date_Pay__month=m).aggregate(t=Sum("montant"))["t"] or 0)
            graphique.append({"annee":a, "mois" : m,"total":float(somme)})

        #--residences 
        residences = Residence.objects.filter(carnet__logement__secteur__quartier=quartier)
        a_traiter = (residences.filter(status="EN_ATTENTE").select_related("carnet__logement__secteur","carnet__pere" , "carnet__mere","parent_concerne" , "enfant_concerne","paiement").order_by("-id"))

        #--pub
        publications = (Publication.objects.filter(quartier =  quartier).order_by("-date_Pub")[:3])

        return Response({
            "compteurs" :{
                "familles" : nb_familles,
                "en_retard" :  len(en_retard),
                "encaisse_mois": graphique[-1]["total"],
                "residences_a_traiter" : a_traiter.count(),
                "residences_payer" : residences.filter(status="A_PAYER").count(),

            },
            "graphique" : graphique,
            "familles_en_retard" : en_retard,
        })