# Sistema de Inventarios - Soberana SAS

Este proyecto es una plataforma web para la gestión de inventarios físicos (conteos) de Soberana SAS, permitiendo la administración de bodegas, productos, usuarios y la generación de reportes de control de stock.

## Tecnologías Utilizadas

* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React, Motion.
* **Backend:** Python 3.13, Django, Django REST Framework.
* **Base de Datos:** MongoDB (integrado mediante `django-mongodb-backend`).

---

##  1. Justificación de la Arquitectura de la Solución

El proyecto evolucionó de un prototipo monolítico a una arquitectura **Desacoplada (Cliente-Servidor)** más robusta, escalable y preparada para entornos de producción.

* **Frontend (React + Vite + TypeScript):**
  * Se eligió React bajo el paradigma de *Single Page Application (SPA)* para garantizar una experiencia de usuario fluida, sin recargas de página.
  * Vite proporciona un entorno de desarrollo ultrarrápido (HMR) y un empaquetado optimizado para producción.
  * TypeScript añade tipado estático, reduciendo drásticamente los errores en tiempo de ejecución al interactuar con las respuestas del backend.
* **Backend (Python + Django + DRF):**
  * Se adoptó Django por su robustez, su sistema de seguridad integrado (manejo nativo de sesiones, hashing de contraseñas con PBKDF2) y su capacidad de escalar.
  * *Django REST Framework (DRF)* facilita la creación de endpoints estandarizados, permitiendo una comunicación limpia a través de JSON.
* **Base de Datos (MongoDB):**
  * Se migró de SQLite (limitado en concurrencia) a **MongoDB**, una base de datos NoSQL orientada a documentos, ideal para alta disponibilidad y escalabilidad horizontal.
  * Para la integración, se utiliza el **conector oficial `django-mongodb-backend`**, lo que permite mantener la elegancia y seguridad del ORM nativo de Django, aprovechando internamente la velocidad de lectura/escritura de BSON y el uso de identificadores nativos (`ObjectId`).

---

## 2. Patrones de Diseño, Limpieza de Código y Estructura

### Patrones de Diseño Implementados
* **Arquitectura Cliente-Servidor (REST):** Clara separación de responsabilidades. El frontend se encarga exclusivamente de la capa de presentación (UI/UX) y el estado local, mientras que el backend maneja la lógica de negocio, autenticación y persistencia de datos.
* **Modelo-Vista-Controlador (MVC):** En el backend de Django, seguimos el patrón *Model-View-Template* (donde la "Template" es reemplazada por Serializadores JSON). Los Modelos (`models.py`) definen los datos, los Serializadores (`serializers.py`) actúan como capa de transformación, y las Vistas (`views.py`) actúan como controladores lógicos.
* **Componentes Funcionales (Frontend):** Se utiliza una arquitectura basada en componentes de React, aislando las vistas (Login, Dashboard, Gestión de Usuarios) mediante renderizado condicional controlado por estado.

### Prácticas de Clean Code
* **Separation of Concerns (SoC):** La configuración del proxy en Vite (`vite.config.ts`) aísla al frontend de la complejidad de las URLs absolutas y los puertos del backend, previniendo problemas de CORS en desarrollo y evitando *hardcodear* la ruta `localhost:8080`.
* **Tipado Estricto (TypeScript):** Se definieron interfaces exactas (`User`, `Warehouse`, `Product`, `InventoryRecord`) que funcionan como un contrato estricto entre el cliente y el servidor.
* **Gestión de Errores Centralizada:** Implementación de bloques `try/catch` con retroalimentación visual inmediata (UI) usando notificaciones de éxito/error estandarizadas.

### Estructura del Proyecto
```text
/
├── backend/                  # Servidor Python/Django (Puerto 8080)
│   ├── core/                 # Configuración principal (settings.py, urls.py)
│   ├── api/                  # Aplicación principal
│   │   ├── models.py         # Definición de colecciones de MongoDB
│   │   ├── serializers.py    # Transformación de Modelos a JSON
│   │   ├── views.py          # Lógica de endpoints
│   │   └── management/       # Comandos personalizados (seed_data)
│   └── manage.py             # CLI de Django
│
└── frontend/                 # Cliente React/Vite (Puerto 5173)
    ├── src/
    │   ├── App.tsx           # Componente raíz y enrutador lógico
    │   └── main.tsx          # Punto de entrada de React
    └── vite.config.ts        # Configuración de empaquetado y Proxy API

## 3. Modelo de Datos ("Cómo se almacena")

Los datos residen en **MongoDB**, una base de datos NoSQL orientada a documentos. El proyecto utiliza el ORM de Django para mantener la integridad referencial y las validaciones de negocio a nivel de código. Las relaciones se guardan referenciando el `ObjectId` nativo de Mongo o llaves primarias explícitas.

1. **Colección `users` (Usuarios):**
   * Hereda del modelo de autenticación estándar de Django (`AbstractUser`).
   * Almacena: `ObjectId` (generado automáticamente), `username`, `password` (hasheada criptográficamente con PBKDF2), `first_name`, `identification` (única) y `role` (admin/user).
   * *Relación:* Campo *Many-to-Many* con las bodegas (almacena un array de referencias).
2. **Colección `warehouses` (Bodegas):**
   * Almacena: `code` (string, actúa como llave primaria y `_id` en Mongo), `description`, `status`.
3. **Colección `products` (Productos):**
   * Almacena: `code` (string, llave primaria/`_id`), `description`, `inventory_unit`, `packaging_unit` y `conversion_factor`.
4. **Colección `inventory_counts` (Conteos / Transacciones):**
   * Es la colección transaccional principal donde se registran las operaciones diarias.
   * Almacena: `ObjectId` nativo, `count_number`, `cut_off_date`, y cantidades (`quantity_packaging`, `quantity_units`).
   * *Relaciones:* Referencias cruzadas lógicas hacia `user_id`, `warehouse_code` y `product_code`. El backend realiza la población de datos ("Joins") al generar reportes a través de los Serializadores.

---

## 🚀 4. Guía de Instalación y Ejecución

### Prerrequisitos
* **Python** 3.13 o superior.
* **Node.js** v18 o superior.
* **MongoDB** (Instalación local corriendo en el puerto 27017 o un clúster de Atlas configurado en el `settings.py`).

### Configuración del Backend (Django)

1. Abrir una terminal y navegar a la carpeta raíz del backend:
   ```bash
   cd backend

2. Crear y activar el entorno virtual:
python -m venv venv

# Activar en Windows:
venv\Scripts\activate

# Activar en Mac/Linux:
source venv/bin/activate

3. Instalar las dependencias del proyecto: 
pip install django djangorestframework django-cors-headers requests pymongo django-mongodb-backend

4. Ejecutar las migraciones para crear las colecciones en MongoDB:
python manage.py makemigrations admin auth contenttypes api
python manage.py migrate

5. Cargar los datos semilla (Bodegas, Productos y Usuario Admin por defecto):
python manage.py seed_data

6. Levantar el servidor en el puerto 8080:
python manage.py runserver 8080

Configuración del Frontend (React + Vite)

1.Abrir una nueva terminal y navegar a la carpeta del frontend:
cd frontend

2. Instalar los paquetes de Node:
npm install

3.Levantar el servidor de desarrollo:
npm run dev
Acceder a la aplicación desde el navegador en http://localhost:3000.
(Nota: Las peticiones a la API serán redirigidas automáticamente al puerto 8080 gracias al proxy configurado en vite.config.ts).

4. Credenciales de Acceso por Defecto
Usuario: admin
Contraseña: admin123