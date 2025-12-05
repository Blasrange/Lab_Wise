# Blueprint Técnico y Funcional de LabWise

## 1. Introducción

**LabWise** es un Sistema de Gestión de Equipos de Laboratorio diseñado para ser una solución moderna, intuitiva y potente. Permite a los laboratorios llevar un control preciso de su inventario de equipos, gestionar ciclos de mantenimiento y calibración, y automatizar notificaciones críticas para garantizar el cumplimiento normativo y la operatividad.

Este documento sirve como una guía técnica para desarrolladores, detallando la arquitectura, las tecnologías utilizadas y las funcionalidades implementadas.

---

## 2. Stack Tecnológico

La plataforma está construida sobre un conjunto de tecnologías modernas y robustas, elegidas para ofrecer una excelente experiencia de usuario, un desarrollo ágil y escalabilidad.

### Frontend

- **Framework:** **Next.js (con App Router)**. Se utiliza para el renderizado del lado del servidor (SSR), la optimización de rutas y un rendimiento superior.
- **Lenguaje:** **TypeScript**. Para un código más seguro, mantenible y con autocompletado inteligente.
- **Librería de UI:** **React**. Para la construcción de interfaces de usuario dinámicas y componentizadas.
- **Componentes UI:** **ShadCN UI**. Una colección de componentes reutilizables, accesibles y estéticamente agradables, construidos sobre Radix UI y Tailwind CSS. Los componentes base se encuentran en `src/components/ui`.
- **Estilos:** **Tailwind CSS**. Un framework CSS "utility-first" que permite estilizar componentes directamente en el marcado de forma rápida y consistente. La configuración del tema (colores, fuentes) se gestiona en `src/app/globals.css`.
- **Gestión de Formularios:** **React Hook Form** con **Zod** para la validación de esquemas, asegurando que los datos de los formularios sean correctos antes de ser procesados.
- **Iconos:** **Lucide React**. Una librería de iconos ligera y personalizable.

### Backend (Simulación y Arquitectura Futura)

- **Estado Actual (Backend Simulado):**

  - Toda la lógica de negocio y el acceso a datos están simulados en **servicios en memoria** ubicados en `src/services/*.ts` (ej. `equipmentService.ts`, `userService.ts`).
  - Los datos se inicializan desde `src/lib/data.ts` y se pierden cada vez que el servidor se reinicia. Esta es una configuración temporal para desarrollo.

- **Arquitectura Futura (Recomendada):**
  - **Base de Datos:** **Firebase Firestore**. Una base de datos NoSQL, escalable y en tiempo real, ideal para almacenar los equipos, usuarios, historiales y registros.
  - **Autenticación:** **Firebase Authentication**. Para gestionar el registro, inicio de sesión y la seguridad de las sesiones de usuario.
  - **Automatización:** **Firebase Cloud Functions**. Para ejecutar lógica en segundo plano (ej. "cron jobs" para enviar notificaciones automáticas) sin depender de la interacción del usuario.

### Inteligencia Artificial

- **Framework de IA:** **Genkit (de Google)**. Un framework open-source para construir flujos de IA robustos y listos para producción.
  - Los flujos de Genkit se definen en `src/ai/flows/*.ts`.
  - Estos flujos gestionan tareas como el análisis de datos de equipos (`smart-alerting.ts`) y el envío de correos electrónicos (`send-email.ts`).
  - Las plantillas HTML para los correos se encuentran en `src/ai/email-templates/`.

---

## 3. Estructura de Archivos Clave

```
/src
├── ai/
│   ├── flows/              # Lógica de negocio de IA (Genkit)
│   └── email-templates/    # Plantillas HTML para correos
├── app/
│   ├── (app)/              # Rutas protegidas de la aplicación
│   │   ├── dashboard/
│   │   ├── equipment/
│   │   └── ...
│   ├── login/              # Página de inicio de sesión
│   └── m/                  # Vista móvil para gestión por QR
├── components/
│   ├── layout/             # Componentes de estructura (Sidebar, Breadcrumbs)
│   └── ui/                 # Componentes base de ShadCN (Button, Card, etc.)
├── hooks/                  # Hooks personalizados (useAuth, useToast)
├── lib/
│   ├── i18n/               # Ficheros de internacionalización (español/inglés)
│   ├── data.ts             # Datos de prueba (mock data)
│   ├── types.ts            # Definiciones de tipos de TypeScript
│   └── utils.ts            # Funciones de utilidad
└── services/               # Lógica de "backend simulado"
    ├── equipmentService.ts
    ├── userService.ts
    └── ...
```

---

## 4. Funcionalidad del Módulo de Equipos (`/equipment`)

Este es el módulo central de la aplicación y agrupa las siguientes funcionalidades:

### Listado y Búsqueda

- **Tabla de Datos (`data-table`):** Muestra todos los equipos con columnas clave. Es ordenable y paginable.
- **Filtros:** Permite filtrar la lista de equipos por nombre (búsqueda de texto) y por el estado de sus mantenimientos (`Programado`, `Completado`, etc.).
- **Vista Expandible:** Cada fila de la tabla se puede expandir para mostrar detalles adicionales del equipo y un resumen de su historial de mantenimiento sin salir de la página.

### Gestión de Equipos (CRUD)

- **Añadir/Editar Equipos:** Un único formulario modal (`EquipmentForm`) se utiliza tanto para crear nuevos equipos como para editar los existentes. La validación se realiza con Zod para garantizar la integridad de los datos.
- **Historial de Acciones:** Cada creación o modificación de un equipo se registra en el `activityLogService`, creando una traza de auditoría.

### Programación de Mantenimiento

- **Flujo Multi-paso:** Al hacer clic en "Programar Mantenimiento", se abre un diálogo (`ScheduleMaintenanceDialog`) que guía al usuario.
  1.  **Paso 1: Selección del Tipo:** El usuario elige el tipo de mantenimiento (Preventivo, Correctivo, Predictivo) a partir de una lista visual.
  2.  **Paso 2: Detalles del Formulario:** Se completa la información específica como fecha programada, técnico responsable, prioridad y descripción.
- **Registro en Historial:** Al guardar, la nueva tarea de mantenimiento se añade al historial del equipo correspondiente.

### Generación de Códigos QR

- **Acceso Móvil:** La acción "Generar QR" abre un diálogo (`GenerateQrDialog`) que muestra un código QR único para cada equipo.
- **Funcionalidad:** Este QR, al ser escaneado con un dispositivo móvil, redirige al técnico a una vista simplificada (`/m/[token]`) donde puede ver las tareas pendientes de ese equipo y actualizar su estado directamente desde el campo.

### Importación y Exportación

- **Exportar a Excel:** Permite exportar el historial de mantenimiento de todos los equipos a un archivo `.xlsx`. El usuario puede seleccionar un rango de fechas para el reporte.
- **Importar desde Excel:** Ofrece una funcionalidad de carga masiva de equipos.
  1.  **Plantilla:** El usuario puede descargar una plantilla de Excel para asegurar el formato correcto.
  2.  **Carga y Vista Previa:** Al subir el archivo, el sistema muestra una vista previa de los datos que se van a importar.
  3.  **Lógica Inteligente:** El sistema detecta si un equipo (por su código interno) ya existe para actualizarlo, o si es nuevo para crearlo. Esto evita duplicados y facilita la actualización masiva.
