from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    # Heredamos de AbstractUser para tener gestión de sesiones/passwords segura
    identification = models.CharField(max_length=20, unique=True, null=True)
    ROLE_CHOICES = (('admin', 'Admin'), ('user', 'User'))
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')

    # Relación Many-to-Many con bodegas
    warehouses = models.ManyToManyField('Warehouse', related_name='users', blank=True)

    def __str__(self):
        return self.username


class Warehouse(models.Model):
    code = models.CharField(max_length=20, primary_key=True)
    description = models.CharField(max_length=255)
    status = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.code} - {self.description}"


class Product(models.Model):
    code = models.CharField(max_length=50, primary_key=True)
    description = models.CharField(max_length=255)
    inventory_unit = models.CharField(max_length=20)
    packaging_unit = models.CharField(max_length=20)
    conversion_factor = models.IntegerField()

    def __str__(self):
        return self.description


class InventoryCount(models.Model):
    # En Mongo no necesitamos definir ID explícitamente, se crea automático
    count_number = models.IntegerField(choices=[(1, '1'), (2, '2'), (3, '3')])
    cut_off_date = models.DateField()  # O DateTimeField según prefieras
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity_packaging = models.FloatField()
    quantity_units = models.FloatField()
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Count {self.count_number} - {self.product.code}"