from django.urls import path
from dos_app.message import views

urlpatterns = [
    path('', views.messages, name='messages'),
    path('conversations/', views.conversations, name='conversations'),
]
