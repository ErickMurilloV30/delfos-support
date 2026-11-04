/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: HISTORIAL DE ACTIVIDADES
 * Tabla/tarjetas responsivas, filtros multicriterio, búsqueda rápida,
 * paginación, modal de detalle, edición, borrado lógico con deshacer y CSV.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let soportesFiltrados = [];
  let paginaActual = 1;
  const itemsPorPagina = 12;

  const Historial = {
    render: async function(container, params = {}) {
      const hoy = new Date();
      const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const hoyISO = Delfos.Utils.fechaHoyISO();

      container.innerHTML = `
        <div class="card" style="margin-bottom:1.5rem;">
          <div class="card-header" style="flex-wrap:wrap;">
            <div>
              <h2 class="card-title"><i class="fa-solid fa-list-check" style="color:var(--verde);"></i> Historial de Soportes</h2>
              <p class="card-subtitle">Consulta, filtra y exporta cada actividad realizada</p>
            </div>
            <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
              <button class="btn btn-sm btn-secondary" onclick="Delfos.Vistas.Historial.exportarCSV()">
                <i class="fa-solid fa-file-csv" style="color:var(--verde);"></i> Exportar a CSV
              </button>
              <button class="btn btn-sm btn-primary" onclick="Delfos.Estado.cambiarVista('nuevo-soporte')">
                <i class="fa-solid fa-plus"></i> Nuevo soporte
              </button>
            </div>
          </div>

          <!-- Barra de Filtros Multicriterio -->
          <div class="card-body" style="background:#FAFAFB; border-bottom:1px solid var(--borde); padding:1.25rem;">
            <!-- Búsqueda rápida de texto libre -->
            <div style="margin-bottom:1rem; position:relative;">
              <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:1rem; top:50%; transform:translateY(-50%); color:var(--texto-suave);"></i>
              <input type="text" id="filtro-texto" class="form-control" style="padding-left:2.6rem;" placeholder="Búsqueda rápida (palabras clave en descripción, solución, código de equipo...)" oninput="Delfos.Vistas.Historial.aplicarFiltros()">
            </div>

            <div class="filter-grid-row">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Desde</label>
                <input type="date" id="filtro-desde" class="form-control form-control-sm" value="${hace30Dias}" onchange="Delfos.Vistas.Historial.aplicarFiltros()">
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Hasta</label>
                <input type="date" id="filtro-hasta" class="form-control form-control-sm" value="${hoyISO}" onchange="Delfos.Vistas.Historial.aplicarFiltros()">
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Edificio</label>
                <select id="filtro-edificio" class="form-select form-control-sm" onchange="Delfos.Vistas.Historial.alCambiarEdificioFiltro()">
                  <option value="">Todos los edificios</option>
                  ${Delfos.Estado.edificios.map(ed => `<option value="${ed.id}">${Delfos.Utils.escapeHTML(ed.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Ubicación</label>
                <select id="filtro-ubicacion" class="form-select form-control-sm" onchange="Delfos.Vistas.Historial.aplicarFiltros()">
                  <option value="">Todas las ubicaciones</option>
                  ${Delfos.Estado.ubicaciones.map(u => `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Categoría</label>
                <select id="filtro-categoria" class="form-select form-control-sm" onchange="Delfos.Vistas.Historial.aplicarFiltros()">
                  <option value="">Todas las categorías</option>
                  ${Delfos.Estado.categorias.map(c => `<option value="${c.id}">${Delfos.Utils.escapeHTML(c.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Actividad</label>
                <select id="filtro-actividad" class="form-select form-control-sm" onchange="Delfos.Vistas.Historial.aplicarFiltros()">
                  <option value="">Todas las actividades</option>
                  ${Delfos.Estado.tiposActividad.map(a => `<option value="${a.id}">${Delfos.Utils.escapeHTML(a.nombre)}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" style="font-size:0.75rem;">Estado</label>
                <select id="filtro-estado" class="form-select form-control-sm" onchange="Delfos.Vistas.Historial.aplicarFiltros()">
                  <option value="">Todos los estados</option>
                  ${Delfos.Estado.estados.map(e => `<option value="${e.id}">${Delfos.Utils.escapeHTML(e.nombre)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:0.75rem;">
              <button class="btn btn-sm btn-secondary" style="font-size:0.75rem; height:32px; min-height:32px;" onclick="Delfos.Vistas.Historial.limpiarFiltros()">
                <i class="fa-solid fa-rotate-left"></i> Restablecer filtros
              </button>
            </div>
          </div>

          <!-- Contenedor Dinámico de la Tabla de Registros -->
          <div id="historial-tabla-wrapper"></div>

          <!-- Paginador -->
          <div id="historial-paginador" class="pagination-bar"></div>
        </div>

        <!-- MODAL DETALLE DE SOPORTE -->
        <div id="modal-detalle-soporte" class="modal-overlay">
          <div class="modal-dialog modal-lg">
            <div class="modal-header">
              <h3 class="modal-title"><i class="fa-solid fa-circle-info" style="color:var(--verde);"></i> Detalle de la Actividad</h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('modal-detalle-soporte')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" id="modal-detalle-soporte-body"></div>
            <div class="modal-footer" id="modal-detalle-soporte-footer"></div>
          </div>
        </div>
      `;

      await this.aplicarFiltros();
    },

    alCambiarEdificioFiltro: function() {
      const edifId = document.getElementById('filtro-edificio').value;
      const ubSelect = document.getElementById('filtro-ubicacion');
      if (!ubSelect) return;

      const ubs = edifId 
        ? Delfos.Estado.ubicaciones.filter(u => u.edificioId === edifId)
        : Delfos.Estado.ubicaciones;

      let html = '<option value="">Todas las ubicaciones</option>';
      ubs.forEach(u => {
        html += `<option value="${u.id}">${Delfos.Utils.escapeHTML(u.nombre)}</option>`;
      });
      ubSelect.innerHTML = html;
      this.aplicarFiltros();
    },

    limpiarFiltros: function() {
      document.getElementById('filtro-texto').value = '';
      document.getElementById('filtro-desde').value = '';
      document.getElementById('filtro-hasta').value = '';
      document.getElementById('filtro-edificio').value = '';
      document.getElementById('filtro-ubicacion').value = '';
      document.getElementById('filtro-categoria').value = '';
      document.getElementById('filtro-actividad').value = '';
      document.getElementById('filtro-estado').value = '';
      this.aplicarFiltros();
    },

    aplicarFiltros: async function() {
      const texto = (document.getElementById('filtro-texto')?.value || '').toLowerCase().trim();
      const desde = document.getElementById('filtro-desde')?.value || '';
      const hasta = document.getElementById('filtro-hasta')?.value || '';
      const edificioId = document.getElementById('filtro-edificio')?.value || '';
      const ubicacionId = document.getElementById('filtro-ubicacion')?.value || '';
      const categoriaId = document.getElementById('filtro-categoria')?.value || '';
      const actividadId = document.getElementById('filtro-actividad')?.value || '';
      const estadoId = document.getElementById('filtro-estado')?.value || '';

      const todos = await Delfos.DB.listar('soportes', s => s.activo !== false);

      soportesFiltrados = todos.filter(s => {
        if (desde && s.fecha < desde) return false;
        if (hasta && s.fecha > hasta) return false;
        if (ubicacionId && s.ubicacionId !== ubicacionId) return false;
        if (categoriaId && s.categoriaId !== categoriaId) return false;
        if (actividadId && s.tipoActividadId !== actividadId) return false;
        if (estadoId && s.estadoId !== estadoId) return false;

        if (edificioId) {
          const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
          if (!ub || ub.edificioId !== edificioId) return false;
        }

        if (texto) {
          const cat = Delfos.Estado.getCategoria(s.categoriaId);
          const prob = Delfos.Estado.getProblema(s.problemaId);
          const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
          const blob = [
            s.descripcion || '',
            s.solucion || '',
            s.observaciones || '',
            cat ? cat.nombre : '',
            prob ? prob.nombre : '',
            ub ? ub.nombre : '',
            s.tecnico || ''
          ].join(' ').toLowerCase();

          // También buscar en códigos de los equipos del soporte
          let coincideEquipo = false;
          if (Array.isArray(s.equipoIds)) {
            for (const eqId of s.equipoIds) {
              const eq = Delfos.Estado.getEquipo(eqId);
              if (eq && (eq.codigo || '').toLowerCase().includes(texto)) {
                coincideEquipo = true;
                break;
              }
            }
          }

          if (!blob.includes(texto) && !coincideEquipo) return false;
        }

        return true;
      });

      // Ordenar por fecha y hora descendente
      soportesFiltrados.sort((a, b) => {
        const fa = (a.fecha || '') + (a.hora || '');
        const fb = (b.fecha || '') + (b.hora || '');
        return fb.localeCompare(fa);
      });

      paginaActual = 1;
      this.renderTabla();
    },

    renderTabla: function() {
      const wrapper = document.getElementById('historial-tabla-wrapper');
      const paginador = document.getElementById('historial-paginador');
      if (!wrapper) return;

      const totalItems = soportesFiltrados.length;
      const totalPaginas = Math.ceil(totalItems / itemsPorPagina) || 1;
      const inicio = (paginaActual - 1) * itemsPorPagina;
      const fin = inicio + itemsPorPagina;
      const paginaItems = soportesFiltrados.slice(inicio, fin);

      if (totalItems === 0) {
        wrapper.innerHTML = `
          <div style="padding:3.5rem 1.5rem; text-align:center;">
            <i class="fa-regular fa-folder-open" style="font-size:2.5rem; color:var(--borde); margin-bottom:1rem;"></i>
            <h4 style="font-weight:700; color:var(--texto-suave);">No se encontraron actividades registradas con estos filtros</h4>
            <p style="font-size:0.85rem; color:var(--texto-suave); margin-top:0.35rem;">Prueba ampliando el rango de fechas o limpiando los criterios de búsqueda.</p>
          </div>
        `;
        paginador.innerHTML = '';
        return;
      }

      let html = `
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Ubicación</th>
                <th>Equipos</th>
                <th>Categoría / Problema</th>
                <th>Actividad</th>
                <th>Estado</th>
                <th style="text-align:right;">Acciones</th>
              </tr>
            </thead>
            <tbody>
      `;

      paginaItems.forEach(s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        const cat = Delfos.Estado.getCategoria(s.categoriaId);
        const prob = Delfos.Estado.getProblema(s.problemaId);
        const act = Delfos.Estado.getTipoActividad(s.tipoActividadId);
        const est = Delfos.Estado.getEstado(s.estadoId);

        let badgeClass = 'badge-neutral';
        if (est && est.esFinal) badgeClass = 'badge-resuelto';
        else if (est && est.id === 'est_proceso') badgeClass = 'badge-proceso';
        else if (est) badgeClass = 'badge-pendiente';

        // Renderizar chips de equipos vinculados
        let equiposHtml = '<span style="color:var(--texto-suave); font-size:0.8rem;">-</span>';
        if (Array.isArray(s.equipoIds) && s.equipoIds.length > 0) {
          equiposHtml = s.equipoIds.slice(0, 3).map(eqId => {
            const eq = Delfos.Estado.getEquipo(eqId);
            const cod = eq ? eq.codigo : 'EQ';
            return `<span class="equipment-pill" style="font-size:0.75rem; padding:0.15rem 0.5rem; cursor:pointer;" onclick="event.stopPropagation(); Delfos.Vistas.FichaEquipo.abrirFicha('${eqId}')">${Delfos.Utils.escapeHTML(cod)}</span>`;
          }).join(' ');

          if (s.equipoIds.length > 3) {
            equiposHtml += ` <span style="font-size:0.75rem; font-weight:700; color:var(--verde);">+${s.equipoIds.length - 3}</span>`;
          }
        }

        html += `
          <tr style="cursor:pointer;" onclick="Delfos.Vistas.Historial.abrirDetalle('${s.id}')">
            <td>
              <strong>${Delfos.Utils.formatearFecha(s.fecha)}</strong><br>
              <span style="font-size:0.78rem; color:var(--texto-suave);"><i class="fa-regular fa-clock"></i> ${s.hora || '-'}</span>
            </td>
            <td>
              <strong>${Delfos.Utils.escapeHTML(ub ? ub.nombre : 'General')}</strong><br>
              <span style="font-size:0.75rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(ub ? (Delfos.Estado.getEdificio(ub.edificioId)?.nombre || '') : '')}</span>
            </td>
            <td>${equiposHtml}</td>
            <td>
              <strong>${Delfos.Utils.escapeHTML(cat ? cat.nombre : '-')}</strong><br>
              <span style="font-size:0.8rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(prob ? prob.nombre : 'Sin especificar')}</span>
            </td>
            <td>
              <span style="font-size:0.85rem; font-weight:600;">${Delfos.Utils.escapeHTML(act ? act.nombre : '-')}</span>
            </td>
            <td>
              <span class="badge ${badgeClass}">${Delfos.Utils.escapeHTML(est ? est.nombre : '-')}</span>
            </td>
            <td style="text-align:right;" onclick="event.stopPropagation();">
              <div style="display:flex; justify-content:flex-end; gap:0.4rem;">
                <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Vistas.Historial.abrirDetalle('${s.id}')" title="Ver detalle">
                  <i class="fa-regular fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-secondary" onclick="Delfos.Estado.cambiarVista('nuevo-soporte', { editarId: '${s.id}' })" title="Editar">
                  <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn btn-sm btn-icon btn-danger" onclick="Delfos.Vistas.Historial.eliminarSoporte('${s.id}')" title="Eliminar">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table></div>';
      wrapper.innerHTML = html;

      // Paginador
      paginador.innerHTML = `
        <span>Mostrando <strong>${inicio + 1}</strong> a <strong>${Math.min(fin, totalItems)}</strong> de <strong>${totalItems}</strong> registros</span>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-sm btn-secondary" ${paginaActual === 1 ? 'disabled style="opacity:0.5;"' : ''} onclick="Delfos.Vistas.Historial.cambiarPagina(${paginaActual - 1})">
            <i class="fa-solid fa-chevron-left"></i> Anterior
          </button>
          <span style="display:flex; align-items:center; padding:0 0.6rem; font-weight:700;">${paginaActual} / ${totalPaginas}</span>
          <button class="btn btn-sm btn-secondary" ${paginaActual >= totalPaginas ? 'disabled style="opacity:0.5;"' : ''} onclick="Delfos.Vistas.Historial.cambiarPagina(${paginaActual + 1})">
            Siguiente <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      `;
    },

    cambiarPagina: function(nuevaPagina) {
      paginaActual = nuevaPagina;
      this.renderTabla();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    },

    abrirDetalle: async function(soporteId) {
      const s = await Delfos.DB.obtener('soportes', soporteId);
      if (!s) return;

      const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
      const edif = ub ? Delfos.Estado.getEdificio(ub.edificioId) : null;
      const cat = Delfos.Estado.getCategoria(s.categoriaId);
      const prob = Delfos.Estado.getProblema(s.problemaId);
      const act = Delfos.Estado.getTipoActividad(s.tipoActividadId);
      const est = Delfos.Estado.getEstado(s.estadoId);

      let badgeClass = 'badge-neutral';
      if (est && est.esFinal) badgeClass = 'badge-resuelto';
      else if (est && est.id === 'est_proceso') badgeClass = 'badge-proceso';
      else if (est) badgeClass = 'badge-pendiente';

      const modalBody = document.getElementById('modal-detalle-soporte-body');
      const modalFooter = document.getElementById('modal-detalle-soporte-footer');

      modalBody.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
          <div>
            <h3 style="font-size:1.25rem; font-weight:800; color:var(--texto);">${Delfos.Utils.escapeHTML(cat ? cat.nombre : 'Soporte Técnico')} &bull; ${Delfos.Utils.escapeHTML(prob ? prob.nombre : 'Incidencia')}</h3>
            <p style="font-size:0.88rem; color:var(--texto-suave); margin-top:0.25rem;">
              <i class="fa-regular fa-calendar"></i> ${Delfos.Utils.formatearFecha(s.fecha)} a las ${s.hora || '-'} | Atendido por: <strong>${Delfos.Utils.escapeHTML(s.tecnico || 'Técnico')}</strong>
            </p>
          </div>
          <div>
            <span class="badge ${badgeClass}" style="font-size:0.9rem; padding:0.4rem 0.9rem;">${Delfos.Utils.escapeHTML(est ? est.nombre : '-')}</span>
          </div>
        </div>

        <div style="background:var(--fondo); border:1px solid var(--borde); border-radius:var(--radio-md); padding:1rem; margin-bottom:1.25rem;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem;">
            <div>
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">Ubicación:</span><br>
              <strong style="color:var(--verde);">${Delfos.Utils.escapeHTML(ub ? ub.nombre : 'Sin especificar')}</strong>
              <div style="font-size:0.8rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(edif ? edif.nombre : '')} ${ub && ub.referencia ? `(${ub.referencia})` : ''}</div>
            </div>
            <div>
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">Tipo de Actividad:</span><br>
              <strong>${Delfos.Utils.escapeHTML(act ? act.nombre : '-')}</strong>
            </div>
          </div>
        </div>

        ${Array.isArray(s.equipoIds) && s.equipoIds.length > 0 ? `
          <div style="margin-bottom:1.25rem;">
            <span style="font-size:0.8rem; font-weight:700; color:var(--texto-suave); text-transform:uppercase;">Equipos Intervenidos (${s.equipoIds.length}):</span>
            <div style="display:flex; flex-wrap:wrap; gap:0.5rem; margin-top:0.4rem;">
              ${s.equipoIds.map(eqId => {
                const eq = Delfos.Estado.getEquipo(eqId);
                const tipoEq = eq ? Delfos.Estado.getTipoEquipo(eq.tipoId) : null;
                const icono = tipoEq ? tipoEq.icono : 'fa-desktop';
                return `
                  <button type="button" class="equipment-pill" style="cursor:pointer;" onclick="Delfos.Utils.closeModal('modal-detalle-soporte'); Delfos.Vistas.FichaEquipo.abrirFicha('${eqId}')">
                    <i class="fa-solid ${icono}"></i> ${Delfos.Utils.escapeHTML(eq ? (eq.codigo + (eq.marca ? ` - ${eq.marca}` : '')) : eqId)}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <div style="margin-bottom:1.25rem;">
          <h4 style="font-size:0.9rem; font-weight:700; color:var(--texto); margin-bottom:0.35rem;"><i class="fa-solid fa-align-left" style="color:var(--dorado); margin-right:0.4rem;"></i>Descripción del Problema</h4>
          <div style="background:var(--tarjeta); border:1px solid var(--borde); border-radius:var(--radio-md); padding:0.9rem; font-size:0.92rem; line-height:1.5;">
            ${Delfos.Utils.escapeHTML(s.descripcion || 'Sin descripción detallada.')}
          </div>
        </div>

        <div style="margin-bottom:1.25rem;">
          <h4 style="font-size:0.9rem; font-weight:700; color:var(--verde); margin-bottom:0.35rem;"><i class="fa-solid fa-wrench" style="margin-right:0.4rem;"></i>Solución Aplicada</h4>
          <div style="background:var(--verde-suave); border:1px solid var(--verde-borde); border-radius:var(--radio-md); padding:0.9rem; font-size:0.92rem; line-height:1.5; color:#0D4221;">
            ${Delfos.Utils.escapeHTML(s.solucion || 'Sin solución especificada.')}
          </div>
        </div>

        ${s.observaciones ? `
          <div>
            <h4 style="font-size:0.9rem; font-weight:700; color:var(--texto-suave); margin-bottom:0.35rem;"><i class="fa-regular fa-comment-dots" style="margin-right:0.4rem;"></i>Observaciones</h4>
            <div style="font-size:0.88rem; color:var(--texto-suave); font-style:italic;">
              ${Delfos.Utils.escapeHTML(s.observaciones)}
            </div>
          </div>
        ` : ''}
      `;

      modalFooter.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('modal-detalle-soporte')">Cerrar</button>
        <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('modal-detalle-soporte'); Delfos.Estado.cambiarVista('nuevo-soporte', { duplicarId: '${s.id}' })">
          <i class="fa-solid fa-clone"></i> Duplicar
        </button>
        <button type="button" class="btn btn-primary btn-sm" onclick="Delfos.Utils.closeModal('modal-detalle-soporte'); Delfos.Estado.cambiarVista('nuevo-soporte', { editarId: '${s.id}' })">
          <i class="fa-solid fa-pen-to-square"></i> Editar Soporte
        </button>
      `;

      Delfos.Utils.openModal('modal-detalle-soporte');
    },

    eliminarSoporte: async function(soporteId) {
      const s = await Delfos.DB.obtener('soportes', soporteId);
      if (!s) return;

      // Borrado lógico para permitir deshacer
      s.activo = false;
      await Delfos.DB.guardar('soportes', s);

      Delfos.Utils.showToast(
        'Soporte eliminado del historial',
        'info',
        5000,
        'Deshacer',
        async () => {
          s.activo = true;
          await Delfos.DB.guardar('soportes', s);
          Delfos.Utils.showToast('Soporte restaurado', 'success');
          Delfos.Vistas.Historial.aplicarFiltros();
        }
      );

      this.aplicarFiltros();
    },

    exportarCSV: function() {
      if (soportesFiltrados.length === 0) {
        Delfos.Utils.showToast('No hay datos filtrados para exportar', 'info');
        return;
      }

      const encabezados = [
        'ID',
        'Fecha',
        'Hora',
        'Edificio',
        'Ubicacion',
        'Equipos',
        'Categoria',
        'Problema',
        'Actividad',
        'Estado',
        'Descripcion',
        'Solucion',
        'Observaciones',
        'Tecnico'
      ];

      const filas = soportesFiltrados.map(s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        const edif = ub ? Delfos.Estado.getEdificio(ub.edificioId) : null;
        const cat = Delfos.Estado.getCategoria(s.categoriaId);
        const prob = Delfos.Estado.getProblema(s.problemaId);
        const act = Delfos.Estado.getTipoActividad(s.tipoActividadId);
        const est = Delfos.Estado.getEstado(s.estadoId);

        let equiposTexto = '';
        if (Array.isArray(s.equipoIds)) {
          equiposTexto = s.equipoIds.map(eqId => {
            const eq = Delfos.Estado.getEquipo(eqId);
            return eq ? eq.codigo : eqId;
          }).join(', ');
        }

        return [
          s.id,
          s.fecha,
          s.hora || '',
          edif ? edif.nombre : '',
          ub ? ub.nombre : '',
          equiposTexto,
          cat ? cat.nombre : '',
          prob ? prob.nombre : '',
          act ? act.nombre : '',
          est ? est.nombre : '',
          s.descripcion || '',
          s.solucion || '',
          s.observaciones || '',
          s.tecnico || ''
        ];
      });

      const nombreArchivo = `delfos-soportes-${Delfos.Utils.fechaHoyISO()}.csv`;
      Delfos.Utils.exportarACSV(nombreArchivo, encabezados, filas);
      Delfos.Utils.showToast(`Se exportaron ${filas.length} registros a CSV`, 'success');
    }
  };

  Delfos.Vistas.Historial = Historial;
})(window.Delfos);
