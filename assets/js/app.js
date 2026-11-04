/**
 * ==========================================================================
 * DELFOS SUPPORT - APLICACIÓN PRINCIPAL (ORQUESTADOR Y BOOTSTRAP)
 * Inicialización de base de datos, carga de catálogos en caché, reloj en vivo,
 * atajos de teclado globales (N, Ctrl+Enter, Esc), buscador y enrutamiento SPA.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  const App = {
    init: async function() {
      try {
        console.log('Iniciando Delfos Support...');

        // 1. Inicializar base de datos IndexedDB
        await Delfos.DB.init();

        // 2. Cargar catálogos y esquema base si es primera ejecución
        await Delfos.Seed.inicializarBaseSiVacia();

        // 3. Cargar todos los catálogos en memoria
        await Delfos.Estado.recargarCatalogos();

        // 4. Inicializar componentes de la interfaz global
        this.iniciarRelojTopbar();
        this.actualizarIdentidadTopbar();
        this.configurarBuscadorGlobal();
        this.configurarAtajosTeclado();
        this.configurarEventosUI();

        // 5. Cargar vista inicial según hash o por defecto 'dashboard'
        const hash = window.location.hash.replace('#', '');
        const vistaInicial = ['dashboard', 'nuevo-soporte', 'historial', 'estadisticas', 'inventario', 'recorrido', 'informes', 'respaldos', 'configuracion'].includes(hash)
          ? hash
          : 'dashboard';

        Delfos.Estado.cambiarVista(vistaInicial);

        console.log('Delfos Support: Sistema listo para operar.');
      } catch (err) {
        console.error('Error fatal al iniciar Delfos Support:', err);
        const container = document.getElementById('vista-activa-container');
        if (container) {
          container.innerHTML = `
            <div style="padding:3rem; text-align:center;">
              <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:var(--estado-error); margin-bottom:1rem;"></i>
              <h2 style="font-weight:800; color:var(--texto);">Error al iniciar la base de datos local</h2>
              <p style="color:var(--texto-suave); margin-top:0.5rem; max-width:500px; margin-left:auto; margin-right:auto;">
                ${err.message || 'IndexedDB no pudo ser inicializado. Verifica que tu navegador permita almacenamiento local.'}
              </p>
            </div>
          `;
        }
      }
    },

    /**
     * Reloj en vivo en la barra superior con hora y fecha
     */
    iniciarRelojTopbar: function() {
      const elHora = document.querySelector('.chip-clock-time');
      const actualizar = () => {
        if (elHora) {
          elHora.textContent = Delfos.Utils.horaActual24();
        }
      };
      actualizar();
      setInterval(actualizar, 10000);
    },

    /**
     * Muestra el nombre del técnico configurado en el chip superior
     */
    actualizarIdentidadTopbar: function() {
      const elNombre = document.querySelector('.chip-tech-name');
      if (elNombre) {
        elNombre.textContent = Delfos.Estado.config.tecnico || 'Técnico de Soporte';
      }
    },

    /**
     * Buscador Global en el Topbar: al presionar Enter busca en Historial
     */
    configurarBuscadorGlobal: function() {
      const searchInput = document.getElementById('global-search-input');
      if (!searchInput) return;

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = searchInput.value.trim();
          if (query) {
            Delfos.Estado.cambiarVista('historial');
            setTimeout(() => {
              const filtroTexto = document.getElementById('filtro-texto');
              if (filtroTexto) {
                filtroTexto.value = query;
                Delfos.Vistas.Historial.aplicarFiltros();
              }
            }, 100);
          }
        }
      });
    },

    /**
     * Atajos de teclado:
     * - Tecla 'N': abre formulario "Nuevo soporte" (si no se está escribiendo en un input)
     * - 'Ctrl + Enter': guarda el formulario de soporte activo
     * - 'Escape': cierra modales abiertos
     */
    configurarAtajosTeclado: function() {
      window.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const esCampoTexto = tag === 'input' || tag === 'textarea' || tag === 'select';

        // Atajo 'N' para Nuevo soporte
        if ((e.key === 'n' || e.key === 'N') && !esCampoTexto && !e.ctrlKey && !e.altKey && !e.metaKey) {
          e.preventDefault();
          Delfos.Estado.cambiarVista('nuevo-soporte');
          return;
        }

        // Atajo 'Ctrl + Enter' para Guardar
        if (e.ctrlKey && e.key === 'Enter') {
          if (Delfos.Estado.vistaActual === 'nuevo-soporte') {
            e.preventDefault();
            Delfos.Vistas.NuevoSoporte.guardar(false);
          }
          return;
        }

        // Atajo 'Escape' para cerrar modales
        if (e.key === 'Escape') {
          const modalesAbiertos = document.querySelectorAll('.modal-overlay.open');
          modalesAbiertos.forEach(m => m.classList.remove('open'));
          document.body.style.overflow = '';
        }
      });
    },

    /**
     * Eventos de navegación UI (Sidebar, Drawer Móvil, FAB)
     */
    configurarEventosUI: function() {
      // Menú lateral desktop y móvil
      document.querySelectorAll('[data-nav-vista]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          const vista = el.dataset.navVista;
          if (vista) {
            window.location.hash = vista;
            Delfos.Estado.cambiarVista(vista);
          }
        });
      });

      // Toggle menú en móviles
      const btnMenu = document.getElementById('btn-toggle-menu');
      const btnCerrarSidebar = document.getElementById('btn-close-sidebar');
      const sidebar = document.querySelector('.sidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');

      const toggleMenu = () => {
        if (sidebar && backdrop) {
          sidebar.classList.toggle('open');
          backdrop.classList.toggle('active');
        }
      };

      if (btnMenu) btnMenu.addEventListener('click', toggleMenu);
      if (btnCerrarSidebar) btnCerrarSidebar.addEventListener('click', toggleMenu);
      if (backdrop) backdrop.addEventListener('click', toggleMenu);

      // Botón flotante FAB
      const fabNuevo = document.getElementById('fab-nuevo-soporte');
      if (fabNuevo) {
        fabNuevo.addEventListener('click', () => {
          Delfos.Estado.cambiarVista('nuevo-soporte');
        });
      }

      // Escuchar cambios de hash para navegación con historial del navegador
      window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '');
        if (h && h !== Delfos.Estado.vistaActual) {
          Delfos.Estado.cambiarVista(h);
        }
      });
    }
  };

  Delfos.App = App;

  // Iniciar automáticamente cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})(window.Delfos);
