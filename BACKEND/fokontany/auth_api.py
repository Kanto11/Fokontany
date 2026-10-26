
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import BasePermission
from .models import Type


class LoginSerializer(serializers.Serializer):
    type = serializers.ChoiceField(choices=[Type.HABITANT, Type.RESPONSABLE])
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)


class LoginView(APIView):
    authentication_classes = []  
    permission_classes = [AllowAny]
    throttle_scope = "login"

    def post(self, request):
        s = LoginSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        user = authenticate(request, username=d["email"], password=d["mot_de_passe"])
        user = authenticate(request, username=d["email"], password=d["mot_de_passe"])
        print("USER:", user)

        if user is None:
            return Response({"detail": "authenticate a échoué (email/mdp)"}, status=401)
        if not user.is_active:
            return Response({"detail": "compte inactif"}, status=401)
            print("TYPE BD:", repr(user.type.nom_T), "TYPE REÇU:", repr(d["type"]))
        if user.type.nom_T != d["type"]:
            return Response({"detail": "mauvais type"}, status=401)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "type": user.type.nom_T,  
        })

class EstResponsable(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return u.is_authenticated and u.type.nom_T == Type.RESPONSABLE


class EstHabitant(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return u.is_authenticated and u.type.nom_T == Type.HABITANT


class EstAuteurPublication(BasePermission):
    message =" Seul l'auteur de cette publication peut la modifier"

    def has_object_permission(self,request,view,obj):
        responsable = getattr(request.user ,"responsable" ,None)
        return responsable is not None and obj.responsable == responsable
        