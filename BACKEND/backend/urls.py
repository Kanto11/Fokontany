from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path , include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.views import TokenObtainPairView as LoginView
from fokontany.auth_api import LoginView
from fokontany.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/auth/login/", LoginView.as_view()),
    path("api/auth/refresh/", TokenRefreshView.as_view()),  
    path("api/moi/", MoiView.as_view()),

    path("api/carnets/" ,CarnetCreateView.as_view()),
    path("api/carnets/<int:pk>/",CarnetDetailView.as_view()),
    path("api/carnets/<int:pk>/personnes/",CarnetPersonnesView.as_view()),

    path("api/logements/",LogementListView.as_view()),
    path("api/quartiers/",QuartierListView.as_view()),
    path("api/secteurs/", SecteurListView.as_view()),
    path("api/professions/",ProfessionListView.as_view()),
    path("api/nationalites/",NationaliteListView.as_view()),
    
    path("api/cotisations/responsable/",CotisationResponsableView.as_view()),
    path("api/cotisations/", CotisationHabitantView.as_view()),
    path("api/cotisations/impayes/", ImpayeView.as_view()),
    path("api/cotisations/encaisser/" ,PaiementEspecesView.as_view()),

    path("api/residences/bureau/", ResidenceBureauView.as_view()),
    path("api/residences/responsable/", ResidenceResponsableListView.as_view()),
    path("api/residences/<int:pk>/traiter/",ResidenceTraiterView.as_view()),
    path("api/residences/<int:pk>/encaisser/",ResidenceEncaisserView.as_view()),
    path("api/residences/<int:pk>/pdf/", ResidencePdfView.as_view()),
    path("api/residences/personnes/" ,FamilleHabitantView.as_view()),
    path("api/residences/", ResidenceHabitantView.as_view()),

    path("api/responsables/", ResponsablesQuartierView.as_view()),
    path("api/messages/", MessageHabitantView.as_view()),
    path("api/messages/recus/", MessagesRecusView.as_view()),
    path("api/messages/<int:pk>/lu/", MessageLuView.as_view()),
    path("api/parents/<int:pk>/photo/", PhotoParentView.as_view()),
    path("api/enfants/<int:pk>/photo/", PhotoEnfantView.as_view()),
    path("api/carnets/", CarnetCreateView.as_view(), name="carnet-create"),


    #Publications
    path("api/publications/",PublicationView.as_view()),
    path("api/publications/<int:pk>/",PublicationDetailView.as_view()),
    path("api/publications/habitant/", PublicationsHabitantView.as_view()),
]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)