# Delfos Support - Sistema Personal de Gestión Técnica y Soporte TI

> **Herramienta personal de productividad para UN técnico de soporte institucional.**  
> *Sin backend, sin frameworks, 100% offline y privado en el navegador mediante IndexedDB.*

---

## 📋 Resumen Ejecutivo y Propósito
**Delfos Support** es una solución web independiente diseñada para que un único técnico de soporte registre ágilmente cada intervención técnica realizada durante su jornada laboral (en menos de 20 segundos) y, al final del mes, genere informes ejecutivos automáticos listos para Dirección en formatos **PDF** y **PowerPoint (.pptx)**.

> ⚠️ **Importante:** NO es un sistema de tickets ni un Help Desk multisuario. No existe portal para clientes ni solicitudes externas; es la bitácora personal de control, inventario y análisis del técnico de TI.

---

## 🚀 Puesta en Marcha Inmediata
No requiere Node.js, npm, servidores locales ni pasos de compilación (*build*):
1. **Uso local directo:** Abre `index.html` con doble clic en cualquier navegador moderno (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari, Brave). Funciona perfectamente bajo el protocolo `file://`.
2. **Alojamiento estático:** Puedes subir la carpeta completa a **GitHub Pages**, **Netlify**, **Vercel** o cualquier servidor web estático institucional sin configuración adicional.

---

## 🎨 Identidad Visual y Paleta Institucional (Delfos Online)
Inspirada en la identidad de la plataforma institucional *Delfos Online*:
- **Verde Principal:** `#1B6B3A` (Botones de acción, píldoras activas, acentos de marca)
- **Verde Medio:** `#175A31` (Efectos *hover* y transiciones)
- **Verde Oscuro:** `#0D4221` (Fin del degradado institucional en banners)
- **Dorado de Acento:** `#F5B731` (Logo, nombres destacados, advertencias e insignias)
- **Texto Principal:** `#1A1B2E` (Alto contraste AA)
- **Texto Secundario:** `#6B7280`
- **Fondo General:** `#F6F7F9`
- **Bordes y Tarjetas:** Bordes sutiles `#E5E7EB`, tarjetas blancas con radio de `14px` y sombras suaves.
- **Tonos Pasteles para Íconos:** Rosa (`#FCF0FE`), Ámbar (`#FEF7EB`), Menta (`#EBF9F5`), Morado (`#F8F1FE`), Azul (`#EFF6FF`).
- **Estados:** Pendiente (`#F59E0B`), En proceso (`#3B82F6`), Resuelto (`#16A34A`), Error (`#DC2626`).
- **Tipografía:** *Plus Jakarta Sans* (400, 500, 600, 700, 800) cargada vía Google Fonts.

---

## 🏗️ Arquitectura de Software y Código

```text
delfos-support/
├── index.html                  # Orquestador HTML5 principal (compatible con file://)
├── README.md                   # Documentación técnica completa
├── assets/
│   ├── css/
│   │   ├── variables.css       # Paleta Delfos, radios (14px), sombras y accesibilidad
│   │   ├── base.css            # Reset, App Shell, Sidebar, Topbar y Mobile Nav Bar
│   │   ├── componentes.css     # Botones (>=48px), inputs, modales, toasts, badges
│   │   └── vistas.css          # Estilos de Dashboard, Nuevo Soporte, Reportes, etc.
│   └── js/
│       ├── db.js               # Repositorio IndexedDB (listar, obtener, guardar, eliminar)
│       ├── utils.js            # Fechas (dd/mm/aaaa), hora 24h, toasts con deshacer, CSV
│       ├── seed.js             # Catálogos base (edificios, tipos) y generador de 3 meses
│       ├── estado.js           # Gestor de estado SPA y caché reactiva en memoria
│       ├── app.js              # Bootstrap, atajos globales de teclado y enrutamiento
│       └── vistas/
│           ├── dashboard.js    # KPIs del mes, 4 gráficas Chart.js, pendientes 1-toque
│           ├── nuevo-soporte.js# Registro ultra rápido (<20s), 3 obligatorios, plantillas
│           ├── historial.js    # Filtros multicriterio, paginación, borrado con deshacer
│           ├── ficha-equipo.js # Línea de tiempo cronológica, alerta de equipo problemático
│           ├── inventario.js   # Gestión de equipos, alta masiva por rango (PC-01 a PC-30)
│           ├── recorrido.js    # Modo Recorrido salón por salón con contadores táctiles
│           ├── estadisticas.js # Selector de periodos, variaciones % con flechas (↑↓)
│           ├── informes.js     # Redacción automática en lenguaje natural, PDF y PPTX
│           ├── respaldo.js     # Descarga/carga JSON con respaldo previo automático
│           └── configuracion.js# CRUD de catálogos, datos del técnico y switch de prueba
```

### Principios de Diseño del Código:
1. **Sin módulos ES (`import`/`export`):** Para evitar bloqueos CORS por políticas de seguridad del navegador al abrirse directamente mediante `file://`, se utiliza scripts clásicos estructurados bajo el espacio de nombres global `window.Delfos`.
2. **Capa de Repositorio Desacoplada (`Delfos.DB`):** Toda la aplicación se comunica exclusivamente a través de la capa `DB.listar`, `DB.obtener`, `DB.guardar`, `DB.eliminar`, `DB.obtenerConfig` y `DB.guardarConfig`. Si en el futuro se desea sincronizar con una base en la nube (Supabase, Firebase, PostgreSQL), solo se actualiza `db.js` sin tocar una sola pantalla.
3. **Librerías externas fijas por CDN:**
   - **Chart.js 4.4.1:** Renderizado dinámico de gráficas en *canvas*.
   - **jsPDF 2.5.1 + jspdf-autotable 3.8.2:** Emisión de reportes oficiales en PDF con captura de gráficas de alta resolución y paginación institucional.
   - **PptxGenJS 3.12.0:** Generación de presentaciones en PowerPoint (.pptx) para reuniones de directiva.
   - **Font Awesome 6.5.1:** Iconografía moderna de línea y sólida.

---

## 📱 Módulos y Funcionalidades Detalladas

### 1. Dashboard (Inicio)
- **Banner institucional:** Saludo dinámico con el nombre del técnico destacado en dorado (`#F5B731`), fecha actual en español y botón de acción directa "Nuevo soporte".
- **5 Tarjetas de KPIs calculadas en tiempo real para el mes actual:**
  - *Soportes del mes*
  - *Mantenimientos ejecutados*
  - *Instalaciones realizadas*
  - *Equipos atendidos (distintos)*
  - *Soportes pendientes*
- **Gráficas interactivas:** Incidencias por categoría, incidencias por ubicación, soportes por día del mes y problemas más frecuentes.
- **Acciones rápidas:**
  - Lista de los últimos 5 soportes con acceso directo a su ficha.
  - Lista de pendientes con botón de **un toque** para marcar como resuelto.
  - Alerta discreta si transcurren más de 7 días sin realizar una copia de respaldo.

### 2. Registro de Soporte Ultra Rápido (< 20 segundos)
Diseñado para registrar y volver de inmediato al trabajo:
- **Atajos de teclado:** Presiona la tecla `N` desde cualquier pantalla para abrir el registro; presiona `Ctrl + Enter` para guardar al instante.
- **Solo 3 campos obligatorios:** Ubicación, Categoría y Tipo de actividad.
- **Memoria inteligente de ubicación:** Recuerda automáticamente la última ubicación utilizada.
- **Selección de equipos por número:** Escribe simplemente `18` y presiona Enter para seleccionar `PC-18`.
- **Botón "Todos los equipos de esta ubicación":** Selecciona todas las estaciones de un aula en un solo clic para mantenimientos masivos de laboratorio.
- **Selects en cascada bidireccionales:** Al elegir un tipo de problema, el sistema autocompleta su categoría correspondiente.
- **Plantillas de un toque:** Barra superior con plantillas preconfiguradas (ej: *"Mantenimiento preventivo laboratorio"*, *"Revisión rápida de proyector y audio"*, *"Restablecimiento de Internet"*).
- **Mini-modales integrados:** Botones `+ Nueva ubicación` y `+ Nuevo equipo` para agregarlos al vuelo sin perder lo que ya has escrito en el formulario.
- **Flujos de guardado ágiles:** "Guardar", "Guardar y registrar otro" y "Duplicar último soporte".

### 3. Historial Completo
- Visualización en **tabla interactiva** en computadora y **tarjetas optimizadas** en celular.
- Filtros simultáneos por: rango de fechas (desde/hasta), edificio, ubicación, equipo, categoría, problema, actividad y estado.
- Buscador libre de texto en tiempo real.
- Paginación dinámica (12 registros por página).
- Modal con el detalle completo de cada soporte y enlaces directos a las fichas técnicas de los equipos involucrados.
- **Borrado lógico con opción de Deshacer:** Si eliminas un registro por error, una notificación *toast* te permite restaurarlo en un clic durante los primeros segundos.
- **Exportación a CSV:** Genera un archivo `.csv` estructurado con codificación UTF-8 BOM para abrir con tildes y caracteres en español en Microsoft Excel.

### 4. Ficha del Equipo
Al tocar el código de cualquier equipo en cualquier sección de la app:
- Muestra marca, modelo, número de serie, ubicación actual y notas técnicas.
- **Línea de tiempo cronológica:** Historial detallado de todas las intervenciones realizadas sobre el equipo (ej: *"15/09 Cambio de mouse"*, *"21/09 Sin Internet"*, *"03/10 Cambio de HDMI"*).
- **Insignia "Equipo Problemático":** Alerta visual animada si el dispositivo acumula 4 o más incidencias en los últimos 90 días (umbral configurable).
- Botón directo para registrar un nuevo soporte a ese equipo.

### 5. Inventario y "Modo Recorrido" (Mobile-First)
- **Catálogo de Edificios precargados:** "Edificio Principal" (con referencia de Extensión), "Edificio Administrativo" y "Delfolandia".
- **Tipos de Ubicación:** Salón de clases, Laboratorio, Oficina/Departamento, Área administrativa, Otro.
- **Tipos de Equipo precargados con prefijo:** Computadora (`PC`), Laptop (`LAP`), Tablet (`TAB`), Monitor (`MON`), Proyector (`PRY`), Pantalla interactiva (`PIN`), Barra de sonido (`BAR`), Parlante (`PAR`), Impresora (`IMP`), Switch (`SW`), Router (`RT`), Access Point (`AP`), UPS (`UPS`).
- **Modo Recorrido (Salón por Salón):**
  1. Elige el edificio.
  2. Escribe el nombre del salón (ej: "Salón Zeus") o elige uno existente.
  3. Ajusta la cuadrícula de tipos de equipo con contadores grandes táctiles `−` y `+` (o ingresa el número directamente).
  4. Presiona **"Guardar y siguiente salón"**. Los códigos de inventario se autogeneran sin duplicarse (`PC-01`, `PC-02`, `PRY-01`...).
  5. Cada salón muestra su insignia "Revisado / Pendiente" y cada edificio cuenta con su barra de progreso porcentual.
- **Alta Masiva por Rango:** Genera lotes continuos de equipos para laboratorios (ej: del `PC-01` al `PC-30`).
- **Dar de baja:** Desactiva un equipo preservando intacto todo su historial técnico.

### 6. Estadísticas y Métricas Avanzadas
- Selector de periodo: **Hoy**, **Esta semana**, **Este mes**, **Este año** o **Rango personalizado**.
- Comparación automática con el periodo anterior: porcentaje de variación con flechas e indicadores cromáticos (`↑ +15%` / `↓ -8%`).
- Identificación instantánea de:
  - Categoría líder
  - Problema más frecuente
  - Ubicación con mayor demanda
  - Equipo con más fallas
- Cuatro gráficas Chart.js: Distribución de actividades, incidencias por edificio, Top 5 problemas técnicos e incidencias por categoría.

### 7. Informes Mensuales y Anuales (PDF y PowerPoint)
- **Generación en 1 Clic:** Selecciona el mes o año y presiona "Generar Informe".
- **Resumen ejecutivo redactado automáticamente en lenguaje natural:**
  > *"En el transcurso de Octubre de 2026, el área de Soporte Técnico de Unidad Educativa Delfos atendió un total de 65 requerimientos e incidencias tecnológicas, alcanzando una tasa de efectividad del 96%. La categoría con mayor índice de intervención fue Proyector..."*
- **Vista previa completa en pantalla** con estilo de documento institucional.
- **Exportar a PDF:** Documento formal con membrete institucional, logo, resumen ejecutivo, tabla de KPIs, gráfica de barras capturada en alta resolución y bitácora detallada de actividades con numeración de páginas.
- **Exportar a PowerPoint (.pptx):** Presentación ejecutiva de 5 diapositivas con la paleta Delfos:
  1. Portada con títulos institucionales en verde y dorado.
  2. Resumen ejecutivo y tarjetas de rendimiento.
  3. Gráfica de distribución de incidencias.
  4. Tabla de equipos con mayor recurrencia de fallas.
  5. Conclusiones y plan de acción técnico.
- **Historial local:** Guarda el registro de todos los informes emitidos en la base de datos.

### 8. Respaldos y Persistencia
- **Crear respaldo:** Descarga un archivo estructurado `delfos-respaldo-AAAA-MM-DD.json` con todos los datos.
- **Restaurar respaldo:** Carga un archivo `.json`, valida su integridad y despliega un resumen con la cantidad de registros.
- **Pre-respaldo de seguridad automático:** Antes de sobrescribir cualquier dato, el sistema genera y descarga automáticamente una copia del estado actual para evitar cualquier pérdida accidental.
- **Almacenamiento persistente:** Invoca la API `navigator.storage.persist()` para evitar que el navegador limpie la memoria en limpiezas de disco.
- **Recordatorio inteligente:** Banner de advertencia en el Dashboard si transcurren más de 7 días sin respaldar.

### 9. Configuración y Catálogos
- Personalización del nombre del técnico, institución educativa, carga de logo y umbral de equipo problemático.
- CRUD integral con activación/desactivación para no romper registros históricos:
  - Edificios
  - Ubicaciones y Salones
  - Categorías y Tipos de Problema vinculados
  - Tipos de Actividad (con banderas para mantenimiento e instalación)
  - Estados (colores y definición de estado resuelto)
  - Plantillas de registro rápido
- **Botón "Cargar datos de ejemplo":** Inyecta instantáneamente ~3 meses de historial y equipos realistas para evaluar todas las pantallas.
- **Botón "Borrar datos de ejemplo":** Limpia las pruebas y deja los catálogos listos para producción.

---

## ⌨️ Atajos de Teclado Globales
| Atajo | Acción |
| :--- | :--- |
| <kbd>N</kbd> | Abre inmediatamente el formulario de **Nuevo soporte** (desde cualquier pantalla). |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Guarda el soporte activo en el formulario rápido. |
| <kbd>Escape</kbd> | Cierra cualquier modal o ficha abierta en pantalla. |
| <kbd>Enter</kbd> en buscador | Ejecuta la búsqueda global y navega al historial con el filtro aplicado. |

---

## 🔒 Privacidad y Seguridad
Delfos Support opera de manera **completamente local en el navegador del usuario**. No envía datos a ningún servidor externo, no requiere cookies de rastreo ni depende de APIs de terceros con costo. Todos los registros residen en el almacenamiento seguro de **IndexedDB**.
