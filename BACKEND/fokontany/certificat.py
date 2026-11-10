import io
import os
from django.utils import timezone
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas
from django.conf import settings
from reportlab.lib import colors
LOGOS_PATH = os.path.join(settings.BASE_DIR, 'static', 'images', 'logos.png')


def fr(d):
    return d.strftime("%d/%m/%Y") if d else "-"

def fabriquer_pdf(residence):
    carnet = residence.carnet
    logement = carnet.logement
    quartier = logement.secteur.quartier


    if residence.parent_concerne:
        p = residence.parent_concerne
        nom,prenom, naissance ,lieu = p.nom_P,p.prenom_P,p.date_nais_P,p.lieu_nais_P
    else:
        p = residence.enfant_concerne
        nom,prenom, naissance ,lieu = p.nom_Ef,p.prenom_Ef,p.date_nais_Ef,p.lieu_nais_Ef

    buf = io.BytesIO()
    c = canvas.Canvas(buf,pagesize=A4)
    L,H= A4
    c.setFillColor(colors.HexColor("#1e293b")) 


    try:
        c.saveState()  
        c.setFillAlpha(0.08) 
        
       
        taille_bg = 12 * cm
        c.drawImage(
            ImageReader(LOGOS_PATH), 
            (L - taille_bg) / 2, 
            (H - taille_bg) / 2,
            width=taille_bg, 
            height=taille_bg, 
            preserveAspectRatio=True, 
            mask="auto"
        )
        c.restoreState()
    except Exception as e:
        print(f"Erreur chargement background: {e}")

    # Cadre de la page
    c.setLineWidth(1)
    c.setFillColor(colors.HexColor("#0F1054"))
    # cadre
    c.setLineWidth(2)
    c.rect(1.2 * cm, 1.2 * cm, L - 2.4 * cm, H - 2.4 * cm)
    c.setDash([6, 3]) 
    c.rect(1.2 * cm, 1.2 * cm, L - 2.4 * cm, H - 2.4 * cm)
    c.setDash([]) 

     # en-tête
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(L / 2, H - 3 * cm, f"REPOBLIKAN'I MADAGASIKARA")
    c.setFont("Helvetica", 10)
    c.drawCentredString(L / 2, H - 3.5 * cm, f"Fitiavana-Tanindrazana-Fandrosoana")
    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(L / 2, H - 4.3 * cm, "CERTIFICAT DE RESIDENCE")
    c.setFont("Helvetica", 10)
    c.drawCentredString(L / 2, H - 5 * cm, "FANAMARINAM-PONENANA")
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(L / 2, H - 6 * cm, f"FOKONTANY {quartier.nom_Q.upper()}")
    c.setFont("Helvetica", 10)
    c.drawCentredString(L / 2, H - 7 * cm, f"N° : {residence.id:05d}")

    # photo 
    try:
        c.drawImage(lire_image(p.photo), 2.5 * cm, H - 12.5 * cm,
                    3.5 * cm, 4.5 * cm, preserveAspectRatio=True, mask="auto")
    except Exception:
        c.rect(2.5 * cm, H - 12.5 * cm, 3.5 * cm, 4.5 * cm)     # cadre vide

    # info
    lignes = [
        ("Nom", nom),
        ("Prenoms", prenom),
        ("Ne(e) le", f"{fr(naissance)} a {lieu}"),
        ("Adresse", logement.adr_Log),
        ("Secteur", logement.secteur.nom_S),
        ("Motif", residence.motif),
    ]
    y = H - 8.5 * cm
    for etiquette, valeur in lignes:
        c.setFont("Helvetica-Bold", 11)
        c.drawString(7 * cm, y, f"{etiquette} :")
        c.setFont("Helvetica", 11)
        c.drawString(10 * cm, y, str(valeur))
        y -= 0.8 * cm

    # attestation 
    c.setFont("Helvetica", 11)
    c.drawString(2.5 * cm, H - 14.5 * cm,
                 "Le responsable du fokontany certifie que la personne ci-dessus")
    c.drawString(2.5 * cm, H - 15.1 * cm, "reside a l'adresse indiquee.")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2.5 * cm, H - 16.3 * cm,
                 f"Valable du {fr(residence.date_validation)} au {fr(residence.valable_jusqu_au)}")

    # QR code 
    try:
        c.drawImage(lire_image(residence.qr_code), 2.5 * cm, 4.5 * cm, 4 * cm, 4 * cm)
    except Exception:
        pass
    c.setFont("Helvetica", 8)
    c.drawString(2.5 * cm, 4 * cm, "Scannez ce QR code pour verifier")
    c.drawString(2.5 * cm, 3.6 * cm, "la validite de ce document.")

    # signature
    c.setFont("Helvetica", 11)
    c.drawString(L - 8 * cm, 8 * cm, "Le responsable")
    c.line(L - 8 * cm, 4.5 * cm, L - 3 * cm, 4.5 * cm)

    c.setFont("Helvetica", 7)
    c.drawString(2.5 * cm, 1.8 * cm, f"Document genere le {fr(timezone.localdate())}")

    c.showPage()
    c.save()
    return buf.getvalue()

def lire_image(champ):
    champ.open("rb")
    try:
        return ImageReader(io.BytesIO(champ.read()))
    finally:
        champ.close()