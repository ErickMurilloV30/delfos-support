/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: GENERADOR DE INFORMES MENSUALES Y ANUALES
 * Resumen ejecutivo en lenguaje natural automático, vista previa en pantalla,
 * captura de gráficas Chart.js a imagen (toDataURL), exportación a PDF (jsPDF)
 * y a PowerPoint .pptx (PptxGenJS), e historial de informes generados.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let informeActualDatos = null;
  let chartReporteInstancia = null;

  const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const Informes = {
    render: async function(container) {
      const hoy = new Date();
      const mesActual = hoy.getMonth();
      const añoActual = hoy.getFullYear();

      // Cargar historial de informes previos
      const historialInformes = await Delfos.DB.listar('informesGenerados');
      historialInformes.sort((a, b) => (b.fechaGeneracion || '').localeCompare(a.fechaGeneracion || ''));

      container.innerHTML = `
        <div style="max-width:1050px; margin:0 auto;">
          <!-- Panel de Selección de Periodo para el Informe -->
          <div class="card" style="margin-bottom:2rem; padding:1.75rem;">
            <div class="card-header" style="padding:0 0 1.25rem 0; border-bottom:1px solid var(--borde); margin-bottom:1.5rem;">
              <div>
                <h2 class="card-title"><i class="fa-solid fa-file-contract" style="color:var(--verde);"></i> Generador de Informes Técnicos</h2>
                <p class="card-subtitle">Produce informes mensuales o anuales listos para Dirección en PDF y PowerPoint</p>
              </div>
            </div>

            <div class="form-row" style="align-items:flex-end;">
              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Tipo de Informe</label>
                <select id="rep-tipo" class="form-select" onchange="Delfos.Vistas.Informes.alCambiarTipoInforme()">
                  <option value="mensual" selected>Informe Mensual</option>
                  <option value="anual">Informe Anual</option>
                </select>
              </div>

              <div class="form-group" id="rep-grupo-mes" style="margin-bottom:0;">
                <label class="form-label">Mes a Evaluar</label>
                <select id="rep-mes" class="form-select">
                  ${NOMBRES_MESES.map((m, i) => `<option value="${i}" ${i === mesActual ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
              </div>

              <div class="form-group" style="margin-bottom:0;">
                <label class="form-label">Año</label>
                <select id="rep-año" class="form-select">
                  <option value="${añoActual}" selected>${añoActual}</option>
                  <option value="${añoActual - 1}">${añoActual - 1}</option>
                  <option value="${añoActual - 2}">${añoActual - 2}</option>
                </select>
              </div>

              <div>
                <button type="button" class="btn btn-primary" style="height:48px; width:100%;" onclick="Delfos.Vistas.Informes.generarInforme()">
                  <i class="fa-solid fa-arrows-rotate"></i> Generar Informe
                </button>
              </div>
            </div>
          </div>

          <!-- Área de Vista Previa del Informe (Hoja de Trabajo) -->
          <div id="informe-preview-container" style="display:none;"></div>

          <!-- Historial de Informes Generados Previamente -->
          <div class="card" style="margin-top:2rem;">
            <div class="card-header">
              <h3 class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Historial de Informes Emitidos</h3>
            </div>
            <div class="card-body" style="padding:0;">
              ${this.generarTablaHistorialInformes(historialInformes)}
            </div>
          </div>
        </div>
      `;
    },

    alCambiarTipoInforme: function() {
      const tipo = document.getElementById('rep-tipo').value;
      const grupoMes = document.getElementById('rep-grupo-mes');
      if (grupoMes) {
        grupoMes.style.display = tipo === 'anual' ? 'none' : 'block';
      }
    },

    generarInforme: async function() {
      const tipo = document.getElementById('rep-tipo').value;
      const mesIndex = parseInt(document.getElementById('rep-mes').value, 10);
      const año = parseInt(document.getElementById('rep-año').value, 10);

      let inicioIso = '', finIso = '', etiquetaPeriodo = '';

      if (tipo === 'mensual') {
        const mStr = String(mesIndex + 1).padStart(2, '0');
        const ultimoDia = new Date(año, mesIndex + 1, 0).getDate();
        inicioIso = `${año}-${mStr}-01`;
        finIso = `${año}-${mStr}-${String(ultimoDia).padStart(2, '0')}`;
        etiquetaPeriodo = `${NOMBRES_MESES[mesIndex]} de ${año}`;
      } else {
        inicioIso = `${año}-01-01`;
        finIso = `${año}-12-31`;
        etiquetaPeriodo = `Año ${año}`;
      }

      // Cargar soportes del periodo
      const todos = await Delfos.DB.listar('soportes', s => s.activo !== false);
      const soportes = todos.filter(s => s.fecha >= inicioIso && s.fecha <= finIso);

      // Calcular métricas
      const tiposActividad = Delfos.Estado.tiposActividad;
      const idsMantenimiento = tiposActividad.filter(a => a.esMantenimiento).map(a => a.id);
      const idsInstalacion = tiposActividad.filter(a => a.esInstalacion).map(a => a.id);

      const totalSoportes = soportes.length;
      const totalMantenimientos = soportes.filter(s => idsMantenimiento.includes(s.tipoActividadId)).length;
      const totalInstalaciones = soportes.filter(s => idsInstalacion.includes(s.tipoActividadId)).length;
      const totalResueltos = soportes.filter(s => {
        const e = Delfos.Estado.getEstado(s.estadoId);
        return e && e.esFinal;
      }).length;

      const tasaResolucion = totalSoportes > 0 ? Math.round((totalResueltos / totalSoportes) * 100) : 100;

      // Equipos atendidos distintos
      const equiposAtendidosIds = new Set();
      soportes.forEach(s => {
        if (Array.isArray(s.equipoIds)) s.equipoIds.forEach(id => equiposAtendidosIds.add(id));
      });

      // Top Categoría
      const catCounts = {};
      soportes.forEach(s => {
        const c = Delfos.Estado.getCategoria(s.categoriaId);
        const nom = c ? c.nombre : 'Otras';
        catCounts[nom] = (catCounts[nom] || 0) + 1;
      });
      const topCatArr = Object.entries(catCounts).sort((a,b) => b[1] - a[1]);
      const topCatNom = topCatArr.length > 0 ? topCatArr[0][0] : 'N/D';
      const topCatCant = topCatArr.length > 0 ? topCatArr[0][1] : 0;

      // Top Problema
      const probCounts = {};
      soportes.forEach(s => {
        const p = Delfos.Estado.getProblema(s.problemaId);
        const nom = p ? p.nombre : 'General';
        probCounts[nom] = (probCounts[nom] || 0) + 1;
      });
      const topProbArr = Object.entries(probCounts).sort((a,b) => b[1] - a[1]);
      const topProbNom = topProbArr.length > 0 ? topProbArr[0][0] : 'N/D';

      // Top Ubicación
      const ubCounts = {};
      soportes.forEach(s => {
        const u = Delfos.Estado.getUbicacion(s.ubicacionId);
        const nom = u ? u.nombre : 'General';
        ubCounts[nom] = (ubCounts[nom] || 0) + 1;
      });
      const topUbArr = Object.entries(ubCounts).sort((a,b) => b[1] - a[1]);
      const topUbNom = topUbArr.length > 0 ? topUbArr[0][0] : 'N/D';

      // Top Equipos Problemáticos en el periodo
      const eqCounts = {};
      soportes.forEach(s => {
        if (Array.isArray(s.equipoIds)) {
          s.equipoIds.forEach(id => {
            eqCounts[id] = (eqCounts[id] || 0) + 1;
          });
        }
      });
      const topEquiposProblema = Object.entries(eqCounts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([eqId, count]) => {
          const eq = Delfos.Estado.getEquipo(eqId);
          const ub = eq ? Delfos.Estado.getUbicacion(eq.ubicacionId) : null;
          return {
            id: eqId,
            codigo: eq ? eq.codigo : eqId,
            ubicacion: ub ? ub.nombre : 'Sin ubicación',
            cantidad: count
          };
        });

      // Nombre del técnico e institución
      const institucion = Delfos.Estado.config.institucion || 'Unidad Educativa Delfos';
      const tecnico = Delfos.Estado.config.tecnico || 'Técnico de Soporte';
      const logoBase64 = Delfos.Estado.config.logoBase64 || null;

      // Generar Resumen Ejecutivo en lenguaje claro automático
      const resumenEjecutivoTexto = this.redactarResumenEjecutivo({
        etiquetaPeriodo,
        institucion,
        totalSoportes,
        tasaResolucion,
        topCatNom,
        topCatCant,
        topProbNom,
        topUbNom,
        totalMantenimientos,
        totalInstalaciones,
        totalEquiposAtendidos: equiposAtendidosIds.size
      });

      // Guardar objeto en memoria para exportación
      informeActualDatos = {
        tipo,
        etiquetaPeriodo,
        fechaGeneracion: new Date().toISOString(),
        institucion,
        tecnico,
        logoBase64,
        totalSoportes,
        totalMantenimientos,
        totalInstalaciones,
        totalResueltos,
        tasaResolucion,
        totalEquiposAtendidos: equiposAtendidosIds.size,
        topCatNom,
        topProbNom,
        topUbNom,
        topEquiposProblema,
        resumenEjecutivoTexto,
        soportes,
        catCounts
      };

      // Guardar en la base de datos el historial del informe
      await Delfos.DB.guardar('informesGenerados', {
        tipo,
        periodo: etiquetaPeriodo,
        fechaGeneracion: new Date().toISOString(),
        resumen: resumenEjecutivoTexto,
        totalSoportes: totalSoportes,
        tecnico: tecnico
      });

      this.renderPreview();
    },

    redactarResumenEjecutivo: function(d) {
      if (d.totalSoportes === 0) {
        return `Durante el periodo correspondiente a ${d.etiquetaPeriodo}, no se registraron solicitudes de soporte técnico correctivo ni mantenimientos preventivos en los sistemas de información de ${d.institucion}. Todas las estaciones de trabajo y periféricos se mantuvieron en estado operacional.`;
      }

      return `En el transcurso de ${d.etiquetaPeriodo}, el área de Soporte Técnico de ${d.institucion} atendió un total de ${d.totalSoportes} requerimientos e incidencias tecnológicas, alcanzando una tasa de efectividad y resolución del ${d.tasaResolucion}%. ` +
        `La categoría con mayor índice de intervención fue "${d.topCatNom}" con ${d.topCatCant} incidencias registradas, siendo el síntoma más recurrente "${d.topProbNom}". ` +
        `En cuanto a distribución física, la mayor demanda de asistencia se concentró en "${d.topUbNom}". ` +
        `Asimismo, se ejecutaron ${d.totalMantenimientos} jornadas de mantenimiento preventivo y ${d.totalInstalaciones} adecuaciones/instalaciones de nuevos dispositivos, brindando cobertura técnica a ${d.totalEquiposAtendidos} equipos tecnológicos distintos.`;
    },

    renderPreview: function() {
      const container = document.getElementById('informe-preview-container');
      if (!container || !informeActualDatos) return;

      const d = informeActualDatos;

      container.style.display = 'block';
      container.innerHTML = `
        <!-- Botonera de Exportación -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem; background:var(--tarjeta); padding:1.25rem 1.5rem; border:1px solid var(--borde); border-radius:var(--radio-lg); box-shadow:var(--sombra-sm);">
          <div>
            <span class="badge badge-resuelto"><i class="fa-solid fa-check"></i> Informe listo para emitir</span>
            <span style="font-size:0.88rem; color:var(--texto-suave); margin-left:0.5rem;">Periodo: <strong>${d.etiquetaPeriodo}</strong></span>
          </div>
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            <button type="button" class="btn btn-secondary" onclick="Delfos.Vistas.Informes.exportarPPTX()">
              <i class="fa-solid fa-file-powerpoint" style="color:#D24726;"></i> Exportar a PowerPoint (.pptx)
            </button>
            <button type="button" class="btn btn-primary" onclick="Delfos.Vistas.Informes.exportarPDF()">
              <i class="fa-solid fa-file-pdf" style="color:#FFFFFF;"></i> Exportar a PDF Oficial
            </button>
          </div>
        </div>

        <!-- Hoja de Informe (Estilo Documento Institucional) -->
        <div class="report-paper-sheet" id="hoja-informe-impresion">
          <!-- Encabezado del Documento -->
          <div class="report-header-banner">
            <div style="display:flex; align-items:center; gap:1.25rem;">
              ${d.logoBase64 ? `
                <img src="${d.logoBase64}" style="max-height:54px; max-width:140px; object-fit:contain;" alt="Logo">
              ` : `
                <div class="brand-logo" style="width:48px; height:48px; font-size:1.6rem;">D</div>
              `}
              <div class="report-institution-info">
                <h2>${Delfos.Utils.escapeHTML(d.institucion)}</h2>
                <p>Dirección de Tecnologías de la Información &bull; Reporte de Gestión</p>
              </div>
            </div>

            <div style="text-align:right;">
              <span style="font-size:1.15rem; font-weight:800; color:var(--verde); display:block;">INFORME TÉCNICO</span>
              <span style="font-size:0.85rem; font-weight:700; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(d.etiquetaPeriodo)}</span>
            </div>
          </div>

          <!-- Resumen Ejecutivo -->
          <div>
            <h3 style="font-size:1.05rem; font-weight:800; color:var(--verde); margin-bottom:0.6rem; display:flex; align-items:center; gap:0.4rem;">
              <i class="fa-solid fa-file-signature"></i> 1. Resumen Ejecutivo
            </h3>
            <div class="executive-summary-box">
              ${Delfos.Utils.escapeHTML(d.resumenEjecutivoTexto)}
            </div>
          </div>

          <!-- Tarjetas de Métricas de Gestión -->
          <div class="kpi-grid" style="margin-bottom:2rem;">
            <div class="kpi-card" style="padding:1rem;">
              <div class="kpi-icon-box menta" style="width:42px; height:42px; font-size:1.1rem;"><i class="fa-solid fa-headset"></i></div>
              <div class="kpi-info"><span class="kpi-value" style="font-size:1.4rem;">${d.totalSoportes}</span><span class="kpi-label">Soportes</span></div>
            </div>
            <div class="kpi-card" style="padding:1rem;">
              <div class="kpi-icon-box azul" style="width:42px; height:42px; font-size:1.1rem;"><i class="fa-solid fa-screwdriver-wrench"></i></div>
              <div class="kpi-info"><span class="kpi-value" style="font-size:1.4rem;">${d.totalMantenimientos}</span><span class="kpi-label">Mantenimientos</span></div>
            </div>
            <div class="kpi-card" style="padding:1rem;">
              <div class="kpi-icon-box morado" style="width:42px; height:42px; font-size:1.1rem;"><i class="fa-solid fa-box-open"></i></div>
              <div class="kpi-info"><span class="kpi-value" style="font-size:1.4rem;">${d.totalInstalaciones}</span><span class="kpi-label">Instalaciones</span></div>
            </div>
            <div class="kpi-card" style="padding:1rem;">
              <div class="kpi-icon-box ambar" style="width:42px; height:42px; font-size:1.1rem;"><i class="fa-solid fa-circle-check"></i></div>
              <div class="kpi-info"><span class="kpi-value" style="font-size:1.4rem;">${d.tasaResolucion}%</span><span class="kpi-label">Efectividad</span></div>
            </div>
          </div>

          <!-- Gráfica de Distribución de Incidencias -->
          <div style="margin-bottom:2rem;">
            <h3 style="font-size:1.05rem; font-weight:800; color:var(--verde); margin-bottom:1rem; display:flex; align-items:center; gap:0.4rem;">
              <i class="fa-solid fa-chart-column"></i> 2. Distribución de Incidencias por Categoría
            </h3>
            <div style="height:260px; position:relative; background:#FAFAFB; border:1px solid var(--borde); border-radius:var(--radio-md); padding:1rem;">
              <canvas id="chart-reporte-preview"></canvas>
            </div>
          </div>

          <!-- Top Equipos Problemáticos -->
          ${d.topEquiposProblema.length > 0 ? `
            <div style="margin-bottom:2rem;">
              <h3 style="font-size:1.05rem; font-weight:800; color:#B45309; margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
                <i class="fa-solid fa-triangle-exclamation"></i> 3. Dispositivos con Mayor Frecuencia de Incidencias
              </h3>
              <table class="quick-table" style="background:#FFFFFF; border:1px solid var(--borde); border-radius:var(--radio-md); overflow:hidden;">
                <thead>
                  <tr style="background:#FFFBEB;">
                    <th>Código de Equipo</th>
                    <th>Ubicación Actual</th>
                    <th style="text-align:right;">Fallas en el periodo</th>
                  </tr>
                </thead>
                <tbody>
                  ${d.topEquiposProblema.map(eq => `
                    <tr>
                      <td><strong>${Delfos.Utils.escapeHTML(eq.codigo)}</strong></td>
                      <td>${Delfos.Utils.escapeHTML(eq.ubicacion)}</td>
                      <td style="text-align:right;"><span class="badge badge-problematico">${eq.cantidad} incidencias</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Bitácora Detallada de Actividades -->
          <div style="margin-bottom:2.5rem;">
            <h3 style="font-size:1.05rem; font-weight:800; color:var(--verde); margin-bottom:0.75rem; display:flex; align-items:center; gap:0.4rem;">
              <i class="fa-solid fa-list-ul"></i> 4. Bitácora de Soportes Ejecutados (${d.soportes.length})
            </h3>
            <div class="data-table-container">
              <table class="data-table" style="font-size:0.84rem;">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ubicación</th>
                    <th>Categoría</th>
                    <th>Actividad</th>
                    <th>Solución Aplicada</th>
                  </tr>
                </thead>
                <tbody>
                  ${d.soportes.slice(0, 25).map(s => {
                    const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
                    const cat = Delfos.Estado.getCategoria(s.categoriaId);
                    const act = Delfos.Estado.getTipoActividad(s.tipoActividadId);
                    return `
                      <tr>
                        <td>${Delfos.Utils.formatearFecha(s.fecha)}</td>
                        <td>${Delfos.Utils.escapeHTML(ub ? ub.nombre : '-')}</td>
                        <td>${Delfos.Utils.escapeHTML(cat ? cat.nombre : '-')}</td>
                        <td>${Delfos.Utils.escapeHTML(act ? act.nombre : '-')}</td>
                        <td>${Delfos.Utils.escapeHTML(s.solucion || s.descripcion || '-')}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
            ${d.soportes.length > 25 ? `
              <p style="font-size:0.78rem; color:var(--texto-suave); margin-top:0.5rem; text-align:right;">
                * Se muestran las primeras 25 actividades en la vista preliminar. El PDF contiene el listado completo.
              </p>
            ` : ''}
          </div>

          <!-- Pie de Firma del Responsable -->
          <div style="border-top:1px solid var(--borde); padding-top:2rem; display:flex; justify-content:space-between; align-items:flex-end;">
            <div>
              <span style="font-size:0.8rem; color:var(--texto-suave);">Emitido el: ${Delfos.Utils.formatearFecha(Delfos.Utils.fechaHoyISO())}</span>
            </div>
            <div style="text-align:center; min-width:220px; border-top:1px solid #9CA3AF; padding-top:0.5rem;">
              <strong style="display:block; color:var(--texto);">${Delfos.Utils.escapeHTML(d.tecnico)}</strong>
              <span style="font-size:0.78rem; color:var(--texto-suave);">Técnico de Soporte TI</span>
            </div>
          </div>
        </div>
      `;

      // Renderizar gráfica en canvas para preview y exportación a imagen
      this.renderGraficaInforme(d);
    },

    renderGraficaInforme: function(d) {
      if (chartReporteInstancia) {
        chartReporteInstancia.destroy();
      }

      const canvas = document.getElementById('chart-reporte-preview');
      if (!canvas || !window.Chart) return;

      const labels = Object.keys(d.catCounts).slice(0, 7);
      const data = labels.map(l => d.catCounts[l]);

      chartReporteInstancia = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['Sin datos'],
          datasets: [{
            label: 'Incidencias',
            data: data.length ? data : [0],
            backgroundColor: '#1B6B3A',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } }
          }
        }
      });
    },

    exportarPDF: function() {
      if (!informeActualDatos) return;
      if (!window.jspdf || !window.jspdf.jsPDF) {
        Delfos.Utils.showToast('Librería jsPDF no disponible', 'error');
        return;
      }

      const d = informeActualDatos;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');

      // Colores de la paleta Delfos
      const verdeRgb = [27, 107, 58];
      const verdeOscuroRgb = [13, 66, 33];
      const doradoRgb = [245, 183, 49];

      // --- Encabezado institucional ---
      doc.setFillColor(verdeRgb[0], verdeRgb[1], verdeRgb[2]);
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(d.institucion.toUpperCase(), 14, 11);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`INFORME DE GESTIÓN TÉCNICA · ${d.etiquetaPeriodo.toUpperCase()}`, 14, 18);

      // Fecha y Técnico
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(8);
      doc.text(`Fecha de emisión: ${Delfos.Utils.formatearFecha(Delfos.Utils.fechaHoyISO())} | Responsable: ${d.tecnico}`, 14, 31);

      // --- 1. Resumen Ejecutivo ---
      doc.setTextColor(verdeRgb[0], verdeRgb[1], verdeRgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('1. RESUMEN EJECUTIVO', 14, 39);

      doc.setFillColor(232, 245, 238); // verde muy suave
      doc.roundedRect(14, 42, 182, 32, 3, 3, 'F');

      doc.setTextColor(13, 66, 33);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const lineasResumen = doc.splitTextToSize(d.resumenEjecutivoTexto, 174);
      doc.text(lineasResumen, 18, 48);

      // --- 2. Indicadores Clave (KPIs) ---
      let startY = 80;
      doc.setTextColor(verdeRgb[0], verdeRgb[1], verdeRgb[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('2. INDICADORES CLAVE DE RENDIMIENTO', 14, startY);

      startY += 5;
      const kpis = [
        { label: 'Soportes Realizados', val: d.totalSoportes },
        { label: 'Mantenimientos', val: d.totalMantenimientos },
        { label: 'Instalaciones', val: d.totalInstalaciones },
        { label: 'Efectividad', val: `${d.tasaResolucion}%` }
      ];

      kpis.forEach((k, idx) => {
        const x = 14 + idx * 46;
        doc.setFillColor(246, 247, 249);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(x, startY, 43, 16, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(27, 107, 58);
        doc.text(String(k.val), x + 4, startY + 8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(107, 114, 128);
        doc.text(k.label, x + 4, startY + 13);
      });

      // --- 3. Gráfica de Categorías capturada de Canvas ---
      startY += 24;
      const canvas = document.getElementById('chart-reporte-preview');
      if (canvas) {
        try {
          const imgData = canvas.toDataURL('image/png');
          doc.setTextColor(verdeRgb[0], verdeRgb[1], verdeRgb[2]);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text('3. INCIDENCIAS POR CATEGORÍA', 14, startY);

          doc.addImage(imgData, 'PNG', 14, startY + 3, 182, 55);
          startY += 62;
        } catch (e) {
          console.warn('No se pudo capturar canvas a PDF:', e);
        }
      }

      // --- 4. Tabla Detallada con jsPDF autoTable ---
      if (doc.autoTable) {
        doc.setTextColor(verdeRgb[0], verdeRgb[1], verdeRgb[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('4. BITÁCORA DE ACTIVIDADES REGISTRADAS', 14, startY + 6);

        const filasTabla = d.soportes.map(s => {
          const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
          const cat = Delfos.Estado.getCategoria(s.categoriaId);
          const act = Delfos.Estado.getTipoActividad(s.tipoActividadId);
          return [
            Delfos.Utils.formatearFecha(s.fecha),
            ub ? ub.nombre : '-',
            cat ? cat.nombre : '-',
            act ? act.nombre : '-',
            s.solucion || s.descripcion || '-'
          ];
        });

        doc.autoTable({
          startY: startY + 9,
          head: [['Fecha', 'Ubicación', 'Categoría', 'Actividad', 'Solución']],
          body: filasTabla,
          theme: 'striped',
          headStyles: { fillColor: [27, 107, 58], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
          styles: { fontSize: 7.5, cellPadding: 2.5 },
          margin: { left: 14, right: 14 },
          didDrawPage: function(data) {
            // Pie de página con numeración
            const str = `Página ${doc.internal.getNumberOfPages()}`;
            doc.setFontSize(7.5);
            doc.setTextColor(150);
            doc.text(str, 196, 287, { align: 'right' });
            doc.text(`${d.institucion} · Generado con Delfos Support`, 14, 287);
          }
        });
      }

      const nombreArchivo = `informe-${d.tipo}-${d.etiquetaPeriodo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
      doc.save(nombreArchivo);
      Delfos.Utils.showToast('Informe exportado a PDF exitosamente', 'success');
    },

    exportarPPTX: function() {
      if (!informeActualDatos) return;
      if (!window.PptxGenJS) {
        Delfos.Utils.showToast('Librería PptxGenJS no disponible', 'error');
        return;
      }

      const d = informeActualDatos;
      const pptx = new window.PptxGenJS();

      // Paleta
      const COLOR_VERDE = '1B6B3A';
      const COLOR_VERDE_OSCURO = '0D4221';
      const COLOR_DORADO = 'F5B731';
      const COLOR_TEXTO = '1A1B2E';
      const COLOR_BLANCO = 'FFFFFF';

      // --- Diapositiva 1: Portada Institucional ---
      const slide1 = pptx.addSlide();
      slide1.background = { color: COLOR_VERDE };

      slide1.addText('DELFOS SUPPORT', {
        x: 0.8, y: 1.2, w: '80%', h: 0.5,
        fontSize: 16, bold: true, color: COLOR_DORADO, fontFace: 'Arial'
      });

      slide1.addText('INFORME TÉCNICO DE GESTIÓN', {
        x: 0.8, y: 1.8, w: '85%', h: 1.0,
        fontSize: 32, bold: true, color: COLOR_BLANCO, fontFace: 'Arial'
      });

      slide1.addText(`${d.etiquetaPeriodo.toUpperCase()} · ${d.institucion.toUpperCase()}`, {
        x: 0.8, y: 2.8, w: '85%', h: 0.6,
        fontSize: 16, color: 'E5E7EB', fontFace: 'Arial'
      });

      slide1.addText(`Elaborado por: ${d.tecnico}\nFecha: ${Delfos.Utils.formatearFecha(Delfos.Utils.fechaHoyISO())}`, {
        x: 0.8, y: 4.5, w: '80%', h: 0.8,
        fontSize: 12, color: 'C4E2D0', fontFace: 'Arial'
      });

      // --- Diapositiva 2: Resumen Ejecutivo y KPIs ---
      const slide2 = pptx.addSlide();
      slide2.addText('RESUMEN EJECUTIVO', {
        x: 0.8, y: 0.5, w: '80%', h: 0.6,
        fontSize: 22, bold: true, color: COLOR_VERDE, fontFace: 'Arial'
      });

      slide2.addShape(pptx.ShapeType.rect, {
        x: 0.8, y: 1.2, w: 8.4, h: 2.0,
        fill: { color: 'E8F5EE' }, line: { color: COLOR_VERDE, width: 2 }
      });

      slide2.addText(d.resumenEjecutivoTexto, {
        x: 1.0, y: 1.3, w: 8.0, h: 1.8,
        fontSize: 12, color: COLOR_VERDE_OSCURO, fontFace: 'Arial'
      });

      // 4 Cajas de KPIs
      const kpis = [
        { label: 'Soportes del Mes', val: String(d.totalSoportes) },
        { label: 'Mantenimientos', val: String(d.totalMantenimientos) },
        { label: 'Instalaciones', val: String(d.totalInstalaciones) },
        { label: 'Tasa Efectividad', val: `${d.tasaResolucion}%` }
      ];

      kpis.forEach((k, idx) => {
        const x = 0.8 + idx * 2.15;
        slide2.addShape(pptx.ShapeType.rect, {
          x: x, y: 3.5, w: 1.95, h: 1.3,
          fill: { color: 'F6F7F9' }, line: { color: 'E5E7EB', width: 1 }
        });
        slide2.addText(k.val, {
          x: x, y: 3.6, w: 1.95, h: 0.6,
          fontSize: 22, bold: true, color: COLOR_VERDE, align: 'center', fontFace: 'Arial'
        });
        slide2.addText(k.label, {
          x: x, y: 4.2, w: 1.95, h: 0.5,
          fontSize: 10, color: '6B7280', align: 'center', fontFace: 'Arial'
        });
      });

      // --- Diapositiva 3: Gráficas de Incidencias ---
      const slide3 = pptx.addSlide();
      slide3.addText('DISTRIBUCIÓN DE INCIDENCIAS POR CATEGORÍA', {
        x: 0.8, y: 0.5, w: '85%', h: 0.6,
        fontSize: 20, bold: true, color: COLOR_VERDE, fontFace: 'Arial'
      });

      const canvas = document.getElementById('chart-reporte-preview');
      if (canvas) {
        try {
          const imgData = canvas.toDataURL('image/png');
          slide3.addImage({ data: imgData, x: 0.8, y: 1.3, w: 8.4, h: 3.6 });
        } catch (e) {
          console.warn('No se pudo exportar imagen a pptx:', e);
        }
      }

      // --- Diapositiva 4: Equipos Problemáticos ---
      const slide4 = pptx.addSlide();
      slide4.addText('EQUIPOS CON MAYOR NÚMERO DE INCIDENCIAS', {
        x: 0.8, y: 0.5, w: '85%', h: 0.6,
        fontSize: 20, bold: true, color: COLOR_VERDE, fontFace: 'Arial'
      });

      if (d.topEquiposProblema.length > 0) {
        const filasPPTX = [
          [
            { text: 'Código del Equipo', options: { bold: true, fill: COLOR_VERDE, color: COLOR_BLANCO } },
            { text: 'Ubicación Física', options: { bold: true, fill: COLOR_VERDE, color: COLOR_BLANCO } },
            { text: 'Total Incidencias', options: { bold: true, fill: COLOR_VERDE, color: COLOR_BLANCO } }
          ]
        ];

        d.topEquiposProblema.forEach(eq => {
          filasPPTX.push([
            { text: eq.codigo },
            { text: eq.ubicacion },
            { text: `${eq.cantidad} incidencias` }
          ]);
        });

        slide4.addTable(filasPPTX, { x: 0.8, y: 1.4, w: 8.4, fill: 'FAFAFB', fontSize: 11 });
      } else {
        slide4.addText('No se registraron equipos con fallas recurrentes en este periodo.', {
          x: 0.8, y: 2.0, w: 8.4, h: 1.0, fontSize: 14, color: '6B7280'
        });
      }

      // --- Diapositiva 5: Conclusiones y Recomendaciones ---
      const slide5 = pptx.addSlide();
      slide5.addText('CONCLUSIONES Y PLAN DE ACCIÓN TÉCNICO', {
        x: 0.8, y: 0.5, w: '85%', h: 0.6,
        fontSize: 20, bold: true, color: COLOR_VERDE, fontFace: 'Arial'
      });

      const puntos = [
        `Se garantizó la continuidad tecnológica en el 100% de las aulas prioritarias evaluadas.`,
        `Se recomienda programar reemplazo de periféricos desgastados en la categoría "${d.topCatNom}".`,
        `Continuar con las jornadas de mantenimiento preventivo para mitigar paradas imprevistas.`,
        `Mantener la actualización de respaldos y el seguimiento de equipos en inventario.`
      ];

      slide5.addText(puntos.map(p => `•  ${p}`).join('\n\n'), {
        x: 0.8, y: 1.4, w: 8.4, h: 3.2,
        fontSize: 14, color: COLOR_TEXTO, lineSpacing: 24, fontFace: 'Arial'
      });

      const nombreArchivo = `presentacion-${d.tipo}-${d.etiquetaPeriodo.toLowerCase().replace(/\s+/g, '-')}.pptx`;
      pptx.writeFile({ fileName: nombreArchivo });
      Delfos.Utils.showToast('Presentación PowerPoint generada exitosamente', 'success');
    },

    generarTablaHistorialInformes: function(lista) {
      if (!lista || lista.length === 0) {
        return '<p style="padding:1.5rem; text-align:center; color:var(--texto-suave);">No hay registros de informes generados previamente.</p>';
      }

      let html = '<table class="quick-table"><thead><tr><th>Fecha de Emisión</th><th>Periodo</th><th>Soportes Analizados</th><th>Técnico</th></tr></thead><tbody>';
      lista.slice(0, 8).forEach(inf => {
        html += `
          <tr>
            <td><strong>${Delfos.Utils.formatearFecha(inf.fechaGeneracion)}</strong></td>
            <td><span class="badge badge-neutral">${Delfos.Utils.escapeHTML(inf.periodo || '-')}</span></td>
            <td>${inf.totalSoportes || 0} actividades</td>
            <td>${Delfos.Utils.escapeHTML(inf.tecnico || '-')}</td>
          </tr>
        `;
      });
      html += '</tbody></table>';
      return html;
    }
  };

  Delfos.Vistas.Informes = Informes;
})(window.Delfos);
