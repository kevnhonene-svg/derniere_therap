from django.urls import path
from dos_app.commande import views

urlpatterns = [
    path('quota/', views.quota_courant, name='quota_courant'),
    path('quotas/', views.quotas_admin, name='quotas_admin'),
    path('', views.commandes, name='commandes'),
    path('<int:commande_id>/statut/', views.changer_statut, name='changer_statut'),
]
