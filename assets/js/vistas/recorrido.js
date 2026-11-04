/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: MODO RECORRIDO (MOBILE-FIRST PARA LEVANTAMIENTO)
 * Salón por salón: Edificio -> Nombre del aula -> Contadores gigantes - / +
 * Códigos autoincrementales sin colisión, barra de progreso e insignia "Revisado"
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let edificioSeleccionadoId = 'edif_principal';
  let contadoresEquipos = {};

  const Recorrido = {
    render: async function(container) {
      if (!edificioSeleccionadoId && Delfos.Estado.edificios.length > 0) {
        edificioSeleccionadoId = Delfos.Estado.edificios[0].id;
      }

      // Reiniciar contadores en 0
      contadoresEquipos = {};
      Delfos.Estado.tiposEquipo.forEach(t => {
        contadoresEquipos[t.id] = 0;
      });

      // Calcular progreso del edificio seleccionado
      const ubsEdificio = Delfos.Estado.ubicaciones.filter(u => u.edificioId === edificioSeleccionadoId && u.activo !== false);
      const ubsRevisadas = ubsEdificio.filter(u => !!u.revisadoEn);
      const porcentaje = ubsEdificio.length > 0 ? Math.round((ubsRevisadas.length / ubsEdificio.length) * 100) : 0;

      container.innerHTML = `
        <div style="max-width:850px; margin:0 auto;">
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

          <!-- Formulario del Salón Actual -->
          <div class="card" style="padding:1.75rem; margin-bottom:2rem;">
            <h3 style="font-size:1.15rem; font-weight:800; color:var(--texto); margin-bottom:1.25rem; display:flex; align-items:center; gap:0.5rem;">
              <i class="fa-solid fa-door-open" style="color:var(--dorado);"></i> Paso 2: Datos del Salón o Área
            </h3>

            <!-- Opción para elegir salón existente del edificio o crear uno nuevo -->
            <div class="form-row" style="margin-bottom:1.25rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">¿Salón existente o nuevo?</label>
                <select id="rec-modo-aula" class="form-select" onchange="Delfos.Vistas.Recorrido.alCambiarModoAula()">
                  <option value="nuevo">+ Crear y registrar un nuevo salón</option>
                  ${ubsEdificio.map(u => `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)} (${u.revisadoEn ? '✓ Revisado' : 'Pendiente'})</option>`).join('')}
                </select>
              </div>

              <div class="form-group" id="rec-grupo-tipo-salon" style="margin-bottom:0;">
                <label class="form-label">Tipo de Ubicación</label>
                <select id="rec-tipo-salon" class="form-select">
                  ${Delfos.Estado.tiposUbicacion.map(t => `<option value="${t.id}">${Delfos.Utils.escapeHTML(t.nombre)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-row" id="rec-fila-detalles-nuevo" style="margin-bottom:1.5rem;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Nombre del salón / laboratorio <span class="obligatorio">Obligatorio</span></label>
                <input type="text" id="rec-nombre-salon" class="form-control" placeholder="Ej: Salón Zeus, Aula 302, Laboratorio de Ciencias">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Referencia física (opcional)</label>
                <input type="text" id="rec-referencia-salon" class="form-control" placeholder="Ej: 2do Piso, Extensión">
              </div>
            </div>

            <!-- Paso 3: Contadores de Equipos con botones táctiles grandes -->
            <div style="border-top:1px solid var(--borde); padding-top:1.25rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
                <label style="font-size:0.95rem; font-weight:800; color:var(--texto);">
                  <i class="fa-solid fa-calculator" style="color:var(--verde); margin-right:0.4rem;"></i>
                  Paso 3: Equipos encontrados en este salón
                </label>
                <span style="font-size:0.8rem; color:var(--texto-suave);">Usa − / + o escribe la cantidad directamente</span>
              </div>

              <div class="equipment-stepper-grid">
                ${Delfos.Estado.tiposEquipo.map(t => `
                  <div class="equipment-stepper-card">
                    <div class="equipment-stepper-label">
                      <i class="fa-solid ${t.icono}"></i>
                      <span>${Delfos.Utils.escapeHTML(t.nombre)}</span>
                    </div>
                    <div class="stepper-counter">
                      <button type="button" class="stepper-btn" onclick="Delfos.Vistas.Recorrido.modificarContador('${t.id}', -1)">−</button>
                      <input type="number" id="stepper-input-${t.id}" class="stepper-input" value="0" min="0" max="99" onchange="Delfos.Vistas.Recorrido.alCambiarInputDirecto('${t.id}')">
                      <button type="button" class="stepper-btn" onclick="Delfos.Vistas.Recorrido.modificarContador('${t.id}', 1)">+</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Botón Grande de Acción Final -->
            <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem; padding-top:1.5rem; border-top:1px solid var(--borde);">
              <button type="button" class="btn btn-secondary" onclick="Delfos.Vistas.Recorrido.marcarRevisadoSinEquipos()">
                <i class="fa-solid fa-check"></i> Salón sin equipos (Marcar revisado)
              </button>
              <button type="button" class="btn btn-primary" style="height:54px; min-height:54px; font-size:1.05rem;" onclick="Delfos.Vistas.Recorrido.guardarYSiguienteSalon()">
                <i class="fa-solid fa-arrow-right-to-bracket"></i> Guardar y Siguiente Salón
              </button>
            </div>
          </div>

          <!-- Lista de Salones del Edificio y su estado de revisión -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i class="fa-solid fa-list-ol"></i> Salones en este edificio (${ubsEdificio.length})</h3>
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
        // Reset counters
        Delfos.Estado.tiposEquipo.forEach(t => {
          contadoresEquipos[t.id] = 0;
          const inp = document.getElementById(`stepper-input-${t.id}`);
          if (inp) inp.value = 0;
        });
      } else {
        filaNuevo.style.display = 'none';
        grupoTipo.style.display = 'none';

        // Cargar conteo actual de equipos en el aula seleccionada
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

    guardarYSiguienteSalon: async function() {
      const modo = document.getElementById('rec-modo-aula').value;
      let ubicacionId = modo;
      let nombreSalon = '';

      if (modo === 'nuevo') {
        nombreSalon = document.getElementById('rec-nombre-salon').value.trim();
        const tipoId = document.getElementById('rec-tipo-salon').value;
        const referencia = document.getElementById('rec-referencia-salon').value.trim();

        if (!nombreSalon) {
          Delfos.Utils.showToast('Ingresa el nombre del nuevo salón', 'error');
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

        // Buscar cuántos equipos existen de este tipo para no repetir código
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
      Delfos.Utils.showToast(`¡"${nombreSalon}" revisado con ${equiposNuevos.length} equipos registrados!`, 'success');

      // Pasar inmediatamente al siguiente salón
      this.render(document.getElementById('vista-activa-container'));
    },

    marcarRevisadoSinEquipos: async function() {
      const modo = document.getElementById('rec-modo-aula').value;
      if (modo === 'nuevo') {
        const nombreSalon = document.getElementById('rec-nombre-salon').value.trim();
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
        }
      }

      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast('Salón marcado como revisado (sin equipos)', 'info');
      this.render(document.getElementById('vista-activa-container'));
    },

    generarListaSalones: function(salones) {
      if (!salones || salones.length === 0) {
        return '<p style="padding:1.5rem; text-align:center; color:var(--texto-suave);">No hay salones en este edificio.</p>';
      }

      let html = '<table class="quick-table"><tbody>';
      salones.forEach(u => {
        const tipo = Delfos.Estado.getTipoUbicacion(u.tipoId);
        const equipos = Delfos.Estado.getEquiposPorUbicacion(u.id);
        const revisado = !!u.revisadoEn;

        html += `
          <tr>
            <td style="padding-left:1.5rem;">
              <strong>${Delfos.Utils.escapeHTML(u.nombre)}</strong>
              <div style="font-size:0.78rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(tipo ? tipo.nombre : '')} ${u.referencia ? `(${u.referencia})` : ''}</div>
            </td>
            <td>
              <span style="font-size:0.85rem; font-weight:600;"><i class="fa-solid fa-desktop" style="color:var(--texto-suave);"></i> ${equipos.length} equipos</span>
            </td>
            <td style="text-align:right; padding-right:1.5rem;">
              <span class="badge ${revisado ? 'badge-resuelto' : 'badge-neutral'}">
                ${revisado ? '<i class="fa-solid fa-check"></i> Revisado' : '<i class="fa-regular fa-clock"></i> Pendiente'}
              </span>
            </td>
          </tr>
        `;
      });
      html += '</tbody></table>';
      return html;
    }
  };

  Delfos.Vistas.Recorrido = Recorrido;
})(window.Delfos);
