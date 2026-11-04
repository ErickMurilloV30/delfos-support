/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: REGISTRO DE SOPORTE (< 20 SEGUNDOS)
 * Velocidad extrema, 3 campos obligatorios, selección de equipos por número,
 * selects en cascada bidireccionales, plantillas de un toque y mini-modales.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let equiposSeleccionadosIds = [];
  let ultimoSoporteGuardado = null;
  let editandoSoporteId = null;

  const NuevoSoporte = {
    render: async function(container, params = {}) {
      editandoSoporteId = params.editarId || null;
      let soporteBase = null;

      if (editandoSoporteId) {
        soporteBase = await Delfos.DB.obtener('soportes', editandoSoporteId);
      } else if (params.duplicarId) {
        soporteBase = await Delfos.DB.obtener('soportes', params.duplicarId);
      }

      // Recordar última ubicación usada o la del soporte a duplicar
      const ultimaUbicacionGuardada = await Delfos.DB.obtenerConfig('ultimaUbicacionId', '');
      const ubicacionInicialId = soporteBase ? soporteBase.ubicacionId : ultimaUbicacionGuardada;

      // Equipos iniciales
      equiposSeleccionadosIds = (soporteBase && Array.isArray(soporteBase.equipoIds)) ? [...soporteBase.equipoIds] : [];

      const fechaHoy = soporteBase ? soporteBase.fecha : Delfos.Utils.fechaHoyISO();
      const horaActual = soporteBase ? soporteBase.hora : Delfos.Utils.horaActual24();
      const tecnicoActual = Delfos.Estado.config.tecnico || 'Técnico de Soporte';

      // Plantillas rápidas configuradas
      const plantillas = Delfos.Estado.plantillas.filter(p => p.activo !== false);

      container.innerHTML = `
        <div class="fast-support-container">
          <!-- Barra de Plantillas Rápidas de 1 toque -->
          ${plantillas.length > 0 ? `
            <div style="margin-bottom:0.75rem;">
              <span style="font-size:0.78rem; font-weight:700; color:var(--texto-suave); text-transform:uppercase; letter-spacing:0.5px;">
                <i class="fa-solid fa-bolt" style="color:var(--dorado);"></i> Plantillas rápidas:
              </span>
              <div class="quick-templates-bar" style="margin-top:0.4rem;">
                ${plantillas.map(p => `
                  <button type="button" class="template-pill" onclick="Delfos.Vistas.NuevoSoporte.aplicarPlantilla('${p.id}')">
                    <i class="fa-solid fa-file-invoice"></i> ${Delfos.Utils.escapeHTML(p.nombre)}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="fast-support-card">
            <div class="fast-support-header">
              <div class="fast-support-title">
                <i class="fa-solid fa-bolt-lightning" style="color:var(--dorado);"></i>
                <span>${editandoSoporteId ? 'Editar Soporte Técnico' : 'Registro Rápido de Soporte'}</span>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem;">
                <span class="keyboard-hint-chip"><kbd>Ctrl</kbd> + <kbd>Enter</kbd> para guardar</span>
                ${ultimoSoporteGuardado && !editandoSoporteId ? `
                  <button type="button" class="btn btn-sm btn-secondary" onclick="Delfos.Vistas.NuevoSoporte.duplicarUltimo()" title="Copia los datos del soporte recién guardado">
                    <i class="fa-solid fa-clone"></i> Duplicar último
                  </button>
                ` : ''}
              </div>
            </div>

            <form id="form-soporte-rapido" onsubmit="event.preventDefault(); Delfos.Vistas.NuevoSoporte.guardar(false);">
              <!-- Fila 1: Fecha, Hora y Técnico -->
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Fecha</label>
                  <input type="date" id="sop-fecha" class="form-control" value="${fechaHoy}" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Hora (24h)</label>
                  <input type="time" id="sop-hora" class="form-control" value="${horaActual}" required>
                </div>

                <div class="form-group">
                  <label class="form-label">Técnico responsable</label>
                  <input type="text" id="sop-tecnico" class="form-control" value="${Delfos.Utils.escapeHTML(tecnicoActual)}" placeholder="Nombre del técnico">
                </div>
              </div>

              <!-- Fila 2: Ubicación con selector inteligente y mini-modal -->
              <div class="form-group">
                <div class="form-label">
                  <span>Ubicación <span class="obligatorio">Obligatorio</span></span>
                  <button type="button" class="sub-modal-trigger-btn" onclick="Delfos.Vistas.NuevoSoporte.abrirMiniModalUbicacion()">
                    <i class="fa-solid fa-plus"></i> Nueva ubicación
                  </button>
                </div>
                <select id="sop-ubicacion" class="form-select" onchange="Delfos.Vistas.NuevoSoporte.alCambiarUbicacion()" required>
                  <option value="">-- Selecciona una ubicación --</option>
                  ${this.generarOpcionesUbicacion(ubicacionInicialId)}
                </select>
                <div id="sop-ubicacion-info" class="form-hint" style="color:var(--verde); font-weight:600;"></div>
              </div>

              <!-- Fila 3: Equipos Involucrados (Múltiples, filtro numérico rápido) -->
              <div class="form-group" id="grupo-equipos" style="display:none;">
                <div class="form-label">
                  <span>Equipos involucrados (opcional)</span>
                  <div style="display:flex; gap:0.5rem;">
                    <button type="button" class="sub-modal-trigger-btn" onclick="Delfos.Vistas.NuevoSoporte.seleccionarTodosEquipos()">
                      <i class="fa-solid fa-check-double"></i> Todos los del aula
                    </button>
                    <button type="button" class="sub-modal-trigger-btn" onclick="Delfos.Vistas.NuevoSoporte.abrirMiniModalEquipo()">
                      <i class="fa-solid fa-plus"></i> Nuevo equipo
                    </button>
                  </div>
                </div>

                <div class="equipment-tag-container" id="sop-equipos-tags">
                  <!-- Pills de equipos agregados dinámicamente -->
                  <input type="text" id="sop-equipos-search" class="equipment-tag-input" placeholder="Escribe el número (ej: 07 o PC-07) y presiona Enter...">
                </div>

                <!-- Lista rápida de chips de equipos disponibles en el salón seleccionado -->
                <div id="sop-equipos-chips-wrapper" style="margin-top:0.4rem;">
                  <span style="font-size:0.75rem; color:var(--texto-suave);">Equipos en esta ubicación (toca para agregar/quitar):</span>
                  <div class="equipment-quick-grid" id="sop-equipos-chips-grid"></div>
                </div>
              </div>

              <!-- Fila 4: Categoría y Tipo de Problema (Cascada bidireccional) -->
              <div class="form-row">
                <div class="form-group">
                  <div class="form-label">
                    <span>Categoría <span class="obligatorio">Obligatorio</span></span>
                  </div>
                  <select id="sop-categoria" class="form-select" onchange="Delfos.Vistas.NuevoSoporte.alCambiarCategoria()" required>
                    <option value="">-- Selecciona categoría --</option>
                    ${this.generarOpcionesCategoria(soporteBase ? soporteBase.categoriaId : '')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tipo de problema</label>
                  <select id="sop-problema" class="form-select" onchange="Delfos.Vistas.NuevoSoporte.alCambiarProblema()">
                    <option value="">-- Selecciona problema --</option>
                    ${this.generarOpcionesProblemas(soporteBase ? soporteBase.categoriaId : '', soporteBase ? soporteBase.problemaId : '')}
                  </select>
                </div>
              </div>

              <!-- Fila 5: Tipo de Actividad y Estado -->
              <div class="form-row">
                <div class="form-group">
                  <div class="form-label">
                    <span>Tipo de actividad <span class="obligatorio">Obligatorio</span></span>
                  </div>
                  <select id="sop-actividad" class="form-select" required>
                    ${this.generarOpcionesActividad(soporteBase ? soporteBase.tipoActividadId : '')}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select id="sop-estado" class="form-select" required>
                    ${this.generarOpcionesEstado(soporteBase ? soporteBase.estadoId : '')}
                  </select>
                </div>
              </div>

              <!-- Fila 6: Descripción del problema (opcional) -->
              <div class="form-group">
                <label class="form-label">Descripción del problema (opcional)</label>
                <textarea id="sop-descripcion" class="form-control form-textarea" rows="2" placeholder="Detalle rápido de la falla reportada...">${soporteBase ? Delfos.Utils.escapeHTML(soporteBase.descripcion || '') : ''}</textarea>
              </div>

              <!-- Fila 7: Solución aplicada -->
              <div class="form-group">
                <label class="form-label">Solución aplicada</label>
                <textarea id="sop-solucion" class="form-control form-textarea" rows="2" placeholder="Acciones realizadas para resolver la incidencia...">${soporteBase ? Delfos.Utils.escapeHTML(soporteBase.solucion || '') : ''}</textarea>
              </div>

              <!-- Fila 8: Observaciones o notas adicionales (opcional) -->
              <div class="form-group">
                <label class="form-label">Observaciones (opcional)</label>
                <input type="text" id="sop-observaciones" class="form-control" value="${soporteBase ? Delfos.Utils.escapeHTML(soporteBase.observaciones || '') : ''}" placeholder="Recomendaciones, repuestos pendientes, etc.">
              </div>

              <!-- Barra de Acciones Final -->
              <div class="action-bar-bottom">
                <button type="button" class="btn btn-secondary" onclick="Delfos.Estado.cambiarVista('dashboard')">
                  Cancelar
                </button>

                <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                  ${!editandoSoporteId ? `
                    <button type="button" class="btn btn-secondary" onclick="Delfos.Vistas.NuevoSoporte.guardar(true)">
                      <i class="fa-solid fa-plus"></i> Guardar y registrar otro
                    </button>
                  ` : ''}

                  <button type="submit" class="btn btn-primary" style="min-width:180px;">
                    <i class="fa-solid fa-floppy-disk"></i> ${editandoSoporteId ? 'Guardar Cambios' : 'Guardar Soporte'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- MINI-MODAL INLINE: NUEVA UBICACIÓN -->
        <div id="mini-modal-ubicacion" class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="modal-title"><i class="fa-solid fa-location-dot" style="color:var(--verde);"></i> Nueva Ubicación</h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('mini-modal-ubicacion')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Edificio <span class="obligatorio">Obligatorio</span></label>
                <select id="mini-ub-edificio" class="form-select">
                  ${Delfos.Estado.edificios.map(ed => `<option value="${ed.id}">${Delfos.Utils.escapeHTML(ed.nombre)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Tipo de ubicación</label>
                <select id="mini-ub-tipo" class="form-select">
                  ${Delfos.Estado.tiposUbicacion.map(tu => `<option value="${tu.id}">${Delfos.Utils.escapeHTML(tu.nombre)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nombre del salón / área <span class="obligatorio">Obligatorio</span></label>
                <input type="text" id="mini-ub-nombre" class="form-control" placeholder="Ej: Laboratorio 3, Aula 204">
              </div>
              <div class="form-group">
                <label class="form-label">Referencia (opcional)</label>
                <input type="text" id="mini-ub-referencia" class="form-control" placeholder="Ej: Planta Alta, Extensión">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('mini-modal-ubicacion')">Cancelar</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="Delfos.Vistas.NuevoSoporte.crearUbicacionRapida()">Guardar y Seleccionar</button>
            </div>
          </div>
        </div>

        <!-- MINI-MODAL INLINE: NUEVO EQUIPO -->
        <div id="mini-modal-equipo" class="modal-overlay">
          <div class="modal-dialog modal-sm">
            <div class="modal-header">
              <h3 class="modal-title"><i class="fa-solid fa-desktop" style="color:var(--verde);"></i> Nuevo Equipo Rápido</h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('mini-modal-equipo')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Tipo de equipo</label>
                <select id="mini-eq-tipo" class="form-select">
                  ${Delfos.Estado.tiposEquipo.map(te => `<option value="${te.id}">${Delfos.Utils.escapeHTML(te.nombre)} (${te.prefijo})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Código del equipo</label>
                <input type="text" id="mini-eq-codigo" class="form-control" placeholder="Ej: PC-25, PRY-03">
              </div>
              <div class="form-group">
                <label class="form-label">Marca / Modelo (opcional)</label>
                <input type="text" id="mini-eq-marca" class="form-control" placeholder="Ej: Dell OptiPlex">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('mini-modal-equipo')">Cancelar</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="Delfos.Vistas.NuevoSoporte.crearEquipoRapido()">Guardar y Agregar</button>
            </div>
          </div>
        </div>
      `;

      // Inicializar el estado de la ubicación seleccionada
      this.alCambiarUbicacion();

      // Configurar escucha de teclado en el buscador de equipos
      this.configurarBuscadorEquipos();
    },

    generarOpcionesUbicacion: function(seleccionadaId) {
      let html = '';
      Delfos.Estado.edificios.forEach(ed => {
        const ubs = Delfos.Estado.ubicaciones.filter(u => u.edificioId === ed.id && u.activo !== false);
        if (ubs.length > 0) {
          html += `<optgroup label="${Delfos.Utils.escapeHTML(ed.nombre)}">`;
          ubs.forEach(u => {
            const isSel = u.id === seleccionadaId ? 'selected' : '';
            html += `<option value="${u.id}" ${isSel}>${Delfos.Utils.escapeHTML(u.nombre)}</option>`;
          });
          html += `</optgroup>`;
        }
      });
      return html;
    },

    generarOpcionesCategoria: function(seleccionadaId) {
      return Delfos.Estado.categorias
        .filter(c => c.activo !== false)
        .map(c => `<option value="${c.id}" ${c.id === seleccionadaId ? 'selected' : ''}>${Delfos.Utils.escapeHTML(c.nombre)}</option>`)
        .join('');
    },

    generarOpcionesProblemas: function(categoriaId, seleccionadoId) {
      const problemas = categoriaId 
        ? Delfos.Estado.tiposProblema.filter(p => p.categoriaId === categoriaId && p.activo !== false)
        : Delfos.Estado.tiposProblema.filter(p => p.activo !== false);

      let html = '<option value="">-- Selecciona problema --</option>';
      problemas.forEach(p => {
        html += `<option value="${p.id}" ${p.id === seleccionadoId ? 'selected' : ''}>${Delfos.Utils.escapeHTML(p.nombre)}</option>`;
      });
      return html;
    },

    generarOpcionesActividad: function(seleccionadaId) {
      return Delfos.Estado.tiposActividad
        .filter(a => a.activo !== false)
        .map(a => {
          const isSel = seleccionadaId ? (a.id === seleccionadaId) : (a.id === 'act_correctivo');
          return `<option value="${a.id}" ${isSel ? 'selected' : ''}>${Delfos.Utils.escapeHTML(a.nombre)}</option>`;
        })
        .join('');
    },

    generarOpcionesEstado: function(seleccionadoId) {
      return Delfos.Estado.estados
        .filter(e => e.activo !== false)
        .map(e => {
          const isSel = seleccionadoId ? (e.id === seleccionadoId) : e.porDefecto;
          return `<option value="${e.id}" ${isSel ? 'selected' : ''}>${Delfos.Utils.escapeHTML(e.nombre)}</option>`;
        })
        .join('');
    },

    alCambiarUbicacion: function() {
      const ubSelect = document.getElementById('sop-ubicacion');
      const infoSpan = document.getElementById('sop-ubicacion-info');
      const grupoEquipos = document.getElementById('grupo-equipos');
      if (!ubSelect) return;

      const ubId = ubSelect.value;
      if (!ubId) {
        if (infoSpan) infoSpan.innerHTML = '';
        if (grupoEquipos) grupoEquipos.style.display = 'none';
        return;
      }

      const ub = Delfos.Estado.getUbicacion(ubId);
      if (ub) {
        const edif = Delfos.Estado.getEdificio(ub.edificioId);
        const tipo = Delfos.Estado.getTipoUbicacion(ub.tipoId);
        if (infoSpan) {
          infoSpan.innerHTML = `<i class="fa-solid fa-circle-info"></i> ${edif ? edif.nombre : ''} &bull; ${tipo ? tipo.nombre : ''} ${ub.referencia ? `(${ub.referencia})` : ''}`;
        }
      }

      // Mostrar área de equipos y renderizar los que pertenecen a esta ubicación
      if (grupoEquipos) grupoEquipos.style.display = 'block';
      this.actualizarUIEquipos(ubId);
    },

    actualizarUIEquipos: function(ubId) {
      const tagsContainer = document.getElementById('sop-equipos-tags');
      const inputSearch = document.getElementById('sop-equipos-search');
      const chipsGrid = document.getElementById('sop-equipos-chips-grid');
      if (!tagsContainer || !chipsGrid) return;

      // Limpiar tags anteriores excepto el input
      const existingPills = tagsContainer.querySelectorAll('.equipment-pill');
      existingPills.forEach(p => p.remove());

      // Renderizar tags de equipos actualmente seleccionados
      equiposSeleccionadosIds.forEach(eqId => {
        const eq = Delfos.Estado.getEquipo(eqId);
        if (eq) {
          const pill = document.createElement('span');
          pill.className = 'equipment-pill';
          pill.innerHTML = `
            <span>${Delfos.Utils.escapeHTML(eq.codigo || eq.id)}</span>
            <span class="remove-tag" onclick="Delfos.Vistas.NuevoSoporte.quitarEquipo('${eq.id}')">&times;</span>
          `;
          tagsContainer.insertBefore(pill, inputSearch);
        }
      });

      // Renderizar chips de equipos disponibles en el salón
      const equiposAula = Delfos.Estado.getEquiposPorUbicacion(ubId);
      if (equiposAula.length === 0) {
        chipsGrid.innerHTML = '<span style="font-size:0.8rem; color:var(--texto-suave); padding:0.4rem;">No hay equipos registrados en esta ubicación. Puedes agregar uno con "+ Nuevo equipo".</span>';
        return;
      }

      chipsGrid.innerHTML = equiposAula.map(eq => {
        const isSel = equiposSeleccionadosIds.includes(eq.id);
        const tipoEq = Delfos.Estado.getTipoEquipo(eq.tipoId);
        const icono = tipoEq ? tipoEq.icono : 'fa-desktop';
        return `
          <button type="button" class="equipment-chip-btn ${isSel ? 'selected' : ''}" onclick="Delfos.Vistas.NuevoSoporte.toggleEquipo('${eq.id}')">
            <i class="fa-solid ${icono}"></i> ${Delfos.Utils.escapeHTML(eq.codigo || 'S/C')}
          </button>
        `;
      }).join('');
    },

    configurarBuscadorEquipos: function() {
      const input = document.getElementById('sop-equipos-search');
      if (!input) return;

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const query = input.value.trim().toLowerCase();
          if (!query) return;

          const ubSelect = document.getElementById('sop-ubicacion');
          const ubId = ubSelect ? ubSelect.value : null;
          const equiposAula = Delfos.Estado.getEquiposPorUbicacion(ubId);

          // Buscar coincidencia por código (ej: "18" coincide con "PC-18")
          const match = equiposAula.find(eq => {
            const cod = (eq.codigo || '').toLowerCase();
            return cod.includes(query) || cod.endsWith('-' + query);
          });

          if (match) {
            this.agregarEquipo(match.id);
            input.value = '';
          } else {
            Delfos.Utils.showToast(`No se encontró equipo coincidente con "${query}"`, 'info');
          }
        }
      });
    },

    agregarEquipo: function(eqId) {
      if (!equiposSeleccionadosIds.includes(eqId)) {
        equiposSeleccionadosIds.push(eqId);
        const ubId = document.getElementById('sop-ubicacion').value;
        this.actualizarUIEquipos(ubId);
      }
    },

    quitarEquipo: function(eqId) {
      equiposSeleccionadosIds = equiposSeleccionadosIds.filter(id => id !== eqId);
      const ubId = document.getElementById('sop-ubicacion').value;
      this.actualizarUIEquipos(ubId);
    },

    toggleEquipo: function(eqId) {
      if (equiposSeleccionadosIds.includes(eqId)) {
        this.quitarEquipo(eqId);
      } else {
        this.agregarEquipo(eqId);
      }
    },

    seleccionarTodosEquipos: function() {
      const ubId = document.getElementById('sop-ubicacion').value;
      if (!ubId) {
        Delfos.Utils.showToast('Primero selecciona una ubicación', 'info');
        return;
      }
      const equiposAula = Delfos.Estado.getEquiposPorUbicacion(ubId);
      equiposAula.forEach(eq => {
        if (!equiposSeleccionadosIds.includes(eq.id)) {
          equiposSeleccionadosIds.push(eq.id);
        }
      });
      this.actualizarUIEquipos(ubId);
      Delfos.Utils.showToast(`Se seleccionaron todos los equipos (${equiposAula.length}) de la ubicación`, 'success');
    },

    alCambiarCategoria: function() {
      const catSelect = document.getElementById('sop-categoria');
      const probSelect = document.getElementById('sop-problema');
      if (!catSelect || !probSelect) return;

      const catId = catSelect.value;
      probSelect.innerHTML = this.generarOpcionesProblemas(catId, '');
    },

    alCambiarProblema: function() {
      const probSelect = document.getElementById('sop-problema');
      const catSelect = document.getElementById('sop-categoria');
      if (!probSelect || !catSelect) return;

      const probId = probSelect.value;
      if (probId) {
        const prob = Delfos.Estado.getProblema(probId);
        if (prob && prob.categoriaId) {
          catSelect.value = prob.categoriaId;
        }
      }
    },

    aplicarPlantilla: function(plantillaId) {
      const plant = Delfos.Estado.plantillas.find(p => p.id === plantillaId);
      if (!plant) return;

      if (plant.categoriaId) {
        const catSelect = document.getElementById('sop-categoria');
        if (catSelect) catSelect.value = plant.categoriaId;
        this.alCambiarCategoria();
      }

      if (plant.tipoActividadId) {
        const actSelect = document.getElementById('sop-actividad');
        if (actSelect) actSelect.value = plant.tipoActividadId;
      }

      if (plant.estadoId) {
        const estSelect = document.getElementById('sop-estado');
        if (estSelect) estSelect.value = plant.estadoId;
      }

      if (plant.descripcion) {
        const descInput = document.getElementById('sop-descripcion');
        if (descInput) descInput.value = plant.descripcion;
      }

      if (plant.solucion) {
        const solInput = document.getElementById('sop-solucion');
        if (solInput) solInput.value = plant.solucion;
      }

      if (plant.observaciones) {
        const obsInput = document.getElementById('sop-observaciones');
        if (obsInput) obsInput.value = plant.observaciones;
      }

      Delfos.Utils.showToast(`Plantilla "${plant.nombre}" aplicada`, 'success');
    },

    abrirMiniModalUbicacion: function() {
      Delfos.Utils.openModal('mini-modal-ubicacion');
    },

    crearUbicacionRapida: async function() {
      const edifId = document.getElementById('mini-ub-edificio').value;
      const tipoId = document.getElementById('mini-ub-tipo').value;
      const nombre = document.getElementById('mini-ub-nombre').value.trim();
      const referencia = document.getElementById('mini-ub-referencia').value.trim();

      if (!nombre) {
        Delfos.Utils.showToast('El nombre de la ubicación es obligatorio', 'error');
        return;
      }

      const nuevaUb = {
        edificioId: edifId,
        tipoId: tipoId,
        nombre: nombre,
        referencia: referencia,
        revisadoEn: new Date().toISOString(),
        activo: true
      };

      const guardada = await Delfos.DB.guardar('ubicaciones', nuevaUb);
      await Delfos.Estado.recargarCatalogos();

      Delfos.Utils.closeModal('mini-modal-ubicacion');

      // Re-popular select y marcar la nueva
      const ubSelect = document.getElementById('sop-ubicacion');
      if (ubSelect) {
        ubSelect.innerHTML = `<option value="">-- Selecciona una ubicación --</option>` + this.generarOpcionesUbicacion(guardada.id);
        this.alCambiarUbicacion();
      }

      Delfos.Utils.showToast(`Ubicación "${nombre}" creada y seleccionada`, 'success');
    },

    abrirMiniModalEquipo: function() {
      const ubId = document.getElementById('sop-ubicacion').value;
      if (!ubId) {
        Delfos.Utils.showToast('Selecciona primero la ubicación donde estará el equipo', 'info');
        return;
      }
      Delfos.Utils.openModal('mini-modal-equipo');
    },

    crearEquipoRapido: async function() {
      const ubId = document.getElementById('sop-ubicacion').value;
      const tipoId = document.getElementById('mini-eq-tipo').value;
      const codigo = document.getElementById('mini-eq-codigo').value.trim();
      const marca = document.getElementById('mini-eq-marca').value.trim();

      if (!codigo) {
        Delfos.Utils.showToast('El código del equipo es necesario', 'error');
        return;
      }

      const nuevoEq = {
        codigo: codigo,
        tipoId: tipoId,
        ubicacionId: ubId,
        marca: marca,
        modelo: '',
        serie: '',
        notas: 'Agregado desde registro rápido de soporte',
        activo: true
      };

      const guardado = await Delfos.DB.guardar('equipos', nuevoEq);
      await Delfos.Estado.recargarCatalogos();

      Delfos.Utils.closeModal('mini-modal-equipo');
      this.agregarEquipo(guardado.id);
      Delfos.Utils.showToast(`Equipo "${codigo}" creado y agregado al soporte`, 'success');
    },

    guardar: async function(registrarOtro = false) {
      const fecha = document.getElementById('sop-fecha').value;
      const hora = document.getElementById('sop-hora').value;
      const ubicacionId = document.getElementById('sop-ubicacion').value;
      const categoriaId = document.getElementById('sop-categoria').value;
      const problemaId = document.getElementById('sop-problema').value;
      const tipoActividadId = document.getElementById('sop-actividad').value;
      const estadoId = document.getElementById('sop-estado').value;
      const descripcion = document.getElementById('sop-descripcion').value.trim();
      const solucion = document.getElementById('sop-solucion').value.trim();
      const observaciones = document.getElementById('sop-observaciones').value.trim();
      const tecnico = document.getElementById('sop-tecnico').value.trim();

      // Validación de los 3 campos obligatorios
      if (!ubicacionId) {
        Delfos.Utils.showToast('Debes seleccionar una ubicación', 'error');
        document.getElementById('sop-ubicacion').focus();
        return;
      }
      if (!categoriaId) {
        Delfos.Utils.showToast('Debes seleccionar una categoría', 'error');
        document.getElementById('sop-categoria').focus();
        return;
      }
      if (!tipoActividadId) {
        Delfos.Utils.showToast('Debes indicar el tipo de actividad', 'error');
        document.getElementById('sop-actividad').focus();
        return;
      }

      const datosSoporte = {
        fecha: fecha,
        hora: hora,
        ubicacionId: ubicacionId,
        equipoIds: [...equiposSeleccionadosIds],
        categoriaId: categoriaId,
        problemaId: problemaId || null,
        tipoActividadId: tipoActividadId,
        estadoId: estadoId,
        descripcion: descripcion,
        solucion: solucion,
        observaciones: observaciones,
        tecnico: tecnico,
        activo: true
      };

      if (editandoSoporteId) {
        datosSoporte.id = editandoSoporteId;
      }

      const guardado = await Delfos.DB.guardar('soportes', datosSoporte);
      ultimoSoporteGuardado = guardado;

      // Recordar última ubicación en configuración
      await Delfos.DB.guardarConfig('ultimaUbicacionId', ubicacionId);

      Delfos.Utils.showToast(editandoSoporteId ? 'Soporte actualizado con éxito' : '¡Soporte guardado con éxito!', 'success');

      if (registrarOtro) {
        // Reiniciar formulario manteniendo fecha, hora actual y ubicación
        equiposSeleccionadosIds = [];
        this.render(document.getElementById('vista-activa-container'));
      } else {
        Delfos.Estado.cambiarVista('historial');
      }
    },

    duplicarUltimo: function() {
      if (!ultimoSoporteGuardado) return;
      this.render(document.getElementById('vista-activa-container'), { duplicarId: ultimoSoporteGuardado.id });
      Delfos.Utils.showToast('Datos del último soporte cargados para registrar uno nuevo', 'info');
    }
  };

  Delfos.Vistas.NuevoSoporte = NuevoSoporte;
})(window.Delfos);
