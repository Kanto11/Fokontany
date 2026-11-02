import os
import urllib.request

import cloudinary
import cloudinary.uploader
import cloudinary.utils

from django.core.files.base import ContentFile
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

@deconstructible
class CloudinaryStorage(Storage):
    def _save(self,name,content):
        racine, _ = os.path.splitext(name)
        content.seek(0)
        cloudinary.uploader.upload(content,public_id=racine,ressource_type="image",overwrite=True)
        return name

    def url(self,name):
        racine,extension =os.path.splitext(name)
        return cloudinary.utils.cloudinary_url(racine,format=extension.lstrip("."),secure=True)[0]

    def _open(self,name,mode="rb"):
        with urllib.request.urlopen(self.url(name)) as response:
            return ContentFile(response.read(),name=name)

    def exists(self,name):
        return False

    def delete(self,name):
        racine, _ = os.path.splitext(name)
        cloudinary.uploader.destroy(racine,resource_type="image")