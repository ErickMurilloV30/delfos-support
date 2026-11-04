/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: CONFIGURACIÓN GENERAL Y ADMINISTRACIÓN DE CATÁLOGOS
 * CRUD de Edificios, Ubicaciones, Categorías, Problemas, Actividades, Estados,
 * Plantillas rápidas, datos del técnico e institución, y datos de ejemplo.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let pestanaActiva = 'general';

  const Configuracion = {
    render: async function(container) {
      const tecnico = Delfos.Estado.config.tecnico || 'Técnico de Soporte';
      const institucion = Delfos.Estado.config.institucion || 'Unidad Educativa Delfos';
      const umbral = Delfos.Estado.config.umbralProblematico || 4;
      const logoBase64 = Delfos.Estado.config.logoBase64 || '';

      container.innerHTML = `
        <div style="max-width:1050px; margin:0 auto;">
          <div class="card" style="margin-bottom:1.5rem;">
            <div class="card-header" style="flex-wrap:wrap;">
              <div>
                <h2 class="card-title"><i class="fa-solid fa-gears" style="color:var(--verde);"></i> Configuración del Sistema</h2>
                <p class="card-subtitle">Personaliza datos institucionales, catálogos y parámetros de alertas</p>
              </div>
            </div>

            <!-- Navegación por pestañas -->
            <div style="display:flex; overflow-x:auto; border-bottom:1px solid var(--borde); background:#FAFAFB; padding:0 1rem;">
              <button type="button" class="btn btn-sm ${pestanaActiva === 'general' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:0; border:none; border-bottom:${pestanaActiva === 'general' ? '3px solid var(--verde)' : 'none'};" onclick="Delfos.Vistas.Configuracion.cambiarPestana('general')">
                <i class="fa-solid fa-sliders"></i> General y Datos
              </button>
              <button type="button" class="btn btn-sm ${pestanaActiva === 'ubicaciones' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:0; border:none; border-bottom:${pestanaActiva === 'ubicaciones' ? '3px solid var(--verde)' : 'none'};" onclick="Delfos.Vistas.Configuracion.cambiarPestana('ubicaciones')">
                <i class="fa-solid fa-building"></i> Edificios y Salones
              </button>
              <button type="button" class="btn btn-sm ${pestanaActiva === 'categorias' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:0; border:none; border-bottom:${pestanaActiva === 'categorias' ? '3px solid var(--verde)' : 'none'};" onclick="Delfos.Vistas.Configuracion.cambiarPestana('categorias')">
                <i class="fa-solid fa-tags"></i> Categorías y Problemas
              </button>
              <button type="button" class="btn btn-sm ${pestanaActiva === 'actividades' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:0; border:none; border-bottom:${pestanaActiva === 'actividades' ? '3px solid var(--verde)' : 'none'};" onclick="Delfos.Vistas.Configuracion.cambiarPestana('actividades')">
                <i class="fa-solid fa-list-check"></i> Actividades y Estados
              </button>
              <button type="button" class="btn btn-sm ${pestanaActiva === 'plantillas' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:0; border:none; border-bottom:${pestanaActiva === 'plantillas' ? '3px solid var(--verde)' : 'none'};" onclick="Delfos.Vistas.Configuracion.cambiarPestana('plantillas')">
                <i class="fa-solid fa-bolt"></i> Plantillas Rápidas
              </button>
            </div>

            <!-- Contenido dinámico según pestaña activa -->
            <div class="card-body" id="config-pestana-contenido"></div>
          </div>
        </div>
      `;

      this.renderPestanaContenido();
    },

    cambiarPestana: function(pestana) {
      pestanaActiva = pestana;
      this.render(document.getElementById('vista-activa-container'));
    },

    renderPestanaContenido: function() {
      const container = document.getElementById('config-pestana-contenido');
      if (!container) return;

      if (pestanaActiva === 'general') {
        this.renderPestanaGeneral(container);
      } else if (pestanaActiva === 'ubicaciones') {
        this.renderPestanaUbicaciones(container);
      } else if (pestanaActiva === 'categorias') {
        this.renderPestanaCategorias(container);
      } else if (pestanaActiva === 'actividades') {
        this.renderPestanaActividades(container);
      } else if (pestanaActiva === 'plantillas') {
        this.renderPestanaPlantillas(container);
      }
    },

    // --- PESTAÑA 1: GENERAL ---
    renderPestanaGeneral: function(container) {
      const tecnico = Delfos.Estado.config.tecnico || 'Técnico de Soporte';
      const institucion = Delfos.Estado.config.institucion || 'Unidad Educativa Delfos';
      const umbral = Delfos.Estado.config.umbralProblematico || 4;
      const logoBase64 = Delfos.Estado.config.logoBase64 || '';

      container.innerHTML = `
        <form onsubmit="event.preventDefault(); Delfos.Vistas.Configuracion.guardarDatosGenerales();">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto); margin-bottom:1.25rem;">
            Datos del Técnico e Institución
          </h3>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Nombre del Técnico de Soporte</label>
              <input type="text" id="cfg-tecnico" class="form-control" value="${Delfos.Utils.escapeHTML(tecnico)}" required>
              <span class="form-hint">Aparece en el banner, reportes y registros automáticos.</span>
            </div>

            <div class="form-group">
              <label class="form-label">Nombre de la Institución Educativa</label>
              <input type="text" id="cfg-institucion" class="form-control" value="${Delfos.Utils.escapeHTML(institucion)}" required>
              <span class="form-hint">Aparece en el encabezado de los informes en PDF y PPTX.</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Umbral de "Equipo Problemático"</label>
              <input type="number" id="cfg-umbral" class="form-control" value="${umbral}" min="1" max="20" required>
              <span class="form-hint">Número de incidencias en 90 días para activar la insignia de advertencia (por defecto 4).</span>
            </div>

            <div class="form-group">
              <label class="form-label">Logo Institucional (opcional para informes)</label>
              <div style="display:flex; align-items:center; gap:1rem;">
                <input type="file" id="cfg-logo" accept="image/*" class="form-control" onchange="Delfos.Vistas.Configuracion.alCargarLogo(event)">
                ${logoBase64 ? `
                  <button type="button" class="btn btn-sm btn-danger" onclick="Delfos.Vistas.Configuracion.quitarLogo()" title="Eliminar logo">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                ` : ''}
              </div>
              <div id="cfg-logo-preview" style="margin-top:0.5rem;">
                ${logoBase64 ? `<img src="${logoBase64}" style="max-height:48px; border-radius:6px; border:1px solid var(--borde); padding:2px;" alt="Logo">` : ''}
              </div>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--borde);">
            <button type="submit" class="btn btn-primary">
              <i class="fa-solid fa-floppy-disk"></i> Guardar Parámetros Generales
            </button>
          </div>
        </form>

        <!-- Sección de Datos de Ejemplo -->
        <div style="margin-top:3rem; padding-top:2rem; border-top:2px dashed var(--borde);">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
            <div>
              <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Datos de Demostración</h3>
              <p style="font-size:0.85rem; color:var(--texto-suave); margin-top:0.25rem;">
                Genera ~3 meses de historial y equipos realistas para evaluar todas las pantallas, o límpialos para iniciar tu registro real.
              </p>
            </div>
            <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
              <button type="button" class="btn btn-secondary" onclick="Delfos.Vistas.Configuracion.cargarDatosEjemplo()">
                <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--verde);"></i> Cargar datos de ejemplo
              </button>
              <button type="button" class="btn btn-danger" onclick="Delfos.Vistas.Configuracion.borrarDatosEjemplo()">
                <i class="fa-solid fa-trash-can"></i> Borrar datos de ejemplo
              </button>
            </div>
          </div>
        </div>
      `;
    },

    alCargarLogo: async function(event) {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const base64 = await Delfos.Utils.leerArchivoBase64(file);
        await Delfos.DB.guardarConfig('logoBase64', base64);
        Delfos.Estado.config.logoBase64 = base64;
        const preview = document.getElementById('cfg-logo-preview');
        if (preview) {
          preview.innerHTML = `<img src="${base64}" style="max-height:48px; border-radius:6px; border:1px solid var(--borde); padding:2px;" alt="Logo">`;
        }
        Delfos.Utils.showToast('Logo institucional cargado', 'success');
      } catch (e) {
        Delfos.Utils.showToast('Error al leer imagen de logo', 'error');
      }
    },

    quitarLogo: async function() {
      await Delfos.DB.guardarConfig('logoBase64', '');
      Delfos.Estado.config.logoBase64 = '';
      this.renderPestanaContenido();
      Delfos.Utils.showToast('Logo removido', 'info');
    },

    guardarDatosGenerales: async function() {
      const tecnico = document.getElementById('cfg-tecnico').value.trim();
      const institucion = document.getElementById('cfg-institucion').value.trim();
      const umbral = parseInt(document.getElementById('cfg-umbral').value, 10);

      await Delfos.DB.guardarConfig('tecnico', tecnico);
      await Delfos.DB.guardarConfig('institucion', institucion);
      await Delfos.DB.guardarConfig('umbralProblematico', umbral);

      await Delfos.Estado.recargarCatalogos();

      // Actualizar nombre en topbar
      const chipTecnico = document.querySelector('.chip-tech-name');
      if (chipTecnico) chipTecnico.textContent = tecnico;

      Delfos.Utils.showToast('Configuración general guardada', 'success');
    },

    cargarDatosEjemplo: async function() {
      if (confirm('¿Deseas cargar ~3 meses de soportes y equipos de ejemplo realistas?')) {
        await Delfos.Seed.cargarDatosEjemplo();
        await Delfos.Estado.recargarCatalogos();
        Delfos.Utils.showToast('¡Datos de ejemplo cargados con éxito!', 'success');
        Delfos.Estado.cambiarVista('dashboard');
      }
    },

    borrarDatosEjemplo: async function() {
      if (confirm('¿Eliminar todos los soportes y equipos de prueba generados?')) {
        await Delfos.Seed.borrarDatosEjemplo();
        await Delfos.Estado.recargarCatalogos();
        Delfos.Utils.showToast('Datos de ejemplo eliminados', 'info');
        Delfos.Estado.cambiarVista('dashboard');
      }
    },

    // --- PESTAÑA 2: EDIFICIOS Y SALONES ---
    renderPestanaUbicaciones: function(container) {
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Edificios e Instalaciones</h3>
          <button type="button" class="btn btn-sm btn-primary" onclick="Delfos.Vistas.Configuracion.abrirModalEdificio()">
            <i class="fa-solid fa-plus"></i> Nuevo Edificio
          </button>
        </div>

        <div class="data-table-container" style="margin-bottom:2.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre del Edificio</th>
                <th>Referencia</th>
                <th>Aulas Registradas</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${Delfos.Estado.edificios.map(ed => {
                const totalAulas = Delfos.Estado.ubicaciones.filter(u => u.edificioId === ed.id).length;
                return `
                  <tr>
                    <td><strong>${Delfos.Utils.escapeHTML(ed.nombre)}</strong></td>
                    <td>${Delfos.Utils.escapeHTML(ed.referencia || '-')}</td>
                    <td>${totalAulas} ubicaciones</td>
                    <td><span class="badge ${ed.activo !== false ? 'badge-resuelto' : 'badge-neutral'}">${ed.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Configuracion.toggleEstado('edificios', '${ed.id}')" title="Activar/Desactivar">
                        <i class="fa-solid fa-power-off"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Ubicaciones y Salones (${Delfos.Estado.ubicaciones.length})</h3>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Salón / Área</th>
                <th>Edificio</th>
                <th>Tipo</th>
                <th>Referencia</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${Delfos.Estado.ubicaciones.map(u => {
                const ed = Delfos.Estado.getEdificio(u.edificioId);
                const tu = Delfos.Estado.getTipoUbicacion(u.tipoId);
                return `
                  <tr>
                    <td><strong>${Delfos.Utils.escapeHTML(u.nombre)}</strong></td>
                    <td>${Delfos.Utils.escapeHTML(ed ? ed.nombre : '-')}</td>
                    <td>${Delfos.Utils.escapeHTML(tu ? tu.nombre : '-')}</td>
                    <td>${Delfos.Utils.escapeHTML(u.referencia || '-')}</td>
                    <td><span class="badge ${u.activo !== false ? 'badge-resuelto' : 'badge-neutral'}">${u.activo !== false ? 'Activa' : 'Inactiva'}</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Configuracion.toggleEstado('ubicaciones', '${u.id}')" title="Activar/Desactivar">
                        <i class="fa-solid fa-power-off"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    abrirModalEdificio: function() {
      const nombre = prompt('Ingresa el nombre del nuevo edificio (ej: Edificio de Laboratorios):');
      if (!nombre) return;
      const ref = prompt('Referencia opcional (ej: Frente al patio central):') || '';
      Delfos.DB.guardar('edificios', { nombre, referencia: ref, activo: true }).then(() => {
        Delfos.Estado.recargarCatalogos().then(() => {
          Delfos.Utils.showToast(`Edificio "${nombre}" creado`, 'success');
          this.renderPestanaContenido();
        });
      });
    },

    // --- PESTAÑA 3: CATEGORÍAS Y PROBLEMAS ---
    renderPestanaCategorias: function(container) {
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Categorías de Incidencias (${Delfos.Estado.categorias.length})</h3>
          <button type="button" class="btn btn-sm btn-primary" onclick="Delfos.Vistas.Configuracion.crearCategoria()">
            <i class="fa-solid fa-plus"></i> Nueva Categoría
          </button>
        </div>

        <div class="data-table-container" style="margin-bottom:2.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Problemas Asociados</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${Delfos.Estado.categorias.map(c => {
                const problemas = Delfos.Estado.tiposProblema.filter(p => p.categoriaId === c.id);
                return `
                  <tr>
                    <td><strong>${Delfos.Utils.escapeHTML(c.nombre)}</strong></td>
                    <td>${problemas.length} problemas</td>
                    <td><span class="badge ${c.activo !== false ? 'badge-resuelto' : 'badge-neutral'}">${c.activo !== false ? 'Activa' : 'Inactiva'}</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-sm btn-secondary" style="height:32px; min-height:32px; font-size:0.78rem;" onclick="Delfos.Vistas.Configuracion.crearProblemaEn('${c.id}')">
                        <i class="fa-solid fa-plus"></i> Añadir Problema
                      </button>
                      <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Configuracion.toggleEstado('categorias', '${c.id}')" title="Activar/Desactivar">
                        <i class="fa-solid fa-power-off"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    crearCategoria: function() {
      const nom = prompt('Nombre de la nueva categoría (ej: Telefonía IP):');
      if (!nom) return;
      Delfos.DB.guardar('categorias', { nombre: nom, activo: true }).then(() => {
        Delfos.Estado.recargarCatalogos().then(() => {
          Delfos.Utils.showToast(`Categoría "${nom}" agregada`, 'success');
          this.renderPestanaContenido();
        });
      });
    },

    crearProblemaEn: function(catId) {
      const nom = prompt('Nombre del problema técnico:');
      if (!nom) return;
      Delfos.DB.guardar('tiposProblema', { categoriaId: catId, nombre: nom, activo: true }).then(() => {
        Delfos.Estado.recargarCatalogos().then(() => {
          Delfos.Utils.showToast(`Problema "${nom}" vinculado a la categoría`, 'success');
          this.renderPestanaContenido();
        });
      });
    },

    // --- PESTAÑA 4: ACTIVIDADES Y ESTADOS ---
    renderPestanaActividades: function(container) {
      container.innerHTML = `
        <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto); margin-bottom:1.25rem;">Tipos de Actividad</h3>
        <div class="data-table-container" style="margin-bottom:2.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>¿Cuenta como Mantenimiento?</th>
                <th>¿Cuenta como Instalación?</th>
                <th>Estado</th>
                <th style="text-align:right;">Acción</th>
              </tr>
            </thead>
            <tbody>
              ${Delfos.Estado.tiposActividad.map(a => `
                <tr>
                  <td><strong>${Delfos.Utils.escapeHTML(a.nombre)}</strong></td>
                  <td>${a.esMantenimiento ? '<span class="badge badge-resuelto">Sí</span>' : '<span style="color:var(--texto-suave);">No</span>'}</td>
                  <td>${a.esInstalacion ? '<span class="badge badge-proceso">Sí</span>' : '<span style="color:var(--texto-suave);">No</span>'}</td>
                  <td><span class="badge ${a.activo !== false ? 'badge-resuelto' : 'badge-neutral'}">${a.activo !== false ? 'Activo' : 'Inactivo'}</span></td>
                  <td style="text-align:right;">
                    <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Configuracion.toggleEstado('tiposActividad', '${a.id}')">
                      <i class="fa-solid fa-power-off"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto); margin-bottom:1.25rem;">Estados de Soporte</h3>
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Color</th>
                <th>¿Es Final (Resuelto)?</th>
                <th>¿Por Defecto?</th>
              </tr>
            </thead>
            <tbody>
              ${Delfos.Estado.estados.map(e => `
                <tr>
                  <td><strong>${Delfos.Utils.escapeHTML(e.nombre)}</strong></td>
                  <td><span style="display:inline-block; width:14px; height:14px; border-radius:50%; background:${e.color}; vertical-align:middle; margin-right:4px;"></span> ${e.color}</td>
                  <td>${e.esFinal ? '<span class="badge badge-resuelto">Sí</span>' : '<span class="badge badge-pendiente">No (Abierto)</span>'}</td>
                  <td>${e.porDefecto ? '<span class="badge badge-resuelto">Por defecto</span>' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    // --- PESTAÑA 5: PLANTILLAS RÁPIDAS ---
    renderPestanaPlantillas: function(container) {
      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.25rem;">
          <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Plantillas de Registro Rápido</h3>
          <button type="button" class="btn btn-sm btn-primary" onclick="Delfos.Vistas.Configuracion.crearPlantilla()">
            <i class="fa-solid fa-plus"></i> Nueva Plantilla
          </button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre de la Plantilla</th>
                <th>Categoría</th>
                <th>Actividad</th>
                <th>Solución Predefinida</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${Delfos.Estado.plantillas.map(p => {
                const cat = Delfos.Estado.getCategoria(p.categoriaId);
                const act = Delfos.Estado.getTipoActividad(p.tipoActividadId);
                return `
                  <tr>
                    <td><strong>${Delfos.Utils.escapeHTML(p.nombre)}</strong></td>
                    <td>${Delfos.Utils.escapeHTML(cat ? cat.nombre : '-')}</td>
                    <td>${Delfos.Utils.escapeHTML(act ? act.nombre : '-')}</td>
                    <td><span style="font-size:0.8rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(p.solucion || '-')}</span></td>
                    <td style="text-align:right;">
                      <button class="btn btn-sm btn-icon btn-danger" onclick="Delfos.Vistas.Configuracion.eliminarPlantilla('${p.id}')">
                        <i class="fa-regular fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    },

    crearPlantilla: function() {
      const nom = prompt('Nombre de la plantilla rápida (ej: Mantenimiento Preventivo Switch):');
      if (!nom) return;
      const sol = prompt('Solución predefinida para este soporte:') || '';
      Delfos.DB.guardar('plantillas', {
        nombre: nom,
        tipoActividadId: 'act_preventivo',
        estadoId: 'est_resuelto',
        solucion: sol,
        activo: true
      }).then(() => {
        Delfos.Estado.recargarCatalogos().then(() => {
          Delfos.Utils.showToast(`Plantilla "${nom}" creada`, 'success');
          this.renderPestanaContenido();
        });
      });
    },

    eliminarPlantilla: async function(id) {
      if (confirm('¿Eliminar esta plantilla?')) {
        await Delfos.DB.eliminar('plantillas', id);
        await Delfos.Estado.recargarCatalogos();
        Delfos.Utils.showToast('Plantilla eliminada', 'info');
        this.renderPestanaContenido();
      }
    },

    toggleEstado: async function(coleccion, id) {
      const item = await Delfos.DB.obtener(coleccion, id);
      if (!item) return;

      item.activo = !(item.activo !== false);
      await Delfos.DB.guardar(coleccion, item);
      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast(`Elemento ${item.activo ? 'activado' : 'desactivado'}`, 'info');
      this.renderPestanaContenido();
    }
  };

  Delfos.Vistas.Configuracion = Configuracion;
})(window.Delfos);
