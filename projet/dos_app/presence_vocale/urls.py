from django.urls import path
from dos_app.presence_vocale import views


urlpatterns = [
    path('', views.presences, name='presences_vocales'),
    path('scanner/', views.scanner_voix, name='scanner_voix'),
]
