from django.urls import path
from dos_app.galerie import views


urlpatterns = [
    path('albums/', views.albums_public, name='galerie_albums_public'),
    path('photos/', views.photos_public, name='galerie_photos_public'),
    path('photos/<int:photo_id>/jpeg/', views.photo_jpeg, name='galerie_photo_jpeg'),
    path('photos/<int:photo_id>/telecharger/', views.telecharger_photo, name='galerie_telecharger_photo'),
    path('admin/albums/', views.albums_admin, name='galerie_albums_admin'),
    path('admin/albums/<int:album_id>/', views.album_admin_detail, name='galerie_album_admin_detail'),
    path('admin/photos/', views.photos_admin, name='galerie_photos_admin'),
    path('admin/photos/<int:photo_id>/', views.photo_admin_detail, name='galerie_photo_admin_detail'),
]
