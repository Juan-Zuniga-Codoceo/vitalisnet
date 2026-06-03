# VitalisNet Backend 🩺

VitalisNet es un SaaS (Software as a Service) de agendamiento y gestión médica integral diseñado para clínicas, centros médicos y profesionales independientes de la salud. Esta plataforma permite automatizar la asignación de citas, controlar el flujo de finanzas y cajas, y enviar notificaciones inteligentes de confirmación en tiempo real.

---

## 🛠️ Stack Tecnológico

El backend del proyecto está construido bajo una arquitectura robusta, modular y asíncrona:

*   **Core**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+) - Rendimiento asíncrono de alta velocidad con tipado estático.
*   **Base de Datos**: [PostgreSQL 15](https://www.postgresql.org/) - Motor relacional con soporte nativo para extensiones espaciales y de exclusión.
*   **ORM**: [SQLAlchemy 2.0](https://www.sqlalchemy.org/) - Patrones modernos asíncronos y tipado declarativo.
*   **Migraciones**: [Alembic](https://alembic.sqlalchemy.org/) - Gestión y control de versiones del esquema de base de datos.
*   **Validación de Datos**: [Pydantic v2](https://docs.pydantic.dev/latest/) - Esquemas estrictos de entrada/salida y validación en tiempo de ejecución.
*   **Contenedores**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/) - Empaquetamiento homogéneo para desarrollo y producción.

---

## 🔒 Prevención de Double-Booking (Evitar Choques de Citas)

Uno de los mayores desafíos en las plataformas de agendamiento médico es la concurrencia y la prevención de sobrecupos o reservas simultáneas para el mismo profesional.

VitalisNet resuelve esto a nivel de capa de datos (PostgreSQL) combinando:
1.  **Rango de Tiempos con Zona Horaria (`TSTZRANGE`)**: En lugar de guardar campos separados de fecha y hora, guardamos la duración de la cita como un rango de tiempo continuo.
2.  **Exclusión de Intersección GIST (Restricción de Exclusión)**: Mediante la extensión `btree_gist`, la tabla `appointments` tiene configurada una regla de exclusión que impide insertar o actualizar una cita si existe otra para el mismo `professional_id` que se intersecte temporalmente (`&&`).

Si dos peticiones intentan reservar al mismo profesional al mismo tiempo, PostgreSQL rechaza la segunda inmediatamente. La API intercepta este error de integridad y responde con un código **HTTP 409 Conflict** controlado.

---

## 🚀 Guía de Instalación y Uso en Local

Sigue estos pasos para clonar y levantar el entorno de desarrollo local en minutos.

### Prerrequisitos
*   Tener instalado [Docker Engine](https://docs.docker.com/engine/install/) y [Docker Compose](https://docs.docker.com/compose/install/).

### 1. Clonar el repositorio y configurar variables de entorno
Crea una copia del archivo `.env.example` en la raíz del proyecto con el nombre `.env`:
```bash
cp .env.example .env
```
*(Puedes dejar los valores predeterminados para desarrollo local).*

### 2. Construir y levantar los contenedores
Levanta los servicios de la API y de PostgreSQL en segundo plano:
```bash
docker compose up --build -d
```

En local:
*   La **API de FastAPI** estará accesible en: `http://localhost:8000`
*   La **Documentación interactiva (Swagger UI)** estará en: `http://localhost:8000/docs`
*   El **puerto de PostgreSQL** se mapea hacia el host en el puerto `5433` (evitando colisiones si ya tienes un Postgres corriendo en tu máquina en el puerto `5432`).

### 3. Ejecutar las migraciones de base de datos
Una vez que los contenedores estén levantados y estables, inicializa las tablas del sistema corriendo las migraciones con Alembic:
```bash
docker compose exec web alembic upgrade head
```

---

## 🧪 Ejecutar Pruebas Locales

El backend incluye scripts de integración para comprobar la funcionalidad de cada módulo. Puedes ejecutarlos de forma directa desde tu entorno local:

*   **Prueba de Notificaciones y Cola de Fondo**:
    ```bash
    python3 scratch/test_notifications.py
    ```
*   **Prueba del Módulo Financiero**:
    ```bash
    python3 scratch/test_finanzas.py
    ```
*   **Prueba de Autenticación, Roles y JWT (RBAC)**:
    ```bash
    python3 scratch/test_auth.py
    ```

---

## 🚀 Entorno de Demostración (Demo Access)

Para facilitar las pruebas de la plataforma y validar los flujos clínicos y administrativos del MVP, el sistema cuenta con credenciales precargadas a través del script de seeding de base de datos. Se puede ingresar directamente desde la Landing Page usando los accesos rápidos o digitando las credenciales manualmente:

### 🩺 Acceso Profesional Médico
*   **Usuario**: `doctor@vitalisnet.cl`
*   **Contraseña**: `password123`
*   **Capacidades**: Vista de agenda médica semanal, timelines de fichas clínicas dinámicas con historial cronológico, evolución adaptativa según especialidad (Psicología con Anamnesis / Medicina General con signos vitales y CIE-10), y reportes individuales de honorarios profesionales (70% de las consultas cobradas).

### 🏢 Acceso Administrador de Centro
*   **Usuario**: `admin@vitalisnet.cl`
*   **Contraseña**: `password123`
*   **Capacidades**: Vista completa de agenda del centro, creación de clínicas y profesionales, gestión financiera global, cobro express de consultas y reportes agregados del centro médico (30% de las consultas cobradas).

---

## 💳 Modelo de Suscripción Freemium (Mercado Pago Chile)

La monetización comercial de VitalisNet está integrada de forma segura a través del servicio de suscripciones recurrentes de **Mercado Pago Chile**. 

*   **Periodo de Prueba**: Los profesionales de la salud obtienen **1 mes de prueba gratis** (trial de 30 días configurado en Mercado Pago con `has_trial: true` y `trial_duration: 30`).
*   **Tarifa Única**: Terminado el periodo de prueba, el cobro automatizado recurrente mensual es de **$29.990 CLP / mes**.
*   **Flujo**: El frontend solicita al backend crear una preferencia de suscripción recurrente mediante el endpoint `POST /api/v1/payments/subscribe`, retornando el enlace de checkout (`init_point`) seguro de Mercado Pago para procesar la transacción.

