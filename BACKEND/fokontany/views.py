from django.shortcuts import render
from datetime import date
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView;
from rest_framework.generics import ListAPIView;
from rest_framework.generics import ListCreateAPIView;
from rest_framework.generics import RetrieveAPIView;
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .auth_api import EstResponsable
from .auth_api import EstHabitant
from .auth_api import  EstAuteurPublication
from .cotisations import mois_depuis , tarif_actuel
from .serializers import (LogementCreateSerializer,CarnetDetailSerializer,CarnetListSerializer,SecteurSerializer,PhotoSerializer,PublicationSerializer,PublicationCreateSerializer,MessageSerializer,MessageCreateSerializer,ResponsableSerializer,CarnetCreateSerializer,NationaliteSerializer,LogementSerializer,QuartierSerializer,ProfessionSerializer,CarnetImpayeSerializer,PaiementEspeceSerializer)
from .models import *
from django.utils.dateparse import parse_date


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
            nom , prenom , photo = parent.nom_P , parent.prenom_P,parent.photo , fonction=None
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

        return Response(CarnetListSerializer(carnets, many=True).data)

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

        payes = set(carnet.cotisations.filter(status_Cot= Cotisation.PAYE).value_list("annee_Cot","mois_Cot"))
        mois = [{"annee": a , "mois":m , "status" : "PAYE" if (a,m) in payes else "IMPAYE"} for a,m in mois_depuis(carnet)]

        nb  = sum(1 for x in mois if x["statut"]=="IMPAYE")
        tarif = tarif_actuel(carnet.logement.secteur.quartier)
        return Response({
            "carnet" : carnet.id,
            "montant_mensuel" : tarif.prix_Tf if tarif else None,
            "nb_impaye" : nb ,
            "total_du" : tarif.prix_Tf * nb if tarif else None,
            "mois" : mois,
        })
        
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

class CotisationHabitantView(APIView):
    permission_classes = [EstHabitant]

    def get(self, request):
        parent = getattr(request.user, "parent", None)
        carnet = parent.carnet if parent else None
        if carnet is None:
            return Response({"detail": "Aucun carnet lié à ce compte."}, status=400)
        payes = set(carnet.cotisations.filter(status_Cot=Cotisation.PAYE)
                    .values_list("annee_Cot", "mois_Cot"))
        mois = [{"annee": a, "mois": m, "statut": "PAYE" if (a, m) in payes else "IMPAYE"}
                for a, m in mois_depuis(carnet)]
        nb = sum(1 for x in mois if x["statut"] == "IMPAYE")
        tarif = tarif_actuel(carnet.logement.secteur.quartier)
        return Response({
            "carnet": carnet.id,
            "montant_mensuel": tarif.prix_Tf if tarif else None,
            "nb_impayes": nb,
            "total_du": tarif.prix_Tf * nb if tarif else None,
            "mois": mois,
        })


class ImpayesView(APIView):
    permission_classes = [EstResponsable]

    def get(self, request):
        today = date.today()
        try:
            annee = int(request.query_params.get("annee", today.year))
            mois = int(request.query_params.get("mois", today.month))
        except ValueError:
            return Response({"detail": "annee et mois doivent être des nombres."}, status=400)
        if not 1 <= mois <= 12:
            return Response({"detail": "mois doit être entre 1 et 12."}, status=400)

        quartier = request.user.responsable.quartier
        payes = (Cotisation.objects
                 .filter(status_Cot=Cotisation.PAYE, annee_Cot=annee, mois_Cot=mois)
                 .values("carnet_id"))
        carnets = (Carnet.objects
                   .filter(logement__secteur__quartier=quartier, statut="ACTIF")
                   .filter(Q(date_creation__year__lt=annee)
                           | Q(date_creation__year=annee, date_creation__month__lte=mois))
                   .exclude(id__in=payes)
                   .select_related("logement", "pere", "mere")
                   .order_by("logement__adr_Log"))
        return Response({
            "annee": annee, "mois": mois, "nombre": carnets.count(),
            "carnets": CarnetImpayeSerializer(carnets, many=True).data,
        })


class PaiementEspecesView(APIView):
    permission_classes = [EstResponsable]

    def post(self, request):
        responsable = request.user.responsable
        s = PaiementEspecesSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        carnet = d["carnet"]

        quartier = carnet.logement.secteur.quartier
        if quartier.id != responsable.quartier_id:
            return Response({"detail": "Ce carnet n'est pas dans ton quartier."}, status=403)
        tarif = tarif_actuel(quartier)
        if tarif is None:
            return Response({"detail": "Aucun tarif défini pour ce quartier."}, status=400)

        demandes = {(x["annee"], x["mois"]) for x in d["mois"]}
        if len(demandes) != len(d["mois"]):
            return Response({"detail": "Un mois est répété dans la liste."}, status=400)
        deja = set(carnet.cotisations.filter(status_Cot=Cotisation.PAYE)
                   .values_list("annee_Cot", "mois_Cot"))
        if demandes & deja:
            return Response({"detail": "Certains mois sont déjà payés.",
                             "mois": sorted(demandes & deja)}, status=400)

        try:
            with transaction.atomic():          # le paiement et ses mois, ou rien
                paiement = Paiement.objects.create(
                    carnet=carnet, responsable=responsable, tarif=tarif,
                    mode_Pay="ESPECES", reference_Pay=d.get("reference", ""),
                    statut_Pay="VALIDE", montant=tarif.prix_Tf * len(demandes))
                for a, m in sorted(demandes):
                    cot, _ = Cotisation.objects.get_or_create(
                        carnet=carnet, annee_Cot=a, mois_Cot=m)
                    cot.paiement = paiement
                    cot.status_Cot = Cotisation.PAYE
                    cot.save()
        except IntegrityError:
            return Response({"detail": "Cette référence de reçu existe déjà."}, status=400)

        return Response({
            "paiement": paiement.id, "montant": paiement.montant,
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



