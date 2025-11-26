
---------------------------------------------------------------------------------------------------
# PQRSD Frontend - Sistema de Gestión de Peticiones, Quejas y Reclamos
---------------------------------------------------------------------------------------------------

---------------------------------------------------------------------------------------------------
# Descripción del proyecto
---------------------------------------------------------------------------------------------------

PQRSD Frontend es una aplicación web desarrollada en React con TypeScript para la gestión integral de Peticiones, Quejas, Reclamos, Sugerencias y Denuncias. La aplicación ofrece una interfaz moderna y responsive construida con Material-UI y Tailwind CSS, permitiendo a los usuarios administrar eficientemente el flujo de PQRSD con funcionalidades de chat, administración de usuarios y generación de reportes.

---------------------------------------------------------------------------------------------------
# Tecnologías y librerías utilizadas:
---------------------------------------------------------------------------------------------------

React 18.3.1 - Biblioteca principal para la interfaz de usuario

TypeScript 5.9.2 - Superset de JavaScript para desarrollo tipado

Vite 5.4.3 - Herramienta de build y desarrollo rápido

Material-UI v7 - Biblioteca de componentes UI

Tailwind CSS 3.4.10 - Framework de CSS utility-first

React Router DOM 6.26.1 - Enrutamiento para aplicaciones SPA

Recharts 3.1.2 - Biblioteca de gráficos y visualizaciones

Day.js 1.11.18 - Manipulación de fechas

jsPDF & html2canvas - Generación de reportes en PDF

---------------------------------------------------------------------------------------------------
# Estructura del proyecto
---------------------------------------------------------------------------------------------------

text
pqrsd-frontend-react/
├── src/
│   ├── routes/              # Configuración de rutas de la aplicación
│   ├── chat/                # Componentes y lógica del sistema de chat
│   ├── dependence/          # Módulo de gestión de dependencias
│   ├── pqr/                 # Módulo principal de PQRSD
│   ├── userAdmin/           # Administración de usuarios
│   ├── store/               # Estado global (Zustand/Redux)
│   │   └── auth.tsx         # Store de autenticación
│   ├── ui/                  # Componentes UI reutilizables
│   │   ├── BasicRangeShortcuts.tsx
│   │   ├── DateRangePickerValue.tsx
│   │   └── Form.tsx
│   ├── App.tsx              # Componente principal de la aplicación
│   ├── index.css            # Estilos globales
│   └── main.tsx             # Punto de entrada de la aplicación
├── public/                  # Archivos estáticos
├── .env.sample              # Variables de entorno de ejemplo
├── bun.lock                 # Lock file de dependencias (Bun)
├── index.html               # Template HTML principal
├── package.json             # Dependencias y scripts del proyecto
├── postcss.config.js        # Configuración de PostCSS
├── tailwind.config.js       # Configuración de Tailwind CSS
├── tsconfig.json            # Configuración de TypeScript
└── vite.config.ts           # Configuración de Vite

---------------------------------------------------------------------------------------------------
# Explicación de las carpetas
---------------------------------------------------------------------------------------------------

src/routes/ - Configuración y definición de las rutas de la aplicación usando React Router

src/chat/ - Componentes y lógica para el sistema de mensajería interno

Gestión de conversaciones en tiempo real

Interfaz de chat responsive

src/dependence/ - Módulo para administrar dependencias organizacionales

DependenceAdminPage.tsx - Página de administración de dependencias

src/pqr/ - Módulo principal del sistema PQRSD

Formularios de creación y edición de PQRSD

Listado y filtrado de peticiones

Seguimiento de estados

src/userAdmin/ - Módulo de administración de usuarios

CRUD de usuarios

---------------------------------------------------------------------------------------------------
# Asignación de roles y permisos
---------------------------------------------------------------------------------------------------

src/store/ - Gestión del estado global de la aplicación

auth.tsx - Store para manejo de autenticación y sesión de usuario

src/ui/ - Componentes de interfaz de usuario reutilizables

Componentes personalizados de Material-UI

Formularios y pickers de fecha

---------------------------------------------------------------------------------------------------
# Configuración y entorno
---------------------------------------------------------------------------------------------------

Variables de entorno (.env.sample)
env
VITE_API_URL=http://localhost:3000/api
VITE_APP_TITLE=PQRSD System
VITE_UPLOAD_MAX_SIZE=5242880
Configuraciones principales:
Vite (vite.config.ts):

Plugin React configurado

Build optimizado para producción

Tailwind CSS (tailwind.config.js):

Configuración extendida con colores personalizados

Soporte para componentes de Material-UI

TypeScript (tsconfig.json):

Target ES2022

JSX react-jsx

Strict mode habilitado

Base URL configurada en "src"

Cómo ejecutar el proyecto
Prerrequisitos
Bun.js (recomendado) o Node.js (v18+)

Navegador web moderno

Entorno de desarrollo
Clonar e instalar dependencias:

bash
git clone <repository-url>
cd pqrsd-frontend-react
bun install
Configurar variables de entorno:

bash
cp .env.sample .env
# Editar .env con las configuraciones necesarias
Ejecutar en modo desarrollo:

bash
bun run dev
La aplicación estará disponible en: http://localhost:5173

Build para producción
Construir la aplicación:

bash
bun run build
Previsualizar build de producción:

bash
bun run preview
Desplegar:

Los archivos generados en dist/ pueden ser desplegados en cualquier servidor web estático

---------------------------------------------------------------------------------------------------
# Scripts disponibles
---------------------------------------------------------------------------------------------------
json
{
  "dev": "bunx vite",           // Servidor de desarrollo
  "build": "bunx vite build",   // Build de producción
  "preview": "bunx vite preview" // Preview del build
}
Características principales
Módulos implementados:
Gestión de PQRSD - Creación, edición y seguimiento de peticiones

Sistema de Chat - Comunicación interna entre usuarios

Administración de Dependencias - Gestión organizacional

Administración de Usuarios - Control de acceso y roles

Reportes y Dashboard - Visualización de métricas con Recharts

Generación de PDF - Exportación de reportes e información

Componentes UI destacados:
DateRangePickerValue - Selector de rangos de fecha

BasicRangeShortcuts - Atajos para selección de periodos

Form - Componente base para formularios

Componentes Material-UI personalizados

---------------------------------------------------------------------------------------------------
# Arquitectura del proyecto
---------------------------------------------------------------------------------------------------

text
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Componentes   │    │     Estado       │    │    Servicios    │
│     React       │◄──►│     Global       │◄──►│      API        │
│                 │    │    (Store)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Routing       │    │   Autenticación  │    │   Utilidades    │
│  React Router   │    │     (Auth)       │    │   (Helpers)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘

---------------------------------------------------------------------------------------------------
# Patrones utilizados:
---------------------------------------------------------------------------------------------------

Component-Based Architecture - Aplicación construida con componentes React reutilizables

Centralized State Management - Estado global manejado mediante stores

Modular Design - Separación por funcionalidades (PQRSD, Chat, Users, etc.)

Type Safety - TypeScript en todo el proyecto para mayor robustez

Responsive Design - Tailwind CSS + Material-UI para interfaces adaptables

Flujo de datos:
UI Components → Dispatchan acciones al Store

Store → Actualiza estado y notifica a componentes

Services → Manejan comunicación con API backend

Routing → Gestiona navegación entre módulos

La aplicación está diseñada para ser escalable, mantenible y con una excelente experiencia de usuario gracias a la combinación de las mejores tecnologías del ecosistema React.

