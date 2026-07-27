from django.urls import path
from dos_app.validation_billet import views

urlpatterns = [
    path('rechercher/', views.rechercher_billet, name='rechercher_billet'),
    path('valider/', views.valider_billet, name='valider_billet'),
]
