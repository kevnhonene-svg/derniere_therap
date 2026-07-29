from django.urls import path
from dos_app.presence_biometrique import views


urlpatterns = [
    path('', views.presences, name='presences_biometriques'),
    path('enregistrement/options/', views.options_enregistrement, name='presence_options_enregistrement'),
    path('enregistrement/confirmer/', views.confirmer_enregistrement, name='presence_confirmer_enregistrement'),
    path('action/options/', views.options_action, name='presence_options_action'),
    path('action/confirmer/', views.confirmer_action, name='presence_confirmer_action'),
]
