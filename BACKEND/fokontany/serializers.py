import re
from datetime import date

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers 
from django.db import transaction
from .models import (
    Type,Secteur ,Responsable ,Carnet, Enfant, Logement, Parent, PieceIdentite, Type, User,Profession,Quartier,Nationalite,Message ,Publication ,Residence
)


#Besoin Carnet
class PieceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PieceIdentite
        fields = ['type_piece','numero','date_delivrance','lieu_delivrance','date_expiration']
    def validate_numero(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le numéro de la pièce est obligatoire."
            )

        return value

    def validate(self, data):
        delivrance = data.get("date_delivrance")
        expiration = data.get("date_expiration")

        if delivrance and delivrance > date.today():
            raise serializers.ValidationError({
                "date_delivrance":
                    "La date de délivrance ne peut pas être dans le futur."
            })

        if delivrance and expiration and expiration <= delivrance:
            raise serializers.ValidationError({
                "date_expiration":
                    "La date d'expiration doit être après la délivrance."
            })

        return data
class NationaliteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nationalite
        fields = ["id", "nationalite"]
class ParentDetailSerializer(serializers.ModelSerializer):
    nationalite = NationaliteSerializer(read_only=True)
    piece = PieceSerializer(read_only=True)

    class Meta:
        model = Parent
        fields = [
            "id", "nom_P", "prenom_P", "date_nais_P", "lieu_nais_P",
            "nom_pere_P", "nom_mere_P", "tel_P",
            "proprietaire_P", "profession", "nationalite", "piece", "photo",
        ]


class ParentInSerializer(serializers.ModelSerializer):
    piece = PieceSerializer(required=False)
    email = serializers.EmailField(required=False , write_only=True)
    mot_de_passe = serializers.CharField(required=False ,write_only=True, min_length =8)
    nationalite = serializers.PrimaryKeyRelatedField(queryset=Nationalite.objects.all())
    nom_pere_P = serializers.CharField(allow_blank=True)
    nom_mere_P = serializers.CharField(allow_blank=True)
    class Meta:
        model = Parent
        fields = ['nom_P','prenom_P','date_nais_P','lieu_nais_P','nom_pere_P','nom_mere_P',
        'tel_P','proprietaire_P','profession','nationalite','mot_de_passe','email','piece']

    def validate_tel_P(self, value):
        value = value.strip()

        if not re.fullmatch(r"[0-9]{10}", value):
            raise serializers.ValidationError(
                "Le téléphone doit contenir exactement 10 chiffres."
            )

        return value

   

    def validate(self, data):
        email = data.get("email")
        mdp = data.get("mot_de_passe")

        if bool(email) != bool(mdp) :
            raise serializers.ValidationError("email et mot de passe vont ensemble")

        if email and User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Cet email est deja utilisé")

        naissance = data.get("date_nais_P")
        if naissance and naissance > date.today():
                raise serializers.ValidationError({
                    "date_nais_P": "La date de naissance ne peut pas être dans le futur."
                })

        return data

class EnfantDetailSerializer(serializers.ModelSerializer):
    nationalite = NationaliteSerializer(read_only=True)

    class Meta:
        model = Enfant
        fields = [
            "id", "nom_Ef", "prenom_Ef", "date_nais_Ef",
            "lieu_nais_Ef", "nationalite", "profession", "photo",
        ]

class EnfantInSerializer(serializers.ModelSerializer):
    piece =  PieceSerializer(required=False)
    nationalite = serializers.PrimaryKeyRelatedField(queryset=Nationalite.objects.all())
    def validate_date_nais_Ef(self, value):
        if value > date.today():
            raise serializers.ValidationError(
                "La date de naissance ne peut pas être dans le futur."
        )
        return value
    class Meta:
        model = Enfant
        fields=['nom_Ef','prenom_Ef','date_nais_Ef','lieu_nais_Ef','nationalite','profession','piece']

class CarnetCreateSerializer(serializers.Serializer):
    logement = serializers.PrimaryKeyRelatedField(
        queryset=Logement.objects.all()
    )
    pere = ParentInSerializer(required=False)
    mere = ParentInSerializer(required=False)
    enfants = EnfantInSerializer(many=True, required=False)

    def validate(self, data):
        if not data.get("pere") and not data.get("mere"):
            raise serializers.ValidationError(
                "Il faut renseigner au moins un parent."
            )

        return data

    def _creer_parent(self, data):
        data = dict(data)
        piece_data = data.pop("piece", None)
        email = data.pop("email", None)
        mot_de_passe = data.pop("mot_de_passe", None)
        type_habitant,_=Type.objects.get_or_create(nom_T="HABITANT")
        user = None

        if email and mot_de_passe:         
            user = User.objects.create_user(
                
                email=email,
                password=mot_de_passe,
                type=type_habitant,
            )

        parent = Parent.objects.create(user=user, **data)

        if piece_data:
            PieceIdentite.objects.create(
                parent=parent,
                **piece_data
            )

        return parent

    def create(self, validated_data):
        request = self.context["request"]
        responsable = request.user.responsable

        pere_data = validated_data.pop("pere", None)
        mere_data = validated_data.pop("mere", None)
        enfants_data = validated_data.pop("enfants", [])
        logement = validated_data["logement"]

        try:
            with transaction.atomic():
                pere = (
                    self._creer_parent(pere_data)
                    if pere_data else None
                )
                mere = (
                    self._creer_parent(mere_data)
                    if mere_data else None
                )

                carnet = Carnet.objects.create(
                    logement=logement,
                    responsable=responsable,
                    pere=pere,
                    mere=mere,
                )

                for enfant_data in enfants_data:
                    enfant_data = dict(enfant_data)
                    piece_data = enfant_data.pop("piece", None)

                    enfant = Enfant.objects.create(
                        carnet=carnet,
                        **enfant_data
                    )

                    if piece_data:
                        PieceIdentite.objects.create(
                            enfant=enfant,
                            **piece_data
                        )

                return carnet

        except DjangoValidationError as err:
            raise serializers.ValidationError(err.messages)


class CarnetUpdateSerializer(serializers.Serializer):
    logement = serializers.PrimaryKeyRelatedField(queryset=Logement.objects.all())
    pere = serializers.DictField(allow_null=True)
    mere = serializers.DictField(allow_null=True)
    enfants = serializers.ListField(child=serializers.DictField())

    def validate_logement(self, logement):
        quartier_id = self.context["request"].user.responsable.quartier_id
        if logement.secteur.quartier_id != quartier_id:
            raise serializers.ValidationError(
                "Le logement doit appartenir à votre quartier."
            )
        return logement

    def validate(self, data):
        if not data.get("pere") and not data.get("mere"):
            raise serializers.ValidationError(
                "Il faut renseigner au moins un parent."
            )
        return data

    def _valider_parent(self, role, parent_data, carnet):
        if parent_data is None:
            return None

        parent_data = dict(parent_data)
        parent_id = parent_data.pop("id", None)
        parent_existant = getattr(carnet, role)

        if parent_id is not None:
            parent_id = serializers.IntegerField().run_validation(parent_id)
        if parent_id is not None and (
            parent_existant is None or parent_existant.id != parent_id
        ):
            raise serializers.ValidationError({
                role: "Le parent fourni ne correspond pas à ce carnet."
            })
        if parent_existant and (
            "email" in parent_data or "mot_de_passe" in parent_data
        ):
            raise serializers.ValidationError({
                role: "Les identifiants du compte ne peuvent pas être modifiés ici."
            })

        serializer = ParentInSerializer(data=parent_data)
        serializer.is_valid(raise_exception=True)
        return parent_existant, serializer.validated_data

    def update(self, carnet, validated_data):
        with transaction.atomic():
            carnet.logement = validated_data["logement"]

            for role in ("pere", "mere"):
                parent_info = self._valider_parent(
                    role, validated_data[role], carnet
                )
                if parent_info is None:
                    setattr(carnet, role, None)
                    continue

                parent_existant, parent_data = parent_info
                piece_data = parent_data.pop("piece", None)

                if parent_existant is None:
                    parent = CarnetCreateSerializer()._creer_parent(parent_data)
                else:
                    parent = parent_existant
                    for field, value in parent_data.items():
                        if field not in ("email", "mot_de_passe"):
                            setattr(parent, field, value)
                    parent.save()

                if piece_data:
                    PieceIdentite.objects.update_or_create(
                        parent=parent,
                        defaults=piece_data,
                    )
                else:
                    PieceIdentite.objects.filter(parent=parent).delete()

                setattr(carnet, role, parent)

            carnet.save()

            enfants_conserves = []
            enfants_ids = []
            for enfant_data in validated_data["enfants"]:
                enfant_data = dict(enfant_data)
                enfant_id = enfant_data.pop("id", None)
                if enfant_id is not None:
                    enfant_id = serializers.IntegerField().run_validation(enfant_id)
                    if enfant_id in enfants_ids:
                        raise serializers.ValidationError({
                            "enfants": "Un enfant ne peut apparaître qu'une seule fois."
                        })
                piece_data = enfant_data.pop("piece", None)
                serializer = EnfantInSerializer(data=enfant_data)
                serializer.is_valid(raise_exception=True)

                if enfant_id:
                    enfant = carnet.enfants.filter(pk=enfant_id).first()
                    if enfant is None:
                        raise serializers.ValidationError({
                            "enfants": "Un enfant fourni ne correspond pas à ce carnet."
                        })
                    for field, value in serializer.validated_data.items():
                        if field != "piece":
                            setattr(enfant, field, value)
                    enfant.save()
                else:
                    enfant = Enfant.objects.create(
                        carnet=carnet,
                        **serializer.validated_data,
                    )

                if piece_data:
                    PieceIdentite.objects.update_or_create(
                        enfant=enfant,
                        defaults=piece_data,
                    )
                enfants_conserves.append(enfant.id)
                enfants_ids.append(enfant.id)

            carnet.enfants.exclude(id__in=enfants_conserves).delete()

        self.enfants_ids = enfants_ids
        return carnet
#Liste deroulantes 
class NationaliteSerializer(serializers.ModelSerializer):
    class Meta :
        model = Nationalite

        fields=["id","nationalite","est_malagasy"]

class ProfessionSerializer(serializers.ModelSerializer):
    class Meta :
        model = Profession
        fields = ["id" , "nom_Prof"]

class QuartierSerializer(serializers.ModelSerializer):
    class Meta :
        model = Quartier
        fields = ["id", "nom_Q","contact_Q"]


class LogementSerializer(serializers.ModelSerializer):
    secteur_nom = serializers.CharField(source="secteur.nom_S", read_only=True)

    class Meta:
        model = Logement
        fields = ["id", "adr_Log", "secteur", "secteur_nom"]

class LogementCreateSerializer(serializers.ModelSerializer):
    class Meta :
        model =  Logement
        fields = ["id","adr_Log","secteur", "hauteur_Log" ,"largeur_Log"]
        extra_kwargs =  {
            "adr_Log" : {"error_messages" : {"unique" : "Cette adresse existe déja"}}
        }
    def validate_secteur(self,secteur):
        quartier = self.context["quartier"]
        if secteur.quartier != quartier : 
            raise serializers.ValidationError("Ce secteur n'est pas dans ton quartier")
    
        return secteur
#Cotisations 

class MoisSerializer(serializers.Serializer):
    mois = serializers.IntegerField(min_value = 1 , max_value = 12)
    annee = serializers.IntegerField(min_value = 2000 , max_value=2100)

class PaiementEspeceSerializer(serializers.Serializer):
    carnet = serializers.PrimaryKeyRelatedField(queryset=Carnet.objects.all())
    mois = MoisSerializer(many=True , allow_empty = False)
    reference = serializers.CharField(max_length=60 ,required = False , allow_blank = True)

class CarnetImpayeSerializer(serializers.ModelSerializer):
    adresse = serializers.CharField(source="logement.adr_Log" ,  read_only=True)
    parents = serializers.SerializerMethodField()

    class Meta:
        model = Carnet
        fields = ["id" , "adresse","parents"]

    def get_parents(self,obj):
        return [{"nom" : f"{p.nom_P} {p.prenom_P}" , "tel": p.tel_P}
            for p in (obj.pere, obj.mere) if p]

class ResponsableSerializer(serializers.ModelSerializer):
    fonction = serializers.CharField(source="type_responsable.nom_TR", read_only=True)

    class Meta:
        model = Responsable
        fields = ["id", "nom_R", "prenom_R", "fonction", "photo"]


class MessageCreateSerializer(serializers.ModelSerializer):
    """Ce que l'habitant envoie. L'expéditeur vient du compte connecté."""
    class Meta:
        model = Message
        fields = ["destinataire", "objet", "contenu"]

    def validate_destinataire(self, responsable):
        if responsable.quartier_id != self.context["quartier"].id:
            raise serializers.ValidationError("Ce responsable n'est pas de ton quartier.")
        return responsable


class MessageSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.SerializerMethodField()
    destinataire_nom = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "expediteur_nom", "destinataire_nom", "objet", "contenu",
                  "date_envoi", "lu"]

    def get_expediteur_nom(self, obj):
        return f"{obj.expediteur.nom_P} {obj.expediteur.prenom_P}"

    def get_destinataire_nom(self, obj):
        return f"{obj.destinataire.nom_R} {obj.destinataire.prenom_R}"


class PublicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publication
        fields = ["texte_Pub"]


class PublicationSerializer(serializers.ModelSerializer):
    auteur = serializers.SerializerMethodField()
    peut_modifier = serializers.SerializerMethodField()
    class Meta:
        model = Publication
        fields = ["id", "texte_Pub", "date_Pub", "auteur","peut_modifier"]
        
    def get_auteur(self, obj):
        return str(obj.responsable)

    def get_peut_modifier(self, obj):
        request = self.context.get("request")
        if request is None:
            return False
        responsable = getattr(request.user, "responsable", None)
        return responsable is not None and obj.responsable_id == responsable.id

class PhotoSerializer(serializers.Serializer):
    photo = serializers.ImageField()

    def validate_photo(self, fichier):
        if fichier.size > 20 * 1024 * 1024:
            raise serializers.ValidationError("Photo trop lourde (20 Mo maximum).")
        return fichier

# list
class SecteurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Secteur
        fields = ["id", "nom_S"]


class CarnetListSerializer(serializers.ModelSerializer):
    chef = serializers.SerializerMethodField()
    telephone = serializers.SerializerMethodField()
    adresse = serializers.CharField(source="logement.adr_Log", read_only=True)
    secteur = serializers.CharField(source="logement.secteur.nom_S", read_only=True)
    secteur_id = serializers.IntegerField(source="logement.secteur_id", read_only=True)

    class Meta:
        model = Carnet
        fields = ["id", "chef", "telephone", "adresse", "secteur", "secteur_id", "statut"]

    def get_chef(self, obj):
        p = obj.pere or obj.mere         
        return f"{p.nom_P} {p.prenom_P}" if p else ""

    def get_telephone(self, obj):
        p = obj.pere or obj.mere
        return p.tel_P if p else ""



class CarnetDetailSerializer(serializers.ModelSerializer):
    pere = ParentDetailSerializer(read_only=True)
    mere = ParentDetailSerializer(read_only=True)
    enfants = EnfantDetailSerializer(many=True, read_only=True)
    adresse = serializers.CharField(
        source="logement.adr_Log",
        read_only=True
    )
    secteur = serializers.CharField(
        source="logement.secteur.nom_S",
        read_only=True
    )
    telephone = serializers.SerializerMethodField()

    class Meta:
        model = Carnet
        fields = "__all__"

    def get_telephone(self, obj):
        if obj.pere and obj.pere.tel_P:
            return obj.pere.tel_P
        if obj.mere and obj.mere.tel_P:
            return obj.mere.tel_P
        return None


#Residence 
class ResidenceDemandeSerializer(serializers.Serializer):
    parent_concerne = serializers.PrimaryKeyRelatedField(
        queryset=Parent.objects.all(),
        required=False, 
        allow_null=True
    )

    enfant_concerne = serializers.PrimaryKeyRelatedField(
        queryset=Enfant.objects.all(),
        required=False, 
        allow_null=True
    )
    motif = serializers.CharField(max_length=200)

    def validate(self, d):

        parent = d.get("parent_concerne")
        enfant = d.get("enfant_concerne")
        
        if bool(parent) == bool(enfant): 
            raise serializers.ValidationError("Choisis un parent ou un enfant")
        return d

class ResidenceHabitantSerializer(serializers.ModelSerializer):
    personne = serializers.SerializerMethodField()

    class Meta:
        model = Residence
        fields = ["id" , "personne" ,"motif" ,"status" ,"date_Resid" , "date_validation","valable_jusqu_au" ,"revoquee","motif_refus" , "token" , "qr_code"]

    def get_personne(self,r):
        p = r.parent_concerne or r.enfant_concerne
        if r.parent_concerne:
            return f"{p.nom_P} {p.prenom_P}"
        return f"{p.nom_Ef} {p.prenom_Ef}"

class ResidenceBureauSerializer(ResidenceDemandeSerializer):
    carnet = serializers.PrimaryKeyRelatedField(queryset=Carnet.objects.all())
    demandeur = serializers.PrimaryKeyRelatedField(queryset=Parent.objects.all())
    paye = serializers.BooleanField(default=True)     
    reference = serializers.CharField(required=False, allow_blank=True, max_length=60)