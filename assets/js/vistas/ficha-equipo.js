/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA/MODAL: FICHA TÉCNICA DEL EQUIPO
 * Información de hardware, ubicación, línea de tiempo cronológica de soportes,
 * contador de incidencias e insignia animada de "Equipo Problemático".
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  const FichaEquipo = {
    /**
     * Abre el modal con la ficha completa del equipo
     */
    abrirFicha: async function(equipoId) {
      const eq = await Delfos.DB.obtener('equipos', equipoId);
      if (!eq) {
        Delfos.Utils.showToast('Equipo no encontrado', 'error');
        return;
      }

      // Asegurar que el modal exista en el DOM
      let modal = document.getElementById('modal-ficha-equipo');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-ficha-equipo';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-dialog modal-lg">
            <div class="modal-header">
              <h3 class="modal-title" id="ficha-modal-title">
                <i class="fa-solid fa-microchip" style="color:var(--verde);"></i> Ficha del Equipo
              </h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('modal-ficha-equipo')">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div class="modal-body" id="ficha-modal-body"></div>
            <div class="modal-footer" id="ficha-modal-footer"></div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      const tipoEq = Delfos.Estado.getTipoEquipo(eq.tipoId);
      const ub = Delfos.Estado.getUbicacion(eq.ubicacionId);
      const edif = ub ? Delfos.Estado.getEdificio(ub.edificioId) : null;

      // Buscar todos los soportes vinculados a este equipo
      const todosSoportes = await Delfos.DB.listar('soportes', s => s.activo !== false);
      const soportesEquipo = todosSoportes.filter(s => Array.isArray(s.equipoIds) && s.equipoIds.includes(equipoId));

      // Ordenar cronológicamente ascendente para la línea de tiempo o descendente
      soportesEquipo.sort((a, b) => {
        const fa = (a.fecha || '') + (a.hora || '');
        const fb = (b.fecha || '') + (b.hora || '');
        return fb.localeCompare(fa); // Más recientes primero
      });

      // Calcular incidencias en los últimos 90 días para el umbral de equipo problemático
      const hoy = new Date();
      const hace90Dias = new Date(hoy.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const incidencias90Dias = soportesEquipo.filter(s => s.fecha >= hace90Dias).length;

      const umbralConfig = parseInt(Delfos.Estado.config.umbralProblematico, 10) || 4;
      const esProblematico = incidencias90Dias >= umbralConfig;

      const iconoClase = tipoEq ? tipoEq.icono : 'fa-desktop';

      const body = document.getElementById('ficha-modal-body');
      body.innerHTML = `
        <!-- Encabezado del Equipo -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; flex-wrap:wrap; gap:1rem;">
          <div style="display:flex; align-items:center; gap:1rem;">
            <div style="width:60px; height:60px; border-radius:var(--radio-md); background:var(--verde-suave); color:var(--verde); display:flex; align-items:center; justify-content:center; font-size:1.8rem; border:1px solid var(--verde-borde);">
              <i class="fa-solid ${iconoClase}"></i>
            </div>
            <div>
              <div style="display:flex; align-items:center; gap:0.6rem;">
                <h3 style="font-size:1.4rem; font-weight:800; color:var(--texto);">${Delfos.Utils.escapeHTML(eq.codigo || 'Sin Código')}</h3>
                ${esProblematico ? `
                  <span class="badge badge-problematico">
                    <i class="fa-solid fa-triangle-exclamation"></i> Equipo Problemático (${incidencias90Dias} en 90d)
                  </span>
                ` : ''}
              </div>
              <p style="font-size:0.88rem; color:var(--texto-suave);">
                ${Delfos.Utils.escapeHTML(tipoEq ? tipoEq.nombre : 'Equipo')} &bull; Ubicado en <strong>${Delfos.Utils.escapeHTML(ub ? ub.nombre : 'Sin asignar')}</strong> (${Delfos.Utils.escapeHTML(edif ? edif.nombre : '')})
              </p>
            </div>
          </div>

          <!-- Contador de Incidencias -->
          <div style="text-align:right;">
            <div style="font-size:1.8rem; font-weight:800; color:${esProblematico ? 'var(--estado-error)' : 'var(--verde)'}; line-height:1;">
              ${soportesEquipo.length}
            </div>
            <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">
              Incidencias Totales
            </span>
          </div>
        </div>

        <!-- Ficha Técnica de Hardware -->
        <div style="background:var(--fondo); border:1px solid var(--borde); border-radius:var(--radio-md); padding:1.25rem; margin-bottom:1.75rem;">
          <h4 style="font-size:0.82rem; font-weight:700; color:var(--texto-suave); text-transform:uppercase; margin-bottom:0.75rem; letter-spacing:0.5px;">
            Datos Técnicos del Dispositivo
          </h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.9rem; font-size:0.88rem;">
            <div>
              <span style="color:var(--texto-suave); font-size:0.78rem;">Marca:</span><br>
              <strong>${Delfos.Utils.escapeHTML(eq.marca || 'N/D')}</strong>
            </div>
            <div>
              <span style="color:var(--texto-suave); font-size:0.78rem;">Modelo:</span><br>
              <strong>${Delfos.Utils.escapeHTML(eq.modelo || 'N/D')}</strong>
            </div>
            <div>
              <span style="color:var(--texto-suave); font-size:0.78rem;">Número de Serie:</span><br>
              <strong>${Delfos.Utils.escapeHTML(eq.serie || 'N/D')}</strong>
            </div>
            <div>
              <span style="color:var(--texto-suave); font-size:0.78rem;">Estado Físico:</span><br>
              <strong style="color:${eq.activo !== false ? 'var(--verde)' : 'var(--texto-suave)'};">${eq.activo !== false ? 'Operativo / En uso' : 'Dado de baja'}</strong>
            </div>
          </div>
          ${eq.notas ? `
            <div style="margin-top:0.75rem; padding-top:0.75rem; border-top:1px dashed var(--borde); font-size:0.84rem; color:var(--texto-suave);">
              <strong>Notas:</strong> ${Delfos.Utils.escapeHTML(eq.notas)}
            </div>
          ` : ''}
        </div>

        <!-- Línea de Tiempo Cronológica -->
        <div>
          <h4 style="font-size:0.95rem; font-weight:800; color:var(--texto); display:flex; align-items:center; gap:0.5rem;">
            <i class="fa-solid fa-timeline" style="color:var(--dorado);"></i>
            Línea de Tiempo de Intervenciones (${soportesEquipo.length})
          </h4>

          ${soportesEquipo.length === 0 ? `
            <div style="text-align:center; padding:2.5rem 1rem; color:var(--texto-suave);">
              <i class="fa-regular fa-calendar-check" style="font-size:2rem; margin-bottom:0.5rem; color:var(--borde);"></i>
              <p>Este equipo no tiene incidencias ni mantenimientos registrados aún.</p>
            </div>
          ` : `
            <div class="timeline">
              ${soportesEquipo.map(s => {
                const cat = Delfos.Estado.getCategoria(s.categoriaId);
                const prob = Delfos.Estado.getProblema(s.problemaId);
                const act = Delfos.Estado.getTipoActividad(s.tipoActividadId);
                const est = Delfos.Estado.getEstado(s.estadoId);

                return `
                  <div class="timeline-item">
                    <div class="timeline-node"></div>
                    <div class="timeline-header">
                      <div>
                        <span class="timeline-date">${Delfos.Utils.formatearFecha(s.fecha)} &bull; ${s.hora || ''}</span>
                        <h5 class="timeline-title">${Delfos.Utils.escapeHTML(cat ? cat.nombre : 'Soporte')}: ${Delfos.Utils.escapeHTML(prob ? prob.nombre : (act ? act.nombre : ''))}</h5>
                      </div>
                      <span class="badge ${est && est.esFinal ? 'badge-resuelto' : 'badge-pendiente'}" style="font-size:0.72rem;">
                        ${Delfos.Utils.escapeHTML(est ? est.nombre : '-')}
                      </span>
                    </div>
                    <div class="timeline-desc">
                      ${s.descripcion ? `<strong>Problema:</strong> ${Delfos.Utils.escapeHTML(s.descripcion)}<br>` : ''}
                      ${s.solucion ? `<strong>Solución:</strong> ${Delfos.Utils.escapeHTML(s.solucion)}` : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      const footer = document.getElementById('ficha-modal-footer');
      footer.innerHTML = `
        <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('modal-ficha-equipo')">Cerrar</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="Delfos.Utils.closeModal('modal-ficha-equipo'); Delfos.Estado.cambiarVista('nuevo-soporte', { equipoId: '${eq.id}', ubicacionId: '${eq.ubicacionId}' })">
          <i class="fa-solid fa-plus"></i> Registrar soporte a este equipo
        </button>
      `;

      Delfos.Utils.openModal('modal-ficha-equipo');
    }
  };

  Delfos.Vistas.FichaEquipo = FichaEquipo;
})(window.Delfos);
