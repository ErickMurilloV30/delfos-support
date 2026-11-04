/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: MODO RECORRIDO (MOBILE-FIRST PARA LEVANTAMIENTO)
 * Salón por salón: Edificio -> Nombre del aula -> Contadores gigantes - / +
 * Códigos autoincrementales sin colisión, barra de progreso e insignia "Revisado"
 * Con opción completa de edición y ajuste de equipos de salones existentes.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let edificioSeleccionadoId = 'edif_principal';
  let contadoresEquipos = {};
  let salonEnEdicionId = null; // ID del salón que se está editando actualmente (si aplica)

  const Recorrido = {
    render: async function(container) {
      if (!edificioSeleccionadoId && Delfos.Estado.edificios.length > 0) {
        edificioSeleccionadoId = Delfos.Estado.edificios[0].id;
      }

      // Calcular progreso del edificio seleccionado
      const ubsEdificio = Delfos.Estado.ubicaciones.filter(u => u.edificioId === edificioSeleccionadoId && u.activo !== false);
      const ubsRevisadas = ubsEdificio.filter(u => !!u.revisadoEn);
      const porcentaje = ubsEdificio.length > 0 ? Math.round((ubsRevisadas.length / ubsEdificio.length) * 100) : 0;

      // Obtener datos si estamos en modo edición
      let salonEditando = null;
      let equiposEnEdicion = [];
      let conteoEquiposActual = {};

      if (salonEnEdicionId) {
        salonEditando = Delfos.Estado.getUbicacion(salonEnEdicionId);
        if (salonEditando) {
          equiposEnEdicion = await Delfos.DB.listar('equipos', e => e.ubicacionId === salonEnEdicionId && e.activo !== false);
          equiposEnEdicion.forEach(e => {
            conteoEquiposActual[e.tipoId] = (conteoEquiposActual[e.tipoId] || 0) + 1;
          });
          // Inicializar contadores con los existentes si no se han tocado
          contadoresEquipos = {};
          Delfos.Estado.tiposEquipo.forEach(t => {
            contadoresEquipos[t.id] = conteoEquiposActual[t.id] || 0;
          });
        } else {
          salonEnEdicionId = null;
        }
      }

      if (!salonEnEdicionId) {
        // Modo nuevo salón: contadores en 0
        contadoresEquipos = {};
        Delfos.Estado.tiposEquipo.forEach(t => {
          contadoresEquipos[t.id] = 0;
        });
      }

      container.innerHTML = `
        <div style="max-width:850px; margin:0 auto; padding-bottom:5.5rem;">
          <!-- Barra Superior del Modo Recorrido -->
          <div class="card" style="margin-bottom:1.5rem; background:linear-gradient(135deg, var(--verde) 0%, var(--verde-oscuro) 100%); color:#FFFFFF; padding:1.5rem 1.75rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div>
                <span style="font-size:0.75rem; font-weight:800; color:var(--dorado); text-transform:uppercase; letter-spacing:1px;">
                  <i class="fa-solid fa-person-walking"></i> Modo Recorrido Salón por Salón
                </span>
                <h2 style="font-size:1.45rem; font-weight:800; margin-top:0.25rem;">Levantamiento Rápido de Inventario</h2>
              </div>
              <button class="btn btn-sm btn-dorado" onclick="Delfos.Estado.cambiarVista('inventario')">
                <i class="fa-solid fa-list-check"></i> Ver Lista Completa
              </button>
            </div>
          </div>

          <!-- Selector de Edificio en Píldoras -->
          <div style="margin-bottom:1.25rem;">
            <label style="font-size:0.8rem; font-weight:700; color:var(--texto-suave); text-transform:uppercase; display:block; margin-bottom:0.5rem;">
              Paso 1: Selecciona el Edificio
            </label>
            <div class="building-pills-selector">
              ${Delfos.Estado.edificios.map(ed => `
                <button type="button" class="building-pill-btn ${ed.id === edificioSeleccionadoId ? 'active' : ''}" onclick="Delfos.Vistas.Recorrido.cambiarEdificio('${ed.id}')">
                  <i class="fa-solid fa-building"></i> ${Delfos.Utils.escapeHTML(ed.nombre)}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Barra de Progreso del Edificio -->
          <div class="card recorrido-progress-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; font-size:0.88rem;">
              <span>Progreso de revisión en este edificio: <strong>${ubsRevisadas.length} de ${ubsEdificio.length} aulas</strong></span>
              <strong style="color:var(--verde); font-size:1rem;">${porcentaje}%</strong>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-fill" style="width:${porcentaje}%;"></div>
            </div>
          </div>

          <!-- Banner Informativo si se está EDITANDO un salón -->
          ${salonEditando ? `
            <div class="card" style="background:#FEF7EB; border:2px solid var(--dorado); padding:1rem 1.25rem; margin-bottom:1.25rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                  <i class="fa-solid fa-pen-to-square" style="color:#D97706; font-size:1.5rem;"></i>
                  <div>
                    <strong style="color:#92400E; font-size:1.05rem;">Modificando: "${Delfos.Utils.escapeHTML(salonEditando.nombre)}"</strong>
                    <div style="font-size:0.82rem; color:#B45309;">
                      Puedes cambiar el nombre o ajustar los contadores de equipos. Presiona <strong>Guardar Cambios</strong> al terminar.
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="Delfos.Vistas.Recorrido.cancelarEdicion()">
                  <i class="fa-solid fa-xmark"></i> Cancelar Edición
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Formulario del Salón Actual -->
          <div class="card" id="form-recorrido-box" style="padding:1.75rem; margin-bottom:2rem;">
            <h3 style="font-size:1.15rem; font-weight:800; color:var(--texto); margin-bottom:1.25rem; display:flex; align-items:center; gap:0.5rem;">
              <i class="fa-solid fa-door-open" style="color:var(--dorado);"></i>
              ${salonEditando ? 'Paso 2: Modificar Datos del Salón' : 'Paso 2: Datos del Salón o Área'}
            </h3>

            ${!salonEditando ? `
              <!-- Selector de modo (nuevo o elegir existente) -->
              <div class="form-row" style="margin-bottom:1.25rem;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">¿Salón nuevo o ya registrado?</label>
                  <select id="rec-modo-aula" class="form-select" onchange="Delfos.Vistas.Recorrido.alCambiarModoAula()">
                    <option value="nuevo">+ Crear y registrar un nuevo salón</option>
                    ${ubsEdificio.map(u => `<option value="${u.id}">Seleccionar: ${Delfos.Utils.escapeHTML(u.nombre)} (${u.revisadoEn ? '✓ Revisado' : 'Pendiente'})</option>`).join('')}
                  </select>
                </div>

                <div class="form-group" id="rec-grupo-tipo-salon" style="margin-bottom:0;">
                  <label class="form-label">Tipo de Ubicación</label>
                  <select id="rec-tipo-salon" class="form-select">
                    ${Delfos.Estado.tiposUbicacion.map(t => `<option value="${t.id}">${Delfos.Utils.escapeHTML(t.nombre)}</option>`).join('')}
                  </select>
                </div>
              </div>
            ` : `
              <!-- Campos en Modo Edición -->
              <div class="form-row" style="margin-bottom:1.25rem;">
                <div class="form-group" style="margin-bottom:0;">
                  <label class="form-label">Tipo de Ubicación</label>
                  <select id="rec-tipo-salon" class="form-select">
                    ${Delfos.Estado.tiposUbicacion.map(t => `<option value="${t.id}" ${t.id === salonEditando.tipoId ? 'selected' : ''}>${Delfos.Utils.escapeHTML(t.nombre)}</option>`).join('')}
                  </select>
                </div>
              </div>
            `}

            <div class="form-row" id="rec-fila-detalles-nuevo" style="margin-bottom:1.5rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Nombre del salón / laboratorio <span class="obligatorio">Obligatorio</span></label>
                <input type="text" id="rec-nombre-salon" class="form-control" value="${salonEditando ? Delfos.Utils.escapeHTML(salonEditando.nombre) : ''}" placeholder="Ej: Salón Zeus, Laboratorio Olmedo, Aula 302">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Referencia física (opcional)</label>
                <input type="text" id="rec-referencia-salon" class="form-control" value="${salonEditando && salonEditando.referencia ? Delfos.Utils.escapeHTML(salonEditando.referencia) : ''}" placeholder="Ej: 2do Piso, Extensión">
              </div>
            </div>

            <!-- Paso 3: Contadores de Equipos con botones táctiles grandes -->
            <div style="border-top:1px solid var(--borde); padding-top:1.25rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                <label style="font-size:0.95rem; font-weight:800; color:var(--texto);">
                  <i class="fa-solid fa-calculator" style="color:var(--verde); margin-right:0.4rem;"></i>
                  ${salonEditando ? 'Paso 3: Total de Equipos en este Salón (Ajustar cantidades)' : 'Paso 3: Equipos encontrados en este salón'}
                </label>
                <span style="font-size:0.8rem; color:var(--texto-suave);">Usa − / + o escribe la cantidad directamente</span>
              </div>

              <div class="equipment-stepper-grid">
                ${Delfos.Estado.tiposEquipo.map(t => {
                  const qty = contadoresEquipos[t.id] || 0;
                  return `
                    <div class="equipment-stepper-card">
                      <div class="equipment-stepper-label">
                        <i class="fa-solid ${t.icono}"></i>
                        <span>${Delfos.Utils.escapeHTML(t.nombre)}</span>
                      </div>
                      <div class="stepper-counter">
                        <button type="button" class="stepper-btn" onclick="Delfos.Vistas.Recorrido.modificarContador('${t.id}', -1)">−</button>
                        <input type="number" id="stepper-input-${t.id}" class="stepper-input" value="${qty}" min="0" max="99" onchange="Delfos.Vistas.Recorrido.alCambiarInputDirecto('${t.id}')">
                        <button type="button" class="stepper-btn" onclick="Delfos.Vistas.Recorrido.modificarContador('${t.id}', 1)">+</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Botones de Acción Final (Diseño responsive adaptado a móvil y PC) -->
            <div class="recorrido-actions-bar">
              ${salonEditando ? `
                <button type="button" class="btn btn-secondary" onclick="Delfos.Vistas.Recorrido.cancelarEdicion()">
                  <i class="fa-solid fa-xmark"></i> Descartar Cambios
                </button>
                <button type="button" class="btn btn-primary" style="background:#1B6B3A;" onclick="Delfos.Vistas.Recorrido.guardarEdicionSalon()">
                  <i class="fa-solid fa-floppy-disk"></i> Guardar Cambios en "${Delfos.Utils.escapeHTML(salonEditando.nombre)}"
                </button>
              ` : `
                <button type="button" class="btn btn-secondary" onclick="Delfos.Vistas.Recorrido.marcarRevisadoSinEquipos()">
                  <i class="fa-solid fa-check"></i> Salón sin equipos (Marcar revisado)
                </button>
                <button type="button" class="btn btn-primary" onclick="Delfos.Vistas.Recorrido.guardarYSiguienteSalon()">
                  <i class="fa-solid fa-arrow-right-to-bracket"></i> Guardar y Siguiente Salón
                </button>
              `}
            </div>
          </div>

          <!-- Lista de Salones del Edificio con Botón de Edición Directa -->
          <div class="card">
            <div class="card-header" style="flex-wrap:wrap; gap:0.5rem;">
              <div>
                <h3 class="card-title"><i class="fa-solid fa-list-ol"></i> Salones en este edificio (${ubsEdificio.length})</h3>
                <div class="card-subtitle">Toca "Editar / Modificar" en cualquier salón si te equivocaste o deseas agregarle nuevas PCs.</div>
              </div>
            </div>
            <div class="card-body" style="padding:0;">
              ${this.generarListaSalones(ubsEdificio)}
            </div>
          </div>
        </div>
      `;
    },

    cambiarEdificio: function(edifId) {
      edificioSeleccionadoId = edifId;
      salonEnEdicionId = null;
      this.render(document.getElementById('vista-activa-container'));
    },

    cargarParaEditar: function(ubId) {
      salonEnEdicionId = ubId;
      this.render(document.getElementById('vista-activa-container'));
      // Scroll suave hacia el formulario
      setTimeout(() => {
        const formBox = document.getElementById('form-recorrido-box');
        if (formBox) {
          formBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    },

    cancelarEdicion: function() {
      salonEnEdicionId = null;
      this.render(document.getElementById('vista-activa-container'));
    },

    modificarContador: function(tipoId, delta) {
      let actual = contadoresEquipos[tipoId] || 0;
      actual = Math.max(0, actual + delta);
      contadoresEquipos[tipoId] = actual;

      const input = document.getElementById(`stepper-input-${tipoId}`);
      if (input) input.value = actual;
    },

    alCambiarInputDirecto: function(tipoId) {
      const input = document.getElementById(`stepper-input-${tipoId}`);
      if (!input) return;
      let val = parseInt(input.value, 10);
      if (isNaN(val) || val < 0) val = 0;
      contadoresEquipos[tipoId] = val;
      input.value = val;
    },

    alCambiarModoAula: async function() {
      const select = document.getElementById('rec-modo-aula');
      const filaNuevo = document.getElementById('rec-fila-detalles-nuevo');
      const grupoTipo = document.getElementById('rec-grupo-tipo-salon');
      if (!select) return;

      const val = select.value;
      if (val === 'nuevo') {
        filaNuevo.style.display = 'grid';
        grupoTipo.style.display = 'block';
        document.getElementById('rec-nombre-salon').value = '';
        document.getElementById('rec-referencia-salon').value = '';
        // Reset counters
        Delfos.Estado.tiposEquipo.forEach(t => {
          contadoresEquipos[t.id] = 0;
          const inp = document.getElementById(`stepper-input-${t.id}`);
          if (inp) inp.value = 0;
        });
      } else {
        // Cargar datos de aula existente seleccionada
        const ub = Delfos.Estado.getUbicacion(val);
        filaNuevo.style.display = 'grid';
        grupoTipo.style.display = 'block';
        if (ub) {
          document.getElementById('rec-nombre-salon').value = ub.nombre || '';
          document.getElementById('rec-referencia-salon').value = ub.referencia || '';
          document.getElementById('rec-tipo-salon').value = ub.tipoId || '';
        }

        const equiposEnAula = await Delfos.DB.listar('equipos', e => e.ubicacionId === val && e.activo !== false);
        const conteos = {};
        equiposEnAula.forEach(e => {
          conteos[e.tipoId] = (conteos[e.tipoId] || 0) + 1;
        });

        Delfos.Estado.tiposEquipo.forEach(t => {
          const qty = conteos[t.id] || 0;
          contadoresEquipos[t.id] = qty;
          const inp = document.getElementById(`stepper-input-${t.id}`);
          if (inp) inp.value = qty;
        });
      }
    },

    guardarEdicionSalon: async function() {
      if (!salonEnEdicionId) return;
      const ub = await Delfos.DB.obtener('ubicaciones', salonEnEdicionId);
      if (!ub) return;

      const nuevoNombre = document.getElementById('rec-nombre-salon').value.trim();
      const nuevoTipo = document.getElementById('rec-tipo-salon').value;
      const nuevaRef = document.getElementById('rec-referencia-salon').value.trim();

      if (!nuevoNombre) {
        Delfos.Utils.showToast('El nombre del salón no puede estar vacío', 'error');
        return;
      }

      ub.nombre = nuevoNombre;
      ub.tipoId = nuevoTipo;
      ub.referencia = nuevaRef;
      ub.revisadoEn = new Date().toISOString();
      await Delfos.DB.guardar('ubicaciones', ub);

      // Ajustar equipos existentes y nuevos
      const equiposActuales = await Delfos.DB.listar('equipos', e => e.ubicacionId === salonEnEdicionId && e.activo !== false);
      const todosEquipos = await Delfos.DB.listar('equipos');

      let equiposNuevosAgregados = 0;
      let equiposRetirados = 0;

      for (const [tipoId, cantidadDeseada] of Object.entries(contadoresEquipos)) {
        const existentesTipo = equiposActuales.filter(e => e.tipoId === tipoId);
        const delta = cantidadDeseada - existentesTipo.length;

        if (delta > 0) {
          // Agregar los equipos faltantes
          const tipo = Delfos.Estado.getTipoEquipo(tipoId);
          const prefijo = tipo ? tipo.prefijo : 'EQ';
          const todosMismoTipo = todosEquipos.filter(e => e.tipoId === tipoId);
          let maxNum = 0;
          todosMismoTipo.forEach(e => {
            if (e.codigo && e.codigo.startsWith(prefijo + '-')) {
              const numPart = parseInt(e.codigo.replace(prefijo + '-', ''), 10);
              if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
            }
          });

          for (let i = 1; i <= delta; i++) {
            const cod = `${prefijo}-${String(maxNum + i).padStart(2, '0')}`;
            await Delfos.DB.guardar('equipos', {
              tipoId: tipoId,
              codigo: cod,
              ubicacionId: salonEnEdicionId,
              marca: '',
              modelo: '',
              serie: '',
              notas: `Agregado en ajuste de inventario en ${nuevoNombre}`,
              activo: true
            });
            maxNum++;
            equiposNuevosAgregados++;
          }
        } else if (delta < 0) {
          // Desactivar equipos excedentes (los últimos)
          const quitar = Math.abs(delta);
          for (let i = 0; i < quitar; i++) {
            const eqAQuitar = existentesTipo[existentesTipo.length - 1 - i];
            if (eqAQuitar) {
              eqAQuitar.activo = false;
              await Delfos.DB.guardar('equipos', eqAQuitar);
              equiposRetirados++;
            }
          }
        }
      }

      await Delfos.Estado.recargarCatalogos();
      salonEnEdicionId = null;

      let msg = `¡"${nuevoNombre}" actualizado con éxito!`;
      if (equiposNuevosAgregados > 0) msg += ` (+${equiposNuevosAgregados} equipos añadidos)`;
      if (equiposRetirados > 0) msg += ` (-${equiposRetirados} equipos retirados)`;
      Delfos.Utils.showToast(msg, 'success');

      this.render(document.getElementById('vista-activa-container'));
    },

    guardarYSiguienteSalon: async function() {
      const selectModo = document.getElementById('rec-modo-aula');
      const modo = selectModo ? selectModo.value : 'nuevo';
      let ubicacionId = modo;
      let nombreSalon = '';

      if (modo === 'nuevo') {
        nombreSalon = document.getElementById('rec-nombre-salon').value.trim();
        const tipoId = document.getElementById('rec-tipo-salon').value;
        const referencia = document.getElementById('rec-referencia-salon').value.trim();

        if (!nombreSalon) {
          Delfos.Utils.showToast('Ingresa el nombre del salón', 'error');
          document.getElementById('rec-nombre-salon').focus();
          return;
        }

        const nuevaUb = {
          edificioId: edificioSeleccionadoId,
          tipoId: tipoId,
          nombre: nombreSalon,
          referencia: referencia,
          revisadoEn: new Date().toISOString(),
          activo: true
        };

        const guardada = await Delfos.DB.guardar('ubicaciones', nuevaUb);
        ubicacionId = guardada.id;
      } else {
        const ub = await Delfos.DB.obtener('ubicaciones', ubicacionId);
        if (ub) {
          ub.revisadoEn = new Date().toISOString();
          await Delfos.DB.guardar('ubicaciones', ub);
          nombreSalon = ub.nombre;
        }
      }

      // Generar equipos según los contadores
      const equiposNuevos = [];
      const todosEquipos = await Delfos.DB.listar('equipos');

      for (const [tipoId, cantidad] of Object.entries(contadoresEquipos)) {
        if (cantidad <= 0) continue;

        const tipo = Delfos.Estado.getTipoEquipo(tipoId);
        const prefijo = tipo ? tipo.prefijo : 'EQ';

        const existentesMismoTipo = todosEquipos.filter(e => e.tipoId === tipoId);
        let maxNum = 0;
        existentesMismoTipo.forEach(e => {
          if (e.codigo && e.codigo.startsWith(prefijo + '-')) {
            const numPart = parseInt(e.codigo.replace(prefijo + '-', ''), 10);
            if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
          }
        });

        for (let i = 1; i <= cantidad; i++) {
          const cod = `${prefijo}-${String(maxNum + i).padStart(2, '0')}`;
          equiposNuevos.push({
            tipoId: tipoId,
            codigo: cod,
            ubicacionId: ubicacionId,
            marca: '',
            modelo: '',
            serie: '',
            notas: `Registrado en Modo Recorrido en ${nombreSalon}`,
            activo: true
          });
        }
      }

      if (equiposNuevos.length > 0) {
        await Delfos.DB.guardarLote('equipos', equiposNuevos);
      }

      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast(`¡"${nombreSalon}" guardado con ${equiposNuevos.length} equipos registrados!`, 'success');

      // Pasar inmediatamente al siguiente salón
      this.render(document.getElementById('vista-activa-container'));
    },

    marcarRevisadoSinEquipos: async function() {
      const selectModo = document.getElementById('rec-modo-aula');
      const modo = selectModo ? selectModo.value : 'nuevo';
      let nombreSalon = '';

      if (modo === 'nuevo') {
        nombreSalon = document.getElementById('rec-nombre-salon').value.trim();
        const tipoId = document.getElementById('rec-tipo-salon').value;
        const referencia = document.getElementById('rec-referencia-salon').value.trim();

        if (!nombreSalon) {
          Delfos.Utils.showToast('Ingresa el nombre del salón', 'error');
          return;
        }

        await Delfos.DB.guardar('ubicaciones', {
          edificioId: edificioSeleccionadoId,
          tipoId: tipoId,
          nombre: nombreSalon,
          referencia: referencia,
          revisadoEn: new Date().toISOString(),
          activo: true
        });
      } else {
        const ub = await Delfos.DB.obtener('ubicaciones', modo);
        if (ub) {
          ub.revisadoEn = new Date().toISOString();
          await Delfos.DB.guardar('ubicaciones', ub);
          nombreSalon = ub.nombre;
        }
      }

      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast(`"${nombreSalon}" marcado como revisado (sin equipos)`, 'info');
      this.render(document.getElementById('vista-activa-container'));
    },

    eliminarSalon: async function(ubId) {
      const ub = Delfos.Estado.getUbicacion(ubId);
      if (!ub) return;

      const equipos = Delfos.Estado.getEquiposPorUbicacion(ubId);
      const conf = confirm(`¿Estás seguro de eliminar el salón "${ub.nombre}"?${equipos.length > 0 ? `\n(Tiene ${equipos.length} equipos registrados que también se desactivarán)` : ''}`);
      if (!conf) return;

      ub.activo = false;
      await Delfos.DB.guardar('ubicaciones', ub);

      // Desactivar equipos de este salón
      for (const eq of equipos) {
        eq.activo = false;
        await Delfos.DB.guardar('equipos', eq);
      }

      if (salonEnEdicionId === ubId) {
        salonEnEdicionId = null;
      }

      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast(`Salón "${ub.nombre}" eliminado`, 'info');
      this.render(document.getElementById('vista-activa-container'));
    },

    generarListaSalones: function(salones) {
      if (!salones || salones.length === 0) {
        return '<p style="padding:2rem; text-align:center; color:var(--texto-suave);">No hay salones registrados en este edificio aún. Completa el formulario de arriba para agregar el primero.</p>';
      }

      let html = '<div class="salones-recorrido-grid">';
      salones.forEach(u => {
        const tipo = Delfos.Estado.getTipoUbicacion(u.tipoId);
        const equipos = Delfos.Estado.getEquiposPorUbicacion(u.id);
        const revisado = !!u.revisadoEn;
        const isEditingThis = salonEnEdicionId === u.id;

        // Desglose rápido de tipos de equipo (ej: "20 PC, 1 PRY")
        const conteos = {};
        equipos.forEach(e => {
          const t = Delfos.Estado.getTipoEquipo(e.tipoId);
          const pref = t ? t.prefijo : 'EQ';
          conteos[pref] = (conteos[pref] || 0) + 1;
        });
        const resumenTipos = Object.entries(conteos).map(([pref, cnt]) => `${cnt} ${pref}`).join(', ');

        html += `
          <div class="salon-recorrido-card ${isEditingThis ? 'is-active-editing' : ''}">
            <div class="salon-info-box">
              <div class="salon-info-title">
                <i class="fa-solid fa-door-open" style="color:var(--verde);"></i>
                <span>${Delfos.Utils.escapeHTML(u.nombre)}</span>
                <span class="badge ${revisado ? 'badge-resuelto' : 'badge-neutral'}">
                  ${revisado ? '<i class="fa-solid fa-check"></i> Revisado' : '<i class="fa-regular fa-clock"></i> Pendiente'}
                </span>
                ${isEditingThis ? '<span class="badge badge-en-proceso" style="background:#FEF3C7; color:#92400E;"><i class="fa-solid fa-pencil"></i> Editando ahora</span>' : ''}
              </div>
              <div class="salon-info-sub">
                <span>${Delfos.Utils.escapeHTML(tipo ? tipo.nombre : 'Ubicación')}</span>
                ${u.referencia ? `<span>• Ref: ${Delfos.Utils.escapeHTML(u.referencia)}</span>` : ''}
                <span class="salon-equipos-badge">
                  <i class="fa-solid fa-desktop"></i>
                  ${equipos.length} ${equipos.length === 1 ? 'equipo' : 'equipos'}
                  ${resumenTipos ? `(${resumenTipos})` : ''}
                </span>
              </div>
            </div>

            <div class="salon-recorrido-actions">
              <button type="button" class="btn btn-sm btn-secondary" style="color:var(--verde); font-weight:700; border-color:#CBD5E1;" onclick="Delfos.Vistas.Recorrido.cargarParaEditar('${u.id}')">
                <i class="fa-solid fa-pen-to-square"></i> Editar / Modificar
              </button>
              <button type="button" class="btn btn-sm btn-danger btn-icon" onclick="Delfos.Vistas.Recorrido.eliminarSalon('${u.id}')" title="Eliminar salón">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
        `;
      });
      html += '</div>';
      return html;
    }
  };

  Delfos.Vistas.Recorrido = Recorrido;
})(window.Delfos);
