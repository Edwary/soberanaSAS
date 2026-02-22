# Sistema de Inventarios - Soberana SAS

Este proyecto es una plataforma web para la gestión de inventarios físicos (conteos) de Soberana SAS, permitiendo la administración de bodegas, productos, usuarios y la generación de reportes de control de stock.

## 🛠 Tecnologías Utilizadas

* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React, Motion.
* **Backend:** Python 3.13, Django, Django REST Framework.
* **Base de Datos:** MongoDB (integrado mediante `django-mongodb-backend`).

---

## 🏗 1. Justificación de la Arquitectura de la Solución

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

## 🧩 2. Patrones de Diseño, Limpieza de Código y Estructura

### Patrones de Diseño Implementados
* **Arquitectura Cliente-Servidor (REST):** Clara separación de responsabilidades. El frontend se encarga exclusivamente de la capa de presentación (UI/UX) y el estado local, mientras que el backend maneja la lógica de negocio, autenticación y persistencia de datos.
* **Modelo-Vista-Controlador (MVC / MVT):** En el backend de Django, seguimos el patrón *Model-View-Template* (donde la "Template" es reemplazada por Serializadores JSON). Los Modelos (`models.py`) definen los datos, los Serializadores (`serializers.py`) actúan como capa de transformación, y las Vistas (`views.py`) actúan como controladores lógicos.
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