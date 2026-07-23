from django.urls import path
from dos_app.stock import views

urlpatterns = [
    path('boissons/', views.boissons, name='boissons'),
    path('boissons/admin/', views.boissons_admin, name='boissons_admin'),
    path('boissons/admin/<int:boisson_id>/', views.boisson_admin_detail, name='boisson_admin_detail'),
]
