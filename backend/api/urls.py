from django.urls import path
from . import views

urlpatterns = [
    path('login', views.login_view),
    path('users', views.get_users),
    path('sync-users', views.sync_users),
    path('assign-warehouse', views.assign_warehouse),
    path('warehouses', views.get_warehouses),
    path('products', views.get_products),
    path('inventory-counts', views.create_inventory_count),
    path('reports', views.get_reports),
]