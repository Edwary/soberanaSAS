from rest_framework import serializers
from .models import User, Warehouse, Product, InventoryCount

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    # Incluimos las bodegas asignadas en la respuesta del usuario
    assignedWarehouses = WarehouseSerializer(source='warehouses', many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'identification', 'name', 'username', 'role', 'assignedWarehouses']

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class InventoryCountSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryCount
        fields = '__all__'

# Serializador para el reporte (Join manual)
class ReportSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.description', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.description', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True) # Usamos name como 'name'

    class Meta:
        model = InventoryCount
        fields = '__all__'