import io
import uuid
from datetime import date, timedelta
from django.conf import settings
import qrcode
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin,
)
from django.core.files.base import ContentFile
from django.db import models
class Type(models.Model):
        HABITANT = "HABITANT"
        RESPONSABLE = "RESPONSABLE"

        nom_T = models.CharField(max_length=20 ,unique=True)

        def __str__(self):
                return self.nom_T

class UserManager(BaseUserManager):
    def create_user(self, email, password, type, **extra):
        if not email or not password:
            raise ValueError("Email et mot de passe obligatoires")
        user = self.model(email=self.normalize_email(email), type=type, **extra)
        user.set_password(password)          
        user.save(using=self._db)
        return user
 
    def create_superuser(self, email, password, **extra):
        t, _ = Type.objects.get_or_create(nom_T=Type.RESPONSABLE)
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, t, **extra)

class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)           
    type = models.ForeignKey(Type, on_delete=models.PROTECT)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
   
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()
 
    def __str__(self):
        return self.email
 
class Quartier(models.Model):
    nom_Q = models.CharField(max_length = 100)
    contact_Q = models.CharField(max_length=10)

    def __str__(self):
        return self.nom_Q

class Secteur(models.Model):
    quartier =  models.ForeignKey(Quartier,on_delete=models.CASCADE , related_name="secteurs")
    nom_S =  models.CharField(max_length = 100)

    def __str__(self):
        return f"{self.nom_S}-{self.quartier}"

class Logement(models.Model):
    secteur = models.ForeignKey(Secteur,on_delete=models.PROTECT, related_name="logements")
    adr_Log = models.CharField(max_length=200, unique=True)
    hauteur_Log = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    largeur_Log = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)

    def __str__(self):
        return self.adr_Log

class Nationalite(models.Model):
    nationalite = models.CharField(max_length=60, unique=True)
    est_malagasy = models.BooleanField(default=False)

    def __str__(self):
        return self.nationalite
 
class Profession(models.Model):
    nom_Prof = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nom_Prof
 
class TypeResponsable(models.Model):
    nom_TR = models.CharField(max_length=60, unique=True)

    def __str__ (self):
        return self.nom_TR
 
class Responsable(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="responsable")
    type_responsable = models.ForeignKey(TypeResponsable, on_delete=models.PROTECT)
    quartier = models.ForeignKey(Quartier, on_delete=models.PROTECT)   
    nom_R = models.CharField(max_length=80)
    prenom_R = models.CharField(max_length=80)
    date_naiss_R = models.DateField()
    tel_R = models.CharField(max_length=20, unique=True)
    adr_R = models.ForeignKey(Logement,on_delete=models.PROTECT)
    photo = models.ImageField(upload_to="responsables/") 
    
    def __str__ (self):
        return f"{self.nom_R}-{self.prenom_R}"

def chemin_photo(instance, filename):
    ext = filename.rsplit(".", 1)[-1].lower()
    return f"photos/{instance.__class__.__name__.lower()}s/{uuid.uuid4().hex}.{ext}"

class Parent(models.Model):
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.SET_NULL,
                                related_name="parent")
    nom_P = models.CharField(max_length=80)
    prenom_P = models.CharField(max_length=80)
    date_nais_P = models.DateField()
    lieu_nais_P = models.CharField(max_length=100)
    nom_pere_P = models.CharField(max_length=100)
    nom_mere_P = models.CharField(max_length=100)
    tel_P = models.CharField(max_length=20)
    proprietaire_P = models.BooleanField(default=False)
    profession = models.ForeignKey(Profession, on_delete=models.PROTECT)
    nationalite = models.ForeignKey(Nationalite, on_delete=models.PROTECT)
    photo = models.ImageField(upload_to="photos/parents/", blank=True)
    def __str__ (self):
        return f"{self.nom_P}-{self.prenom_P}"

    @property
    def carnet(self):
        return Carnet.objects.filter(models.Q(pere=self) | models.Q(mere=self)).first()
  
class Carnet(models.Model):
    STATUTS = [("ACTIF","actif"),("INACTIF","inctif")]
    logement = models.ForeignKey(Logement, on_delete = models.PROTECT , related_name="carnets")
    responsable = models.ForeignKey(Responsable ,on_delete= models.PROTECT ,related_name="carnets_creer")
    pere = models.ForeignKey(Parent,null=True , blank="True",on_delete=models.SET_NULL,related_name="carnets_comme_pere")
    mere = models.ForeignKey(Parent,null=True , blank="True",on_delete=models.SET_NULL,related_name="carnets_comme_mere")
    statut =  models.CharField(max_length = 15 , choices = STATUTS , default ="ACTIF")
    date_creation = models.DateField(auto_now_add=True)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    qr_code = models.ImageField(upload_to="qrcodes/", blank=True)
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if not self.qr_code:
            
            img = qrcode.make(f"{settings.SITE_URL}/verif/{self.token}")
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            self.qr_code.save(f"carnet_{self.pk}.png", ContentFile(buf.getvalue()), save=False)
            super().save(update_fields=["qr_code"])

    def __str__ (self):
        return f"Carnet N° {self.pk}-{self.logement}"

class Enfant(models.Model):
    carnet =  models.ForeignKey(Carnet , on_delete = models.CASCADE ,related_name="enfants")
    nom_Ef =models.CharField(max_length=88)
    prenom_Ef = models.CharField(max_length=88)
    date_nais_Ef = models.DateField()
    lieu_nais_Ef = models.CharField(max_length=100)
    profession = models.ForeignKey(Profession ,blank=True , null = True, on_delete =models.SET_NULL)
    nationalite = models.ForeignKey(Nationalite, on_delete = models.PROTECT)
    photo = models.ImageField(upload_to="photos/enfants/", blank=True)
    def __str__(self):
        return f"{self.nom_Ef}-{self.prenom_Ef}"

class PieceIdentite(models.Model):
    CIN = "CIN"
    PASSPORT = "PASSPORT"
    TYPES = [(CIN , "CIN") , (PASSPORT , "Passport")]
    parent = models.OneToOneField(Parent, null=True, blank=True, on_delete=models.CASCADE,related_name="piece")
    enfant = models.OneToOneField(Enfant, null=True, blank=True, on_delete=models.CASCADE,related_name="piece")
    type_piece = models.CharField(max_length=10, choices=TYPES)
    numero = models.CharField(max_length=20) 
    date_delivrance = models.DateField()
    lieu_delivrance = models.CharField(max_length=100)
    date_expiration = models.DateField(null=True, blank=True)
    
    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(models.Q(parent__isnull=False, enfant__isnull=True) | 
                           models.Q(parent__isnull=True, enfant__isnull=False)),
                name="piece_parent_xor_enfant"
            ),
            models.UniqueConstraint(
                fields=["type_piece", "numero"], 
                name="piece_unique"
            ),
        ]
    
    def clean(self):
        import re
        from django.core.exceptions import ValidationError

        personne = self.parent or self.enfant
        if personne is None :
                raise ValidationError("Une pièce doit être liée à un parent ou à un enfant.")

        self.numero = (self.numero or "").replace(" " , "").upper()
        
        attendu =  self.CIN if (personne.nationalite.est_malagasy) else self.PASSPORT

        if self.type_piece != attendu :  
            raise   ValidationError(f"Pièce attendue pour cette nationalité : {attendu}")

        if attendu == self.CIN:
            if not re.fullmatch(r"\d{12}", self.numero):
                raise ValidationError("La CIN doit contenir exactement 12 chiffres.")
        else:
            if not re.fullmatch(r"[A-Z0-9]{6,9}", self.numero):
                raise ValidationError(
                    "Le numéro de passeport doit contenir 6 à 9 lettres ou chiffres.")
            if not self.date_expiration:
                raise ValidationError("La date d'expiration du passeport est obligatoire.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__ (self):
        return f"{self.type_piece}-{self.numero}"
 
class Tarif(models.Model):
    quartier = models.ForeignKey(Quartier , on_delete=models.CASCADE)
    nom_Tf = models.CharField(max_length=50)
    prix_Tf = models.DecimalField(max_digits=10 , decimal_places=2)
    date_debut = models.DateField()

    def __str__(self):
        return f"{self.nom_Tf}-{self.prix_Tf} Ar"

class Paiement(models.Model):
    MODES = [("ESPECES","especes"),("MVOLA","MVola")]
    STATUS = [("EN_ATTENTES","En attentes"),("VALIDE","Valide"),("ECHEC","Echec")]
    carnet = models.ForeignKey(Carnet , on_delete = models.PROTECT , related_name="paiments")
    parent = models.ForeignKey(Parent , null=True, blank=True, on_delete=models.SET_NULL)
    responsable = models.ForeignKey(Responsable , null=True, blank=True, on_delete=models.SET_NULL )
    tarif = models.ForeignKey(Tarif , on_delete = models.PROTECT)
    date_Pay = models.DateField(auto_now_add =True)
    mode_Pay = models.CharField(max_length=10 , choices =MODES)
    status_Pay = models.CharField(max_length= 15 , choices =STATUS)
    reference_Pay = models.CharField(max_length=60, blank=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["mode_Pay","reference_Pay"],condition = ~models.Q(reference_Pay="") , name="paiement_reference_unique",),
        ]

    def __str__(self):
        return f"{self.pk}-{self.mode_Pay}"
class Cotisation(models.Model):
    IMPAYE = "IMPAYE"
    PAYE = "PAYE"
    STATUTS = [(IMPAYE, "Impayé"), (PAYE, "Payé")]
    carnet = models.ForeignKey(Carnet , on_delete=models.CASCADE ,related_name="cotisations")
    mois_Cot = models.PositiveSmallIntegerField()
    annee_Cot = models.PositiveSmallIntegerField()
    paiement = models.ForeignKey(Paiement ,  null=True, blank=True, on_delete=models.SET_NULL,related_name="cotisations")
    status_Cot = models.CharField(max_length=10 , choices=STATUTS ,default = "IMPAYE")

    class Meta:
        unique_together = ("carnet","mois_Cot","annee_Cot")

    def __str__(self):
        return f"Carnet {self.carnet_id} - {self.mois_Cot:02d}/{self.annee_Cot}"

class Residence(models.Model):
    STATUS =[("EN ATTENTE","En attente"),("VALIDE","Valide"),("REFUSE","Refuse"),("A_PAYER","A payer")]
    carnet = models.ForeignKey(Carnet ,  on_delete = models.CASCADE , related_name="demandes")
    demandeur = models.ForeignKey(Parent , on_delete=models.PROTECT)
    parent_concerne = models.ForeignKey(Parent , null=True, blank=True, on_delete=models.CASCADE,related_name="residences")
    enfant_concerne = models.ForeignKey(Enfant , null=True, blank=True, on_delete=models.CASCADE,related_name="residences")
    date_Resid = models.DateField(auto_now_add=True)
    motif = models.CharField(max_length=200)
    status = models.CharField(max_length=10, choices = STATUS , default="A_PAYER")
    traite_par = models.ForeignKey(Responsable,null=True, blank=True, on_delete=models.SET_NULL )
    paiement = models.ForeignKey(Paiement ,  null=True, blank=True, on_delete=models.SET_NULL,related_name="paiement_residences")


    token = models.UUIDField(null=True, blank=True, unique=True, editable=False)
    qr_code = models.ImageField(upload_to="qr_residences/", blank=True)
    date_validation = models.DateField(null=True, blank=True)
    valable_jusqu_au = models.DateField(null=True, blank=True)
    revoquee = models.BooleanField(default=False)
    validation_auto = models.BooleanField(default = False)
    motif_refus = models.CharField(max_length = 200 ,blank=True)

    
    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=(models.Q(parent_concerne__isnull=False, enfant_concerne__isnull=True)
                           | models.Q(parent_concerne__isnull=True, enfant_concerne__isnull=False)),
                name="residence_parent_xor_enfant"),
        ]

    def clean(self):
        from django.core.exceptions import ValidationError
        c = self.carnet
        if self.demandeur_id not in (c.pere_id, c.mere_id):
            raise ValidationError("Le demandeur doit être le père ou la mère de ce carnet.")
        if self.enfant_concerne and self.enfant_concerne.carnet_id != c.id:
            raise ValidationError("Cet enfant n'appartient pas à ce carnet.")
        if self.parent_concerne and self.parent_concerne_id not in (c.pere_id, c.mere_id):
            raise ValidationError("Ce parent n'appartient pas à ce carnet.")

    def valider(self, responsable=None ,auto=False):
        self.status = "VALIDE"
        self.traite_par = responsable
        self.date_validation = date.today()     
        self.validation_auto = auto 
        self.valable_jusqu_au = date.today() + timedelta(days=90)   # environ 3 mois
        
        self.token = uuid.uuid4()
        img = qrcode.make(f"{settings.SITE_URL}/verif/residence/{self.token}")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        self.qr_code.save(f"residence_{self.pk}.png", ContentFile(buf.getvalue()), save=False)
        self.save()

    @property
    def est_valable(self):
        from datetime import date
        return (self.status == "VALIDE" and not self.revoquee
                and self.valable_jusqu_au is not None
                and self.valable_jusqu_au >= date.today())

    @property
    def numero(self):
        cle = str(self.token).replace("-","")[:4].upper()
        return f"RES-{self.id:05d}-{cle}"

    def __str__(self):
        return f"Résidence n°{self.pk} ({self.status})"

class Message(models.Model):
    expediteur = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name="messages_envoyes")
    destinataire = models.ForeignKey(Responsable, on_delete=models.CASCADE, related_name="messages_recus")
    objet = models.CharField(max_length=150)
    contenu = models.TextField()
    date_envoi = models.DateTimeField(auto_now_add=True)
    lu = models.BooleanField(default=False)
    
    def __str__(self):
        return self.objet

class Publication(models.Model):
    quartier = models.ForeignKey(Quartier, on_delete=models.CASCADE, related_name="publications")
    responsable = models.ForeignKey(Responsable, on_delete=models.PROTECT)
    date_Pub = models.DateTimeField(auto_now_add=True)
    texte_Pub = models.TextField()

    def __str__(self):
        return f"Publication n°{self.pk}"