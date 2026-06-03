# VitalisNet - Cliente Web (SaaS Médico)

Este repositorio contiene la interfaz de usuario frontend para **VitalisNet**, la plataforma SaaS integral para la gestión de centros clínicos y consultas médicas, desarrollada por **SynapseDev**.

El cliente está construido bajo altos estándares de UX/UI clínico, utilizando React, TypeScript, Vite y Tailwind CSS, respetando las pautas y paleta de colores del Brand Book oficial.

## Características Clave Implementadas

1. **Autenticación Segura (JWT en Memoria)**:
   - Sistema de inicio de sesión de alta seguridad que almacena el token JWT exclusivamente en la memoria RAM para prevenir ataques XSS.
   - Decodificación del token para identificar el rol del usuario (`admin_centro` o `profesional`) y resolver el nombre de su centro clínico.

2. **Agenda Médica Interactiva (Paso 2)**:
   - Planificador semanal interactivo maquetado 100% con **CSS Grid** de Tailwind.
   - Navegación por fechas y semanas controlada con `dayjs` (configurado en español).
   - Gestión de estados de citas (Pendiente, Confirmado, Atendido/Pagado, Cancelado) reflejado visualmente con colores de marca.
   - Modales interactivos para reservar nuevas citas y editar/cancelar citas existentes en tiempo real.

3. **Gestión de Fichas Clínicas Dinámicas (Paso 3)**:
   - Buscador clínico de pacientes por Nombre o RUT.
   - Línea de tiempo (Timeline) vertical interactiva que desglosa el historial de atenciones de forma ordenada.
   - **Formulario adaptativo con soporte para JSONB**:
     - *Psicología*: Habilita campos dinámicos para anamnesis y notas internas de sesión.
     - *Medicina General*: Habilita campos dinámicos estructurados para registrar Signos Vitales (P. Arterial, Frecuencia Cardíaca, Peso, Estatura) y códigos de diagnóstico **CIE-10**.
     - Empaqueta los campos dinámicos en un objeto estructurado `evolucion_dinamica` listo para almacenamiento JSONB en la base de datos de producción.

4. **Panel de Finanzas, Cajas y Comisiones (Paso 4)**:
   - Visualización analítica de ingresos mediante tres tarjetas superiores de KPI (Ingresos Totales, 70% Comisión Profesional para Médicos, y 30% Ingresos de Centro Médico).
   - Tabla de flujo de caja detallando transacciones diarias.
   - Filtros de reportes segmentados por Profesional Médico y rango temporal (Hoy, Esta Semana, Este Mes).
   - **Flujo de Cobro rápido**: Botón "Cobrar" para citas con estado de pago pendiente, desplegando un modal de cobro integrado para registrar el medio de pago (Transbank, Transferencia, Efectivo) y actualizar el balance de caja al instante.

## Stack Tecnológico

- **Core**: React 19, TypeScript
- **Bundler**: Vite
- **Estilos**: Tailwind CSS v3, PostCSS, Autoprefixer
- **Librería de Iconos**: Lucide React
- **Fechas**: Day.js (con soporte de localización al español e IsBetween)
- **HTTP/API Client**: Axios

---

## Guía de Configuración Local

### Prerrequisitos

Asegúrate de contar con [Node.js](https://nodejs.org/) (versión 18 o superior) y npm instalados en tu sistema.

### Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del proyecto para descargar e instalar todas las dependencias requeridas:

```bash
npm install
```

### Ejecutar Servidor de Desarrollo

Levanta el servidor de desarrollo local con Vite:

```bash
npm run dev
```

El servidor estará disponible en la dirección local indicada por la terminal (generalmente `http://localhost:5173`).

### Compilar para Producción

Para generar el bundle de producción optimizado y minimizado listo para ser desplegado por Nginx o CDN:

```bash
npm run build
```

El resultado de la compilación se generará dentro del directorio `/dist`.
