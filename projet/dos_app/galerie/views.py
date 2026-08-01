from io import BytesIO

from django.http import HttpResponse
from django.db.models import Count, Max, Q
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from PIL import Image, ImageOps

from dos_app.comptes.utils import error, json_body, success
from dos_app.galerie.models import AlbumGalerie, PhotoGalerie
from dos_app.galerie.serializers import AlbumGalerieSerializer, PhotoGalerieSerializer, album_to_dict, photo_to_dict


def is_superadmin(request):
    user = request._request.user
    session = request._request.session
    return (user.is_authenticated and user.is_superuser) or session.get('role') == 'superadmin'


def filtered_photos(request, admin=False):
    qs = PhotoGalerie.objects.select_related('album')
    if not admin:
        qs = qs.filter(actif=True, album__actif=True)

    album_id = request.GET.get('album_id', '').strip()
    search = request.GET.get('q', '').strip()
    moment = request.GET.get('moment_fort', '').strip()

    if album_id:
        qs = qs.filter(album_id=album_id)
    if moment in ['1', 'true', 'oui']:
        qs = qs.filter(moment_fort=True)
    if search:
        qs = qs.filter(
            Q(titre__icontains=search)
            | Q(description__icontains=search)
            | Q(photographe__icontains=search)
            | Q(lieu__icontains=search)
            | Q(mots_cles__icontains=search)
            | Q(album__titre__icontains=search)
            | Q(album__categorie__icontains=search)
        )
    return qs


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def albums_public(request):
    albums = AlbumGalerie.objects.filter(actif=True).annotate(nombre_photos=Count('photos', filter=Q(photos__actif=True)))
    return success({'albums': AlbumGalerieSerializer(albums, many=True, context={'request': request}).data})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def photos_public(request):
    photos = filtered_photos(request)
    return success({'photos': PhotoGalerieSerializer(photos, many=True, context={'request': request}).data})


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def photo_jpeg(request, photo_id):
    try:
        photo = PhotoGalerie.objects.get(pk=photo_id, actif=True, album__actif=True)
    except PhotoGalerie.DoesNotExist:
        return error('Photo introuvable.', status.HTTP_404_NOT_FOUND)

    photo.image.open('rb')
    image = ImageOps.exif_transpose(Image.open(photo.image))
    if image.mode not in ('RGB', 'L'):
        image = image.convert('RGB')

    output = BytesIO()
    image.save(output, format='JPEG', quality=92, optimize=True)
    filename = (photo.titre or photo.album.titre or f'photo-{photo.pk}').replace('/', '-').replace('\\', '-')
    response = HttpResponse(output.getvalue(), content_type='image/jpeg')
    response['Content-Disposition'] = f'attachment; filename="{filename}.jpg"'
    return response


@api_view(['POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def telecharger_photo(request, photo_id):
    try:
        photo = PhotoGalerie.objects.get(pk=photo_id, actif=True, album__actif=True)
    except PhotoGalerie.DoesNotExist:
        return error('Photo introuvable.', status.HTTP_404_NOT_FOUND)
    photo.telechargements += 1
    photo.save(update_fields=['telechargements', 'mise_a_jour'])
    return success({'photo': photo_to_dict(photo, request)})


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def albums_admin(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        albums = AlbumGalerie.objects.annotate(nombre_photos=Count('photos'))
        return success({'albums': AlbumGalerieSerializer(albums, many=True, context={'request': request}).data})

    payload = dict(json_body(request))
    payload['ordre'] = (AlbumGalerie.objects.aggregate(max_ordre=Max('ordre'))['max_ordre'] or 0) + 1
    serializer = AlbumGalerieSerializer(data=payload, context={'request': request})
    serializer.is_valid(raise_exception=True)
    album = serializer.save()
    return success({'album': album_to_dict(album, request)}, status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@authentication_classes([])
@permission_classes([AllowAny])
def album_admin_detail(request, album_id):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    try:
        album = AlbumGalerie.objects.get(pk=album_id)
    except AlbumGalerie.DoesNotExist:
        return error('Album introuvable.', status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        album.delete()
        return success({'message': 'Album supprime.'})

    serializer = AlbumGalerieSerializer(album, data=json_body(request), partial=True, context={'request': request})
    serializer.is_valid(raise_exception=True)
    album = serializer.save()
    return success({'album': album_to_dict(album, request)})


@api_view(['GET', 'POST'])
@authentication_classes([])
@permission_classes([AllowAny])
def photos_admin(request):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        photos = filtered_photos(request, admin=True)
        return success({'photos': PhotoGalerieSerializer(photos, many=True, context={'request': request}).data})

    serializer = PhotoGalerieSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    photo = serializer.save()
    return success({'photo': photo_to_dict(photo, request)}, status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@authentication_classes([])
@permission_classes([AllowAny])
def photo_admin_detail(request, photo_id):
    if not is_superadmin(request):
        return error('Acces reserve au superadmin.', status.HTTP_403_FORBIDDEN)

    try:
        photo = PhotoGalerie.objects.get(pk=photo_id)
    except PhotoGalerie.DoesNotExist:
        return error('Photo introuvable.', status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        photo.delete()
        return success({'message': 'Photo supprimee.'})

    serializer = PhotoGalerieSerializer(photo, data=request.data, partial=True, context={'request': request})
    serializer.is_valid(raise_exception=True)
    photo = serializer.save()
    return success({'photo': photo_to_dict(photo, request)})
