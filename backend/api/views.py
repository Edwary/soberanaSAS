from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
import requests
from .models import User, Warehouse, Product, InventoryCount
from .serializers import UserSerializer, WarehouseSerializer, ProductSerializer, InventoryCountSerializer, \
    ReportSerializer


# --- Auth ---
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    # Django maneja hashes de contraseña, no texto plano.
    # Si migras usuarios antiguos con texto plano, necesitarás una lógica especial.
    # Aquí asumimos autenticación estándar de Django.
    user = authenticate(username=username, password=password)

    if user:
        serializer = UserSerializer(user)
        return Response(serializer.data)
    else:
        return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)


# --- Users ---
@api_view(['GET'])
def get_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def sync_users(request):
    try:
        response = requests.get("https://randomuser.me/api/?results=100")
        data = response.json()
        count = 0

        for u in data['results']:
            username = u['login']['username']
            if not User.objects.filter(username=username).exists():
                identification = str(u['id']['value'] or u['login']['uuid'][:8])
                name = f"{u['name']['first']} {u['name']['last']}"

                # Crear usuario usando el helper de Django para hashear password
                User.objects.create_user(
                    username=username,
                    password="soberana2025",
                    first_name=name,  # Mapeamos 'name' a first_name
                    identification=identification,
                    role='user'
                )
                count += 1

        return Response({"message": "Sincronización exitosa", "count": count})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def assign_warehouse(request):
    user_id = request.data.get('user_id')
    warehouse_code = request.data.get('warehouse_code')

    try:
        user = User.objects.get(id=user_id)
        warehouse = Warehouse.objects.get(code=warehouse_code)
        user.warehouses.add(warehouse)  # Relación ManyToMany
        return Response({"success": True})
    except Exception as e:
        return Response({"error": "Error asignando bodega"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# --- Warehouses & Products ---
@api_view(['GET'])
def get_warehouses(request):
    warehouses = Warehouse.objects.all()
    serializer = WarehouseSerializer(warehouses, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


# --- Inventory ---
@api_view(['POST'])
def create_inventory_count(request):
    data = request.data
    try:
        product = Product.objects.get(code=data['product_code'])
        quantity_packaging = float(data['quantity_packaging'])
        quantity_units = quantity_packaging * product.conversion_factor

        inventory = InventoryCount.objects.create(
            count_number=data['count_number'],
            cut_off_date=data['cut_off_date'],
            warehouse_id=data['warehouse_code'],
            product=product,
            quantity_packaging=quantity_packaging,
            quantity_units=quantity_units,
            user_id=data['user_id']
        )

        return Response({
            "id": inventory.id,  # Mongo ID
            "quantity_units": quantity_units
        })
    except Product.DoesNotExist:
        return Response({"error": "Producto no encontrado"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_reports(request):
    counts = InventoryCount.objects.all().order_by('-created_at')
    serializer = ReportSerializer(counts, many=True)
    return Response(serializer.data)