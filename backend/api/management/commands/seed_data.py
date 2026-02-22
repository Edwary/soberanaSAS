from django.core.management.base import BaseCommand
from api.models import Warehouse, Product, User

class Command(BaseCommand):
    help = 'Seeds initial data'

    def handle(self, *args, **kwargs):
        # Warehouses
        if Warehouse.objects.count() == 0:
            Warehouse.objects.create(code="00009", description="Cereté", status="Activo")
            Warehouse.objects.create(code="00014", description="Central", status="Activo")
            Warehouse.objects.create(code="00006", description="Valledupar", status="Activo")
            Warehouse.objects.create(code="00090", description="Maicao", status="Inactivo por remodelaciones")
            self.stdout.write("Warehouses created.")

        # Products
        if Product.objects.count() == 0:
            Product.objects.create(code="4779", description="ATUN TRIPACK LA SOBERANA ACTE 80 GRM", inventory_unit="UND", packaging_unit="CAJA", conversion_factor=12)
            Product.objects.create(code="4266", description="HARINA AREPA REPA BLANCA 500G X24", inventory_unit="UND", packaging_unit="ARROBA", conversion_factor=24)
            Product.objects.create(code="4442", description="HARINA LA SOBERANA BLANCA 500G X24", inventory_unit="UND", packaging_unit="ARROBA", conversion_factor=24)
            self.stdout.write("Products created.")

        # Admin User
        if not User.objects.filter(username="admin").exists():
            User.objects.create_superuser(
                username="admin",
                password="admin123",
                identification="12345678",
                first_name="Admin Principal",
                role="admin"
            )
            self.stdout.write("Admin created.")