/**
 * ==========================================================================
 * DELFOS SUPPORT - APLICACIÓN PRINCIPAL (ORQUESTADOR Y BOOTSTRAP CON FIREBASE)
 * ==========================================================================
 * Control de ciclo de vida:
 * 1. Inicializa IndexedDB local de soporte.
 * 2. Verifica autenticación en Firebase Nube (Auth + Cloud Firestore).
 * 3. Si no hay sesión: muestra Pantalla de Login institucional, sin exponer datos.
 * 4. Si hay sesión: activa listeners en tiempo real, carga catálogos e inicia la App.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  let sistemaIniciado = false;

  const App = {
    /**
     * Punto de entrada principal
     */
    init: async function() {
      try {
        console.log('Iniciando Delfos Support v2.0 (Cloud)...');

        // 1. Inicializar repositorio IndexedDB base
        await Delfos.DB.init();

        // 2. Escuchar cambios de estado de autenticación de Firebase
        if (window.Delfos.nube) {
          this.configurarControlAcceso();
        } else {
          window.addEventListener('delfos-firebase-ready', () => {
            this.configurarControlAcceso();
          }, { once: true });
        }

        // Si después de 1 segundo Firebase no ha respondido (ej. sin internet en arranque)
        setTimeout(() => {
          if (!sistemaIniciado && (!Delfos.nube || !Delfos.nube.currentUser)) {
            this.evaluarEstadoSesion();
          }
        }, 800);

      } catch (err) {
        console.error('Error fatal al iniciar Delfos Support:', err);
      }
    },

    /**
     * Evalúa si mostrar la pantalla de Login o el Shell principal
     */
    configurarControlAcceso: function() {
      const nube = Delfos.nube;

      if (!nube || !nube.isConfigured) {
        // Firebase no configurado aún con credenciales reales
        this.mostrarPantallaLogin();
        return;
      }

      // Escuchar cambios de autenticación
      nube.onAuthChange((user) => {
        if (user) {
          this.iniciarSistemaConSesion(user);
        } else {
          this.mostrarPantallaLogin();
        }
      });
    },

    evaluarEstadoSesion: function() {
      if (Delfos.nube && Delfos.nube.currentUser) {
        this.iniciarSistemaConSesion(Delfos.nube.currentUser);
      } else {
        this.mostrarPantallaLogin();
      }
    },

    /**
     * Muestra la pantalla de inicio de sesión y oculta la aplicación
     */
    mostrarPantallaLogin: function() {
      const appShell = document.querySelector('.app-shell');
      const loginContainer = document.getElementById('login-view-container');

      if (appShell) appShell.style.display = 'none';
      if (loginContainer) {
        loginContainer.style.display = 'block';
        if (Delfos.Vistas && Delfos.Vistas.Login) {
          Delfos.Vistas.Login.render(loginContainer);
        }
      }

      // Detener listeners de datos para no exponer nada
      Delfos.DB.detenerListenersNube();
      sistemaIniciado = false;
    },

    /**
     * Inicia el sistema con la sesión del técnico autenticado
     */
    iniciarSistemaConSesion: async function(user) {
      const appShell = document.querySelector('.app-shell');
      const loginContainer = document.getElementById('login-view-container');

      if (loginContainer) loginContainer.style.display = 'none';
      if (appShell) appShell.style.display = 'flex';

      // Actualizar nombre o correo del técnico en el encabezado
      this.actualizarIdentidadTopbar(user);

      // Iniciar listeners en tiempo real de Firestore
      Delfos.DB.iniciarListenersNube();

      // Sembrar catálogos por defecto si la cuenta está completamente vacía
      await Delfos.Seed.inicializarBaseSiVacia();

      // Cargar catálogos en memoria
      await Delfos.Estado.recargarCatalogos();

      if (!sistemaIniciado) {
        this.iniciarRelojTopbar();
        this.configurarBuscadorGlobal();
        this.configurarAtajosTeclado();
        this.configurarEventosUI();
        sistemaIniciado = true;
      }

      // Cargar vista inicial según hash o 'dashboard'
      const hash = window.location.hash.replace('#', '');
      const vistasPermitidas = ['dashboard', 'nuevo-soporte', 'historial', 'estadisticas', 'inventario', 'recorrido', 'informes', 'respaldos', 'configuracion'];
      const vistaInicial = vistasPermitidas.includes(hash) ? hash : 'dashboard';

      Delfos.Estado.cambiarVista(vistaInicial);

      // Actualizar indicador de estado en la interfaz
      if (Delfos.nube) {
        Delfos.nube.actualizarIndicador('sincronizado');
      }

      console.log('Delfos Support: Sesión técnica iniciada correctamente para:', user.email);
    },

    /**
     * Reloj en vivo en la barra superior
     */
    iniciarRelojTopbar: function() {
      const elHora = document.querySelector('.chip-clock-time');
      const actualizar = () => {
        if (elHora) elHora.textContent = Delfos.Utils.horaActual24();
      };
      actualizar();
      setInterval(actualizar, 10000);
    },

    /**
     * Muestra la identidad del técnico en topbar y sidebar
     */
    actualizarIdentidadTopbar: function(user) {
      const elNombre = document.querySelector('.chip-tech-name');
      const elSidebarUser = document.getElementById('sidebar-user-badge');
      const nombreMostrar = (Delfos.Estado.config && Delfos.Estado.config.tecnico) 
        ? Delfos.Estado.config.tecnico 
        : (user ? user.email.split('@')[0] : 'Técnico TI');

      if (elNombre) elNombre.textContent = nombreMostrar;
      if (elSidebarUser && user) {
        elSidebarUser.textContent = user.email;
        elSidebarUser.title = `Conectado como ${user.email}`;
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
                if (Delfos.Vistas.Historial && Delfos.Vistas.Historial.aplicarFiltros) {
                  Delfos.Vistas.Historial.aplicarFiltros();
                }
              }
            }, 100);
          }
        }
      });
    },

    /**
     * Atajos de teclado:
     * - Tecla 'N': abre formulario "Nuevo soporte"
     * - 'Ctrl + Enter': guarda soporte
     * - 'Escape': cierra modales
     */
    configurarAtajosTeclado: function() {
      window.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toLowerCase();
        const esCampoTexto = tag === 'input' || tag === 'textarea' || tag === 'select';

        if ((e.key === 'n' || e.key === 'N') && !esCampoTexto && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          Delfos.Estado.cambiarVista('nuevo-soporte');
        }

        if (e.ctrlKey && e.key === 'Enter') {
          if (Delfos.Estado.vistaActual === 'nuevo-soporte') {
            const btnGuardar = document.getElementById('btn-guardar-soporte');
            if (btnGuardar) btnGuardar.click();
          }
        }

        if (e.key === 'Escape') {
          const modales = document.querySelectorAll('.modal-overlay.active');
          modales.forEach(m => m.classList.remove('active'));
        }
      });
    },

    /**
     * Eventos de navegación y UI
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

      // Navegación por hash
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
