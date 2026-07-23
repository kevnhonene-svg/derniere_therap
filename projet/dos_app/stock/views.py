from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from dos_app.comptes.utils import error, success
from dos_app.stock.models import Boisson
from dos_app.stock.serializers import BoissonSerializer, boisson_to_dict


def is_superadmin(request):
    user = request._request.user
    session = request._request.session
    return (user.is_authenticated and user.is_superuser) or session.get('role') == 'superadmin'


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def boissons(request):
    qs = Boisson.objects.filter(actif=True)
    if request.GET.get('q'):
        qs = qs.filter(nom__icontains=request.GET['q'])
    return success({'boissons': BoissonSerializer(qs, many=True, context={'request': request}).data})


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def boissons_admin(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        qs = Boisson.objects.all()
        return success({'boissons': BoissonSerializer(qs, many=True, context={'request': request}).data})

    serializer = BoissonSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    boisson = serializer.save()
    return success({'boisson': boisson_to_dict(boisson, request)}, status.HTTP_201_CREATED)


@api_view(['PATCH'])
@authentication_classes([])
@permission_classes([AllowAny])
def boisson_admin_detail(request, boisson_id):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    try:
        boisson = Boisson.objects.get(pk=boisson_id)
    except Boisson.DoesNotExist:
        return error('Boisson introuvable.', status.HTTP_404_NOT_FOUND)

    serializer = BoissonSerializer(boisson, data=request.data, partial=True, context={'request': request})
    serializer.is_valid(raise_exception=True)
    boisson = serializer.save()
    return success({'boisson': boisson_to_dict(boisson, request)})
