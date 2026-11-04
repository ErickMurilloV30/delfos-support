/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: INVENTARIO DE EQUIPOS Y UBICACIONES
 * Administración de dispositivos, alta masiva por rango (ej: PC-01 a PC-30),
 * mover entre salones, dar de baja con preservación de historial.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let inventarioFiltrado = [];

  const Inventario = {
    render: async function(container) {
      const todosEquipos = await Delfos.DB.listar('equipos');

      container.innerHTML = `
        <div class="card" style="margin-bottom:1.5rem;">
          <div class="card-header" style="flex-wrap:wrap;">
            <div>
              <h2 class="card-title"><i class="fa-solid fa-boxes-stacked" style="color:var(--verde);"></i> Inventario de Equipos</h2>
              <p class="card-subtitle">Administra los equipos tecnológicos de la institución</p>
            </div>
            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
              <button class="btn btn-sm btn-dorado" onclick="Delfos.Estado.cambiarVista('recorrido')">
                <i class="fa-solid fa-person-walking-arrow-right"></i> Ir a Modo Recorrido
              </button>
              <button class="btn btn-sm btn-secondary" onclick="Delfos.Vistas.Inventario.abrirModalAltaMasiva()">
                <i class="fa-solid fa-layer-group"></i> Alta Masiva
              </button>
              <button class="btn btn-sm btn-primary" onclick="Delfos.Vistas.Inventario.abrirModalNuevoEquipo()">
                <i class="fa-solid fa-plus"></i> Nuevo Equipo
              </button>
            </div>
          </div>

          <!-- Barra de Filtros de Inventario -->
          <div class="card-body" style="background:#FAFAFB; border-bottom:1px solid var(--borde); padding:1rem 1.5rem;">
            <div class="filter-grid-row">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Búsqueda</label>
                <input type="text" id="inv-filtro-texto" class="form-control form-control-sm" placeholder="Código, marca, modelo o serie..." oninput="Delfos.Vistas.Inventario.filtrar()">
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Edificio</label>
                <select id="inv-filtro-edificio" class="form-select form-control-sm" onchange="Delfos.Vistas.Inventario.alCambiarEdificio()">
                  <option value="">Todos los edificios</option>
                  ${Delfos.Estado.edificios.map(ed => `<option value="${ed.id}">${Delfos.Utils.escapeHTML(ed.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Ubicación</label>
                <select id="inv-filtro-ubicacion" class="form-select form-control-sm" onchange="Delfos.Vistas.Inventario.filtrar()">
                  <option value="">Todas las ubicaciones</option>
                  ${Delfos.Estado.ubicaciones.map(u => `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Tipo de Equipo</label>
                <select id="inv-filtro-tipo" class="form-select form-control-sm" onchange="Delfos.Vistas.Inventario.filtrar()">
                  <option value="">Todos los tipos</option>
                  ${Delfos.Estado.tiposEquipo.map(te => `<option value="${te.id}">${Delfos.Utils.escapeHTML(te.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Estado</label>
                <select id="inv-filtro-estado" class="form-select form-control-sm" onchange="Delfos.Vistas.Inventario.filtrar()">
                  <option value="activos" selected>Solo Operativos</option>
                  <option value="bajas">Dados de baja</option>
                  <option value="todos">Todos los equipos</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Contenedor de la Tabla de Equipos -->
          <div id="inventario-tabla-wrapper"></div>
        </div>

        <!-- MODAL: ALTA INDIVIDUAL / EDITAR EQUIPO -->
        <div id="modal-equipo-form" class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="modal-title" id="modal-eq-form-title"><i class="fa-solid fa-desktop" style="color:var(--verde);"></i> Equipo</h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('modal-equipo-form')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
              <input type="hidden" id="form-eq-id">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tipo de Equipo <span class="obligatorio">Obligatorio</span></label>
                  <select id="form-eq-tipo" class="form-select" onchange="Delfos.Vistas.Inventario.sugerirCodigo()">
                    ${Delfos.Estado.tiposEquipo.map(te => `<option value="${te.id}">${Delfos.Utils.escapeHTML(te.nombre)} (${te.prefijo})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Código del Equipo <span class="obligatorio">Obligatorio</span></label>
                  <input type="text" id="form-eq-codigo" class="form-control" placeholder="Ej: PC-01">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Ubicación Actual <span class="obligatorio">Obligatorio</span></label>
                <select id="form-eq-ubicacion" class="form-select">
                  ${Delfos.Estado.ubicaciones.map(u => `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)} (${Delfos.Estado.getEdificio(u.edificioId)?.nombre || ''})</option>`).join('')}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Marca</label>
                  <input type="text" id="form-eq-marca" class="form-control" placeholder="Ej: HP, Dell, Epson">
                </div>
                <div class="form-group">
                  <label class="form-label">Modelo</label>
                  <input type="text" id="form-eq-modelo" class="form-control" placeholder="Ej: ProDesk 400">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Número de Serie</label>
                <input type="text" id="form-eq-serie" class="form-control" placeholder="Serial de fábrica">
              </div>

              <div class="form-group">
                <label class="form-label">Notas u observaciones</label>
                <input type="text" id="form-eq-notas" class="form-control" placeholder="Detalles de hardware, garantía, etc.">
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('modal-equipo-form')">Cancelar</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="Delfos.Vistas.Inventario.guardarEquipo()">Guardar Equipo</button>
            </div>
          </div>
        </div>

        <!-- MODAL: ALTA MASIVA POR RANGO (ej: PC-01 a PC-30) -->
        <div id="modal-alta-masiva" class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="modal-title"><i class="fa-solid fa-layer-group" style="color:var(--verde);"></i> Creación Masiva de Equipos</h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('modal-alta-masiva')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body">
              <p style="font-size:0.88rem; color:var(--texto-suave); margin-bottom:1.25rem;">
                Ideal para laboratorios nuevos. Genera múltiples equipos consecutivos de una sola vez.
              </p>

              <div class="form-group">
                <label class="form-label">Ubicación destino <span class="obligatorio">Obligatorio</span></label>
                <select id="masiva-ubicacion" class="form-select">
                  ${Delfos.Estado.ubicaciones.map(u => `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)} (${Delfos.Estado.getEdificio(u.edificioId)?.nombre || ''})</option>`).join('')}
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Tipo de equipo</label>
                  <select id="masiva-tipo" class="form-select" onchange="Delfos.Vistas.Inventario.actualizarPrefijoMasivo()">
                    ${Delfos.Estado.tiposEquipo.map(te => `<option value="${te.id}" data-prefijo="${te.prefijo}">${Delfos.Utils.escapeHTML(te.nombre)} (${te.prefijo})</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Prefijo del código</label>
                  <input type="text" id="masiva-prefijo" class="form-control" value="PC">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Desde número</label>
                  <input type="number" id="masiva-desde" class="form-control" value="1" min="1" max="999">
                </div>
                <div class="form-group">
                  <label class="form-label">Hasta número</label>
                  <input type="number" id="masiva-hasta" class="form-control" value="20" min="1" max="999">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Marca (opcional)</label>
                  <input type="text" id="masiva-marca" class="form-control" placeholder="Ej: Dell">
                </div>
                <div class="form-group">
                  <label class="form-label">Modelo (opcional)</label>
                  <input type="text" id="masiva-modelo" class="form-control" placeholder="Ej: OptiPlex 3080">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('modal-alta-masiva')">Cancelar</button>
              <button type="button" class="btn btn-primary btn-sm" onclick="Delfos.Vistas.Inventario.ejecutarAltaMasiva()">Generar Equipos</button>
            </div>
          </div>
        </div>
      `;

      await this.filtrar();
    },

    alCambiarEdificio: function() {
      const edifId = document.getElementById('inv-filtro-edificio').value;
      const ubSelect = document.getElementById('inv-filtro-ubicacion');
      if (!ubSelect) return;

      const ubs = edifId 
        ? Delfos.Estado.ubicaciones.filter(u => u.edificioId === edifId)
        : Delfos.Estado.ubicaciones;

      let html = '<option value="">Todas las ubicaciones</option>';
      ubs.forEach(u => {
        html += `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)}</option>`;
      });
      ubSelect.innerHTML = html;
      this.filtrar();
    },

    filtrar: async function() {
      const texto = (document.getElementById('inv-filtro-texto')?.value || '').toLowerCase().trim();
      const edificioId = document.getElementById('inv-filtro-edificio')?.value || '';
      const ubicacionId = document.getElementById('inv-filtro-ubicacion')?.value || '';
      const tipoId = document.getElementById('inv-filtro-tipo')?.value || '';
      const estadoFiltro = document.getElementById('inv-filtro-estado')?.value || 'activos';

      const todos = await Delfos.DB.listar('equipos');

      inventarioFiltrado = todos.filter(eq => {
        if (estadoFiltro === 'activos' && eq.activo === false) return false;
        if (estadoFiltro === 'bajas' && eq.activo !== false) return false;

        if (ubicacionId && eq.ubicacionId !== ubicacionId) return false;
        if (tipoId && eq.tipoId !== tipoId) return false;

        if (edificioId) {
          const ub = Delfos.Estado.getUbicacion(eq.ubicacionId);
          if (!ub || ub.edificioId !== edificioId) return false;
        }

        if (texto) {
          const blob = [
            eq.codigo || '',
            eq.marca || '',
            eq.modelo || '',
            eq.serie || '',
            eq.notas || ''
          ].join(' ').toLowerCase();
          if (!blob.includes(texto)) return false;
        }

        return true;
      });

      this.renderTabla();
    },

    renderTabla: function() {
      const wrapper = document.getElementById('inventario-tabla-wrapper');
      if (!wrapper) return;

      if (inventarioFiltrado.length === 0) {
        wrapper.innerHTML = `
          <div style="padding:3.5rem 1.5rem; text-align:center;">
            <i class="fa-solid fa-boxes-packing" style="font-size:2.5rem; color:var(--borde); margin-bottom:1rem;"></i>
            <h4 style="font-weight:700; color:var(--texto-suave);">No hay equipos que coincidan con los criterios</h4>
          </div>
        `;
        return;
      }

      let html = `
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Código / Tipo</th>
                <th>Ubicación</th>
                <th>Marca y Modelo</th>
                <th>Serie</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
      `;

      inventarioFiltrado.forEach(eq => {
        const tipoEq = Delfos.Estado.getTipoEquipo(eq.tipoId);
        const ub = Delfos.Estado.getUbicacion(eq.ubicacionId);
        const edif = ub ? Delfos.Estado.getEdificio(ub.edificioId) : null;
        const icono = tipoEq ? tipoEq.icono : 'fa-desktop';

        html += `
          <tr style="cursor:pointer;" onclick="Delfos.Vistas.FichaEquipo.abrirFicha('${eq.id}')">
            <td>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <i class="fa-solid ${icono}" style="color:var(--verde); font-size:1.1rem;"></i>
                <div>
                  <strong>${Delfos.Utils.escapeHTML(eq.codigo || 'S/C')}</strong><br>
                  <span style="font-size:0.75rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(tipoEq ? tipoEq.nombre : 'Equipo')}</span>
                </div>
              </div>
            </td>
            <td>
              <strong>${Delfos.Utils.escapeHTML(ub ? ub.nombre : 'Sin asignar')}</strong><br>
              <span style="font-size:0.75rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(edif ? edif.nombre : '')}</span>
            </td>
            <td>
              <span>${Delfos.Utils.escapeHTML(eq.marca || '-')}</span> ${eq.modelo ? `<span style="color:var(--texto-suave); font-size:0.8rem;">(${Delfos.Utils.escapeHTML(eq.modelo)})</span>` : ''}
            </td>
            <td><code style="font-size:0.82rem;">${Delfos.Utils.escapeHTML(eq.serie || '-')}</code></td>
            <td>
              <span class="badge ${eq.activo !== false ? 'badge-resuelto' : 'badge-neutral'}">
                ${eq.activo !== false ? 'Operativo' : 'De baja'}
              </span>
            </td>
            <td style="text-align:right;" onclick="event.stopPropagation();">
              <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
                <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.FichaEquipo.abrirFicha('${eq.id}')" title="Ver ficha técnica">
                  <i class="fa-solid fa-id-card"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Inventario.abrirModalEditarEquipo('${eq.id}')" title="Editar">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                ${eq.activo !== false ? `
                  <button class="btn btn-sm btn-icon btn-danger" onclick="Delfos.Vistas.Inventario.darDeBaja('${eq.id}')" title="Dar de baja">
                    <i class="fa-solid fa-arrow-down-long"></i>
                  </button>
                ` : `
                  <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Inventario.reactivarEquipo('${eq.id}')" title="Reactivar">
                    <i class="fa-solid fa-arrow-rotate-left"></i>
                  </button>
                `}
                <button class="btn btn-sm btn-icon btn-danger" onclick="Delfos.Vistas.Inventario.eliminarEquipoSiSinHistorial('${eq.id}')" title="Eliminar definitivamente">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table></div>';
      wrapper.innerHTML = html;
    },

    abrirModalNuevoEquipo: function() {
      document.getElementById('modal-eq-form-title').innerHTML = '<i class="fa-solid fa-desktop" style="color:var(--verde);"></i> Nuevo Equipo';
      document.getElementById('form-eq-id').value = '';
      document.getElementById('form-eq-codigo').value = '';
      document.getElementById('form-eq-marca').value = '';
      document.getElementById('form-eq-modelo').value = '';
      document.getElementById('form-eq-serie').value = '';
      document.getElementById('form-eq-notas').value = '';
      this.sugerirCodigo();
      Delfos.Utils.openModal('modal-equipo-form');
    },

    abrirModalEditarEquipo: async function(equipoId) {
      const eq = await Delfos.DB.obtener('equipos', equipoId);
      if (!eq) return;

      document.getElementById('modal-eq-form-title').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color:var(--verde);"></i> Editar Equipo';
      document.getElementById('form-eq-id').value = eq.id;
      document.getElementById('form-eq-tipo').value = eq.tipoId;
      document.getElementById('form-eq-codigo').value = eq.codigo || '';
      document.getElementById('form-eq-ubicacion').value = eq.ubicacionId;
      document.getElementById('form-eq-marca').value = eq.marca || '';
      document.getElementById('form-eq-modelo').value = eq.modelo || '';
      document.getElementById('form-eq-serie').value = eq.serie || '';
      document.getElementById('form-eq-notas').value = eq.notas || '';

      Delfos.Utils.openModal('modal-equipo-form');
    },

    sugerirCodigo: async function() {
      const idExistente = document.getElementById('form-eq-id').value;
      if (idExistente) return; // Si estamos editando, no sobreescribir

      const tipoId = document.getElementById('form-eq-tipo').value;
      const tipo = Delfos.Estado.getTipoEquipo(tipoId);
      const prefijo = tipo ? tipo.prefijo : 'EQ';

      const equipos = await Delfos.DB.listar('equipos', e => e.tipoId === tipoId);
      const siguienteNum = equipos.length + 1;
      document.getElementById('form-eq-codigo').value = `${prefijo}-${String(siguienteNum).padStart(2, '0')}`;
    },

    guardarEquipo: async function() {
      const id = document.getElementById('form-eq-id').value;
      const tipoId = document.getElementById('form-eq-tipo').value;
      const codigo = document.getElementById('form-eq-codigo').value.trim();
      const ubicacionId = document.getElementById('form-eq-ubicacion').value;
      const marca = document.getElementById('form-eq-marca').value.trim();
      const modelo = document.getElementById('form-eq-modelo').value.trim();
      const serie = document.getElementById('form-eq-serie').value.trim();
      const notas = document.getElementById('form-eq-notas').value.trim();

      if (!codigo) {
        Delfos.Utils.showToast('El código del equipo es obligatorio', 'error');
        return;
      }

      const eq = {
        tipoId: tipoId,
        codigo: codigo,
        ubicacionId: ubicacionId,
        marca: marca,
        modelo: modelo,
        serie: serie,
        notas: notas,
        activo: true
      };

      if (id) {
        eq.id = id;
      }

      await Delfos.DB.guardar('equipos', eq);
      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.closeModal('modal-equipo-form');
      Delfos.Utils.showToast(`Equipo "${codigo}" guardado correctamente`, 'success');
      this.filtrar();
    },

    darDeBaja: async function(equipoId) {
      const eq = await Delfos.DB.obtener('equipos', equipoId);
      if (!eq) return;

      eq.activo = false;
      await Delfos.DB.guardar('equipos', eq);
      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast(`Equipo "${eq.codigo}" dado de baja (su historial permanece intacto)`, 'info');
      this.filtrar();
    },

    reactivarEquipo: async function(equipoId) {
      const eq = await Delfos.DB.obtener('equipos', equipoId);
      if (!eq) return;

      eq.activo = true;
      await Delfos.DB.guardar('equipos', eq);
      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.showToast(`Equipo "${eq.codigo}" reactivado`, 'success');
      this.filtrar();
    },

    eliminarEquipoSiSinHistorial: async function(equipoId) {
      const todosSoportes = await Delfos.DB.listar('soportes');
      const tieneHistorial = todosSoportes.some(s => Array.isArray(s.equipoIds) && s.equipoIds.includes(equipoId));

      if (tieneHistorial) {
        Delfos.Utils.showToast('No se puede eliminar: el equipo tiene historial de soportes. Usa "Dar de baja" para preservar la integridad.', 'error');
        return;
      }

      if (confirm('¿Estás seguro de eliminar este equipo? No tiene historial registrado.')) {
        await Delfos.DB.eliminar('equipos', equipoId);
        await Delfos.Estado.recargarCatalogos();
        Delfos.Utils.showToast('Equipo eliminado', 'success');
        this.filtrar();
      }
    },

    abrirModalAltaMasiva: function() {
      this.actualizarPrefijoMasivo();
      Delfos.Utils.openModal('modal-alta-masiva');
    },

    actualizarPrefijoMasivo: function() {
      const select = document.getElementById('masiva-tipo');
      if (!select) return;
      const opt = select.options[select.selectedIndex];
      const prefijo = opt ? opt.dataset.prefijo : 'PC';
      document.getElementById('masiva-prefijo').value = prefijo;
    },

    ejecutarAltaMasiva: async function() {
      const ubicacionId = document.getElementById('masiva-ubicacion').value;
      const tipoId = document.getElementById('masiva-tipo').value;
      const prefijo = document.getElementById('masiva-prefijo').value.trim() || 'PC';
      const desde = parseInt(document.getElementById('masiva-desde').value, 10);
      const hasta = parseInt(document.getElementById('masiva-hasta').value, 10);
      const marca = document.getElementById('masiva-marca').value.trim();
      const modelo = document.getElementById('masiva-modelo').value.trim();

      if (isNaN(desde) || isNaN(hasta) || desde > hasta) {
        Delfos.Utils.showToast('Rango de números no válido', 'error');
        return;
      }

      const cantidad = hasta - desde + 1;
      if (cantidad > 100) {
        Delfos.Utils.showToast('El límite por lote es de 100 equipos a la vez', 'error');
        return;
      }

      const nuevos = [];
      for (let i = desde; i <= hasta; i++) {
        const codigo = `${prefijo}-${String(i).padStart(2, '0')}`;
        nuevos.push({
          tipoId: tipoId,
          codigo: codigo,
          ubicacionId: ubicacionId,
          marca: marca,
          modelo: modelo,
          serie: '',
          notas: 'Creado en alta masiva',
          activo: true
        });
      }

      await Delfos.DB.guardarLote('equipos', nuevos);
      await Delfos.Estado.recargarCatalogos();
      Delfos.Utils.closeModal('modal-alta-masiva');
      Delfos.Utils.showToast(`Se crearon con éxito ${cantidad} equipos (${prefijo}-${String(desde).padStart(2,'0')} a ${prefijo}-${String(hasta).padStart(2,'0')})`, 'success');
      this.filtrar();
    }
  };

  Delfos.Vistas.Inventario = Inventario;
})(window.Delfos);
