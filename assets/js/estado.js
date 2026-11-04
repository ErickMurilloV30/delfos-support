/**
 * ==========================================================================
 * DELFOS SUPPORT - GESTOR DE ESTADO GLOBAL Y CACHÉ EN MEMORIA
 * Mantiene en caché catálogos, navegación entre vistas y funciones de búsqueda
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  const Estado = {
    vistaActual: 'dashboard',
    listeners: {},

    // Caché de catálogos
    edificios: [],
    tiposUbicacion: [],
    ubicaciones: [],
    tiposEquipo: [],
    equipos: [],
    categorias: [],
    tiposProblema: [],
    tiposActividad: [],
    estados: [],
    plantillas: [],
    config: {},

    /**
     * Suscripción a eventos simples
     */
    on: function(evento, callback) {
      if (!this.listeners[evento]) this.listeners[evento] = [];
      this.listeners[evento].push(callback);
    },

    emit: function(evento, datos) {
      if (this.listeners[evento]) {
        this.listeners[evento].forEach(fn => fn(datos));
      }
    },

    /**
     * Recarga todos los catálogos desde IndexedDB a la memoria
     */
    recargarCatalogos: async function() {
      const [
        edificios,
        tiposUbicacion,
        ubicaciones,
        tiposEquipo,
        equipos,
        categorias,
        tiposProblema,
        tiposActividad,
        estados,
        plantillas,
        configItems
      ] = await Promise.all([
        Delfos.DB.listar('edificios'),
        Delfos.DB.listar('tiposUbicacion'),
        Delfos.DB.listar('ubicaciones'),
        Delfos.DB.listar('tiposEquipo'),
        Delfos.DB.listar('equipos'),
        Delfos.DB.listar('categorias'),
        Delfos.DB.listar('tiposProblema'),
        Delfos.DB.listar('tiposActividad'),
        Delfos.DB.listar('estados'),
        Delfos.DB.listar('plantillas'),
        Delfos.DB.listar('configuracion')
      ]);

      this.edificios = edificios;
      this.tiposUbicacion = tiposUbicacion;
      this.ubicaciones = ubicaciones;
      this.tiposEquipo = tiposEquipo;
      this.equipos = equipos;
      this.categorias = categorias;
      this.tiposProblema = tiposProblema;
      this.tiposActividad = tiposActividad;
      this.estados = estados;
      this.plantillas = plantillas;

      this.config = {};
      configItems.forEach(item => {
        this.config[item.clave] = item.valor;
      });

      this.emit('catalogosActualizados');
    },

    // --- Helpers de consulta rápida en memoria ---
    getEdificio: function(id) {
      return this.edificios.find(e => e.id === id) || null;
    },

    getTipoUbicacion: function(id) {
      return this.tiposUbicacion.find(t => t.id === id) || null;
    },

    getUbicacion: function(id) {
      return this.ubicaciones.find(u => u.id === id) || null;
    },

    getTipoEquipo: function(id) {
      return this.tiposEquipo.find(t => t.id === id) || null;
    },

    getEquipo: function(id) {
      return this.equipos.find(e => e.id === id) || null;
    },

    getCategoria: function(id) {
      return this.categorias.find(c => c.id === id) || null;
    },

    getProblema: function(id) {
      return this.tiposProblema.find(p => p.id === id) || null;
    },

    getTipoActividad: function(id) {
      return this.tiposActividad.find(a => a.id === id) || null;
    },

    getEstado: function(id) {
      return this.estados.find(e => e.id === id) || null;
    },

    getEquiposPorUbicacion: function(ubicacionId) {
      if (!ubicacionId) return [];
      return this.equipos.filter(e => e.ubicacionId === ubicacionId && e.activo !== false);
    },

    getProblemasPorCategoria: function(categoriaId) {
      if (!categoriaId) return [];
      return this.tiposProblema.filter(p => p.categoriaId === categoriaId && p.activo !== false);
    },

    getUbicacionTextoCompleto: function(ubicacionId) {
      const ub = this.getUbicacion(ubicacionId);
      if (!ub) return 'Ubicación no especificada';
      const edif = this.getEdificio(ub.edificioId);
      const tipo = this.getTipoUbicacion(ub.tipoId);
      const edifNom = edif ? edif.nombre : '';
      const tipoNom = tipo ? tipo.nombre : '';
      return `${ub.nombre} (${edifNom} · ${tipoNom})`;
    },

    /**
     * Cambia de vista en la SPA y gestiona la activación visual de menú
     */
    cambiarVista: function(nombreVista, params = {}) {
      this.vistaActual = nombreVista;

      // 1. Actualizar ítems activos en menú lateral y barra móvil
      document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.vista === nombreVista);
      });
      document.querySelectorAll('.mobile-nav-btn').forEach(el => {
        el.classList.toggle('active', el.dataset.vista === nombreVista);
      });

      // 2. Cerrar sidebar en móviles si estaba abierto
      const sidebar = document.querySelector('.sidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
      if (backdrop && backdrop.classList.contains('active')) {
        backdrop.classList.remove('active');
      }

      // 3. Renderizar la vista correspondiente
      const contenedor = document.getElementById('vista-activa-container');
      if (!contenedor) return;

      window.scrollTo({ top: 0, behavior: 'smooth' });

      switch (nombreVista) {
        case 'dashboard':
          Delfos.Vistas.Dashboard.render(contenedor, params);
          break;
        case 'nuevo-soporte':
          Delfos.Vistas.NuevoSoporte.render(contenedor, params);
          break;
        case 'historial':
          Delfos.Vistas.Historial.render(contenedor, params);
          break;
        case 'estadisticas':
          Delfos.Vistas.Estadisticas.render(contenedor, params);
          break;
        case 'inventario':
          Delfos.Vistas.Inventario.render(contenedor, params);
          break;
        case 'recorrido':
          Delfos.Vistas.Recorrido.render(contenedor, params);
          break;
        case 'informes':
          Delfos.Vistas.Informes.render(contenedor, params);
          break;
        case 'respaldos':
          Delfos.Vistas.Respaldo.render(contenedor, params);
          break;
        case 'configuracion':
          Delfos.Vistas.Configuracion.render(contenedor, params);
          break;
        default:
          Delfos.Vistas.Dashboard.render(contenedor, params);
          break;
      }

      this.emit('cambioVista', { vista: nombreVista, params });
    }
  };

  Delfos.Estado = Estado;
  Delfos.Vistas = Delfos.Vistas || {};
})(window.Delfos);
