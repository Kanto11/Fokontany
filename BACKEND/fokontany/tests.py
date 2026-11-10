import io

from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from .certificat import lire_image


class LireImageTests(TestCase):
    def test_lit_une_image_depuis_un_fichier_django(self):
        image = Image.new("RGB", (2, 3))
        contenu = io.BytesIO()
        image.save(contenu, format="PNG")
        fichier = SimpleUploadedFile("test.png", contenu.getvalue(), content_type="image/png")

        lecteur = lire_image(fichier)

        self.assertEqual(lecteur.getSize(), (2, 3))
