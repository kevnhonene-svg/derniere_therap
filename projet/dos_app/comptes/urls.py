from django.urls import path
from dos_app.comptes import views

urlpatterns = [
    path('configuration/', views.configuration, name='configuration'),
    path('configuration/admin/', views.configuration_admin, name='configuration_admin'),
    path('exports/xlsx/', views.export_xlsx, name='export_xlsx'),
    path('login-billet/', views.login_billet, name='login_billet'),
    path('login-admin/', views.login_admin, name='login_admin'),
    path('logout/', views.logout_view, name='logout'),
    path('me/', views.me, name='me'),
    path('tables/disponibles/', views.tables_disponibles, name='tables_disponibles'),
    path('tables/', views.tables_admin, name='tables_admin'),
    path('tables/<int:table_id>/', views.table_admin_detail, name='table_admin_detail'),
    path('invites/', views.invites_admin, name='invites_admin'),
    path('invites/<int:invite_id>/', views.invite_admin_detail, name='invite_admin_detail'),
]
