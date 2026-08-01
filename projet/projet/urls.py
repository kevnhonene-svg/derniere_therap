"""
URL configuration for projet project.
#BONJUR
The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from django.urls import include, path, re_path

urlpatterns = [
    path('', TemplateView.as_view(template_name='index.html'), name='frontend'),
    path('admin/', admin.site.urls),
    path('api/comptes/', include('dos_app.comptes.urls')),
    path('api/stock/', include('dos_app.stock.urls')),
    path('api/commandes/', include('dos_app.commande.urls')),
    path('api/messages/', include('dos_app.message.urls')),
    path('api/validation-billets/', include('dos_app.validation_billet.urls')),
    path('api/presence-vocale/', include('dos_app.presence_vocale.urls')),
    path('api/galerie/', include('dos_app.galerie.urls')),
]

if settings.DEBUG and str(settings.MEDIA_URL).startswith('/'):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += [
        path('assets/<path:path>', serve, {'document_root': settings.BASE_DIR / 'frontend_react' / 'dist' / 'assets'}),
        re_path(r'^(?P<path>manifest\.webmanifest|sw\.js|favicon\.png|apple-touch-icon\.png|favicon\.svg|icons\.svg)$', serve, {'document_root': settings.BASE_DIR / 'frontend_react' / 'dist'}),
    ]
