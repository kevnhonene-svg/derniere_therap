from django.urls import path
from dos_app.commande import views

urlpatterns = [
    path('quota/', views.quota_courant, name='quota_courant'),
    path('quotas/', views.quotas_admin, name='quotas_admin'),
    path('quotas/<int:quota_id>/', views.quota_admin_detail, name='quota_admin_detail'),
    path('quotas/indications/', views.indications_quotas, name='indications_quotas'),
    path('quotas/indications/<int:indication_id>/', views.indication_quota_detail, name='indication_quota_detail'),
    path('', views.commandes, name='commandes'),
    path('<int:commande_id>/statut/', views.changer_statut, name='changer_statut'),
]
