/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: ESTADÍSTICAS Y MÉTRICAS AVANZADAS
 * Filtro por periodos (hoy, semana, mes, año, rango), comparación con periodo
 * anterior con flechas (↑↓ %), tiempo medio de resolución y gráficas Chart.js.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let chartsStats = {};
  let periodoSeleccionado = 'mes';
  let rangoPersonalizado = { desde: '', hasta: '' };

  const Estadisticas = {
    render: async function(container) {
      this.destruirGraficas();

      const { inicioActual, finActual, inicioAnterior, finAnterior, etiquetaPeriodo } = this.calcularFechasPeriodos();

      const todosSoportes = await Delfos.DB.listar('soportes', s => s.activo !== false);

      // Soportes del periodo actual y del periodo anterior para comparar
      const soportesActual = todosSoportes.filter(s => s.fecha >= inicioActual && s.fecha <= finActual);
      const soportesAnterior = todosSoportes.filter(s => s.fecha >= inicioAnterior && s.fecha <= finAnterior);

      // Categorías, problemas y tipos de actividad
      const tiposActividad = Delfos.Estado.tiposActividad;
      const idsMantenimiento = tiposActividad.filter(a => a.esMantenimiento).map(a => a.id);
      const idsInstalacion = tiposActividad.filter(a => a.esInstalacion).map(a => a.id);

      // Métricas periodo actual
      const totalActual = soportesActual.length;
      const totalAnterior = soportesAnterior.length;
      const diffTotal = this.calcularVariacionPorcentual(totalActual, totalAnterior);

      const mantActual = soportesActual.filter(s => idsMantenimiento.includes(s.tipoActividadId)).length;
      const mantAnterior = soportesAnterior.filter(s => idsMantenimiento.includes(s.tipoActividadId)).length;
      const diffMant = this.calcularVariacionPorcentual(mantActual, mantAnterior);

      const instActual = soportesActual.filter(s => idsInstalacion.includes(s.tipoActividadId)).length;
      const instAnterior = soportesAnterior.filter(s => idsInstalacion.includes(s.tipoActividadId)).length;
      const diffInst = this.calcularVariacionPorcentual(instActual, instAnterior);

      // Equipos atendidos distintos
      const eqActualSet = new Set();
      soportesActual.forEach(s => {
        if (Array.isArray(s.equipoIds)) s.equipoIds.forEach(id => eqActualSet.add(id));
      });
      const eqAnteriorSet = new Set();
      soportesAnterior.forEach(s => {
        if (Array.isArray(s.equipoIds)) s.equipoIds.forEach(id => eqAnteriorSet.add(id));
      });
      const diffEq = this.calcularVariacionPorcentual(eqActualSet.size, eqAnteriorSet.size);

      // Frecuencias: Problema, Categoría, Ubicación, Edificio, Equipo Top
      const topCat = this.obtenerTop(soportesActual, s => Delfos.Estado.getCategoria(s.categoriaId)?.nombre);
      const topProb = this.obtenerTop(soportesActual, s => Delfos.Estado.getProblema(s.problemaId)?.nombre);
      const topUb = this.obtenerTop(soportesActual, s => Delfos.Estado.getUbicacion(s.ubicacionId)?.nombre);
      const topEdif = this.obtenerTop(soportesActual, s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        return ub ? Delfos.Estado.getEdificio(ub.edificioId)?.nombre : null;
      });
      const topEq = this.obtenerTopEquipo(soportesActual);

      container.innerHTML = `
        <div>
          <!-- Encabezado y Selector de Periodos -->
          <div class="card" style="margin-bottom:1.5rem; padding:1.25rem 1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div>
                <h2 class="card-title"><i class="fa-solid fa-chart-simple" style="color:var(--verde);"></i> Análisis Estadístico</h2>
                <p class="card-subtitle">Indicadores clave de soporte, tendencias y comparación periódica</p>
              </div>

              <!-- Selector de Periodo tipo Pills -->
              <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
                <button type="button" class="btn btn-sm ${periodoSeleccionado === 'hoy' ? 'btn-primary' : 'btn-secondary'}" onclick="Delfos.Vistas.Estadisticas.cambiarPeriodo('hoy')">Hoy</button>
                <button type="button" class="btn btn-sm ${periodoSeleccionado === 'semana' ? 'btn-primary' : 'btn-secondary'}" onclick="Delfos.Vistas.Estadisticas.cambiarPeriodo('semana')">Esta semana</button>
                <button type="button" class="btn btn-sm ${periodoSeleccionado === 'mes' ? 'btn-primary' : 'btn-secondary'}" onclick="Delfos.Vistas.Estadisticas.cambiarPeriodo('mes')">Este mes</button>
                <button type="button" class="btn btn-sm ${periodoSeleccionado === 'año' ? 'btn-primary' : 'btn-secondary'}" onclick="Delfos.Vistas.Estadisticas.cambiarPeriodo('año')">Este año</button>
                <button type="button" class="btn btn-sm ${periodoSeleccionado === 'rango' ? 'btn-primary' : 'btn-secondary'}" onclick="Delfos.Vistas.Estadisticas.cambiarPeriodo('rango')">Rango...</button>
              </div>
            </div>

            <!-- Fila para Rango Personalizado -->
            ${periodoSeleccionado === 'rango' ? `
              <div style="margin-top:1rem; padding-top:1rem; border-top:1px dashed var(--borde); display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                <span style="font-size:0.85rem; font-weight:700;">Rango:</span>
                <input type="date" id="stats-desde" class="form-control form-control-sm" style="width:auto;" value="${rangoPersonalizado.desde || inicioActual}">
                <span>a</span>
                <input type="date" id="stats-hasta" class="form-control form-control-sm" style="width:auto;" value="${rangoPersonalizado.hasta || finActual}">
                <button type="button" class="btn btn-sm btn-primary" onclick="Delfos.Vistas.Estadisticas.aplicarRangoPersonalizado()">Filtrar</button>
              </div>
            ` : ''}
          </div>

          <!-- Tarjetas de KPIs con Comparación con Periodo Anterior (↑↓ %) -->
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-icon-box menta">
                <i class="fa-solid fa-headset"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">${totalActual}</span>
                <span class="kpi-label">Total soportes</span>
                <span style="font-size:0.75rem; font-weight:700; margin-top:0.25rem; color:${diffTotal.color};">
                  <i class="fa-solid ${diffTotal.icono}"></i> ${diffTotal.texto} vs ${etiquetaPeriodo}
                </span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box azul">
                <i class="fa-solid fa-screwdriver-wrench"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">${mantActual}</span>
                <span class="kpi-label">Mantenimientos</span>
                <span style="font-size:0.75rem; font-weight:700; margin-top:0.25rem; color:${diffMant.color};">
                  <i class="fa-solid ${diffMant.icono}"></i> ${diffMant.texto}
                </span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box morado">
                <i class="fa-solid fa-box-open"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">${instActual}</span>
                <span class="kpi-label">Instalaciones</span>
                <span style="font-size:0.75rem; font-weight:700; margin-top:0.25rem; color:${diffInst.color};">
                  <i class="fa-solid ${diffInst.icono}"></i> ${diffInst.texto}
                </span>
              </div>
            </div>

            <div class="kpi-card">
              <div class="kpi-icon-box ambar">
                <i class="fa-solid fa-laptop-medical"></i>
              </div>
              <div class="kpi-info">
                <span class="kpi-value">${eqActualSet.size}</span>
                <span class="kpi-label">Equipos atendidos</span>
                <span style="font-size:0.75rem; font-weight:700; margin-top:0.25rem; color:${diffEq.color};">
                  <i class="fa-solid ${diffEq.icono}"></i> ${diffEq.texto}
                </span>
              </div>
            </div>
          </div>

          <!-- Cuadrícula de Destacados Top -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:1rem; margin-bottom:1.75rem;">
            <div class="card" style="padding:1.25rem;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">Categoría Líder</span>
              <h4 style="font-size:1.15rem; font-weight:800; color:var(--verde); margin-top:0.35rem;">
                ${Delfos.Utils.escapeHTML(topCat ? `${topCat.nombre} (${topCat.cantidad})` : 'Sin registros')}
              </h4>
            </div>

            <div class="card" style="padding:1.25rem;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">Problema más Frecuente</span>
              <h4 style="font-size:1.15rem; font-weight:800; color:#B45309; margin-top:0.35rem;">
                ${Delfos.Utils.escapeHTML(topProb ? `${topProb.nombre} (${topProb.cantidad})` : 'Sin registros')}
              </h4>
            </div>

            <div class="card" style="padding:1.25rem;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">Ubicación más Activa</span>
              <h4 style="font-size:1.15rem; font-weight:800; color:var(--texto); margin-top:0.35rem;">
                ${Delfos.Utils.escapeHTML(topUb ? `${topUb.nombre} (${topUb.cantidad})` : 'Sin registros')}
              </h4>
            </div>

            <div class="card" style="padding:1.25rem;">
              <span style="font-size:0.75rem; text-transform:uppercase; color:var(--texto-suave); font-weight:700;">Equipo con más Fallas</span>
              <h4 style="font-size:1.15rem; font-weight:800; color:var(--estado-error); margin-top:0.35rem;">
                ${Delfos.Utils.escapeHTML(topEq ? `${topEq.codigo} (${topEq.cantidad})` : 'Sin incidencias')}
              </h4>
            </div>
          </div>

          <!-- Gráficas de Análisis -->
          <div class="charts-grid-2">
            <div class="chart-card-wrapper">
              <div class="chart-header">
                <h3 class="chart-title"><i class="fa-solid fa-chart-pie" style="color:var(--verde); margin-right:0.4rem;"></i> Distribución de Tipos de Actividad</h3>
              </div>
              <div class="chart-container-rel">
                <canvas id="chart-stats-actividades"></canvas>
              </div>
            </div>

            <div class="chart-card-wrapper">
              <div class="chart-header">
                <h3 class="chart-title"><i class="fa-solid fa-building" style="color:var(--verde); margin-right:0.4rem;"></i> Incidencias por Edificio</h3>
              </div>
              <div class="chart-container-rel">
                <canvas id="chart-stats-edificios"></canvas>
              </div>
            </div>
          </div>

          <div class="charts-grid-2">
            <div class="chart-card-wrapper">
              <div class="chart-header">
                <h3 class="chart-title"><i class="fa-solid fa-fire" style="color:var(--dorado); margin-right:0.4rem;"></i> Top 5 Problemas Técnicos</h3>
              </div>
              <div class="chart-container-rel">
                <canvas id="chart-stats-problemas"></canvas>
              </div>
            </div>

            <div class="chart-card-wrapper">
              <div class="chart-header">
                <h3 class="chart-title"><i class="fa-solid fa-layer-group" style="color:var(--verde); margin-right:0.4rem;"></i> Incidencias por Categoría</h3>
              </div>
              <div class="chart-container-rel">
                <canvas id="chart-stats-categorias"></canvas>
              </div>
            </div>
          </div>
        </div>
      `;

      this.inicializarGraficasStats(soportesActual);
    },

    cambiarPeriodo: function(periodo) {
      periodoSeleccionado = periodo;
      this.render(document.getElementById('vista-activa-container'));
    },

    aplicarRangoPersonalizado: function() {
      rangoPersonalizado.desde = document.getElementById('stats-desde').value;
      rangoPersonalizado.hasta = document.getElementById('stats-hasta').value;
      this.render(document.getElementById('vista-activa-container'));
    },

    calcularFechasPeriodos: function() {
      const hoy = new Date();
      let inicioActual = '', finActual = '', inicioAnterior = '', finAnterior = '', etiquetaPeriodo = 'periodo anterior';

      if (periodoSeleccionado === 'hoy') {
        inicioActual = finActual = Delfos.Utils.fechaHoyISO();
        const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000);
        inicioAnterior = finAnterior = ayer.toISOString().split('T')[0];
        etiquetaPeriodo = 'ayer';
      } else if (periodoSeleccionado === 'semana') {
        const diaSemana = hoy.getDay() || 7; // Lunes = 1
        const lunes = new Date(hoy);
        lunes.setDate(hoy.getDate() - diaSemana + 1);
        inicioActual = lunes.toISOString().split('T')[0];
        finActual = Delfos.Utils.fechaHoyISO();

        const lunesAnterior = new Date(lunes);
        lunesAnterior.setDate(lunes.getDate() - 7);
        const domingoAnterior = new Date(lunes);
        domingoAnterior.setDate(lunes.getDate() - 1);
        inicioAnterior = lunesAnterior.toISOString().split('T')[0];
        finAnterior = domingoAnterior.toISOString().split('T')[0];
        etiquetaPeriodo = 'semana pasada';
      } else if (periodoSeleccionado === 'año') {
        const año = hoy.getFullYear();
        inicioActual = `${año}-01-01`;
        finActual = `${año}-12-31`;
        inicioAnterior = `${año - 1}-01-01`;
        finAnterior = `${año - 1}-12-31`;
        etiquetaPeriodo = 'año anterior';
      } else if (periodoSeleccionado === 'rango') {
        inicioActual = rangoPersonalizado.desde || Delfos.Utils.fechaHoyISO();
        finActual = rangoPersonalizado.hasta || Delfos.Utils.fechaHoyISO();
        const dias = Delfos.Utils.diasDiferencia(inicioActual, finActual) || 1;
        const dAntInicio = new Date(new Date(inicioActual).getTime() - dias * 24 * 60 * 60 * 1000);
        inicioAnterior = dAntInicio.toISOString().split('T')[0];
        finAnterior = inicioActual;
        etiquetaPeriodo = 'periodo previo';
      } else {
        // 'mes' por defecto
        const año = hoy.getFullYear();
        const mes = hoy.getMonth();
        inicioActual = new Date(año, mes, 1).toISOString().split('T')[0];
        finActual = new Date(año, mes + 1, 0).toISOString().split('T')[0];

        inicioAnterior = new Date(año, mes - 1, 1).toISOString().split('T')[0];
        finAnterior = new Date(año, mes, 0).toISOString().split('T')[0];
        etiquetaPeriodo = 'mes anterior';
      }

      return { inicioActual, finActual, inicioAnterior, finAnterior, etiquetaPeriodo };
    },

    calcularVariacionPorcentual: function(actual, anterior) {
      if (anterior === 0) {
        if (actual > 0) return { texto: '+100%', icono: 'fa-arrow-up', color: '#16A34A' };
        return { texto: '0%', icono: 'fa-minus', color: '#6B7280' };
      }
      const dif = Math.round(((actual - anterior) / anterior) * 100);
      if (dif > 0) return { texto: `+${dif}%`, icono: 'fa-arrow-up', color: '#16A34A' };
      if (dif < 0) return { texto: `${dif}%`, icono: 'fa-arrow-down', color: '#3B82F6' };
      return { texto: '0%', icono: 'fa-minus', color: '#6B7280' };
    },

    obtenerTop: function(soportes, extractorFn) {
      const conteos = {};
      soportes.forEach(s => {
        const val = extractorFn(s);
        if (val) conteos[val] = (conteos[val] || 0) + 1;
      });
      const ord = Object.entries(conteos).sort((a, b) => b[1] - a[1]);
      return ord.length > 0 ? { nombre: ord[0][0], cantidad: ord[0][1] } : null;
    },

    obtenerTopEquipo: function(soportes) {
      const conteos = {};
      soportes.forEach(s => {
        if (Array.isArray(s.equipoIds)) {
          s.equipoIds.forEach(id => {
            conteos[id] = (conteos[id] || 0) + 1;
          });
        }
      });
      const ord = Object.entries(conteos).sort((a, b) => b[1] - a[1]);
      if (ord.length > 0) {
        const eq = Delfos.Estado.getEquipo(ord[0][0]);
        return { codigo: eq ? eq.codigo : ord[0][0], cantidad: ord[0][1] };
      }
      return null;
    },

    destruirGraficas: function() {
      Object.keys(chartsStats).forEach(k => {
        if (chartsStats[k]) chartsStats[k].destroy();
      });
      chartsStats = {};
    },

    inicializarGraficasStats: function(soportes) {
      if (!window.Chart) return;

      // 1. Actividades (Doughnut)
      const actCount = {};
      soportes.forEach(s => {
        const a = Delfos.Estado.getTipoActividad(s.tipoActividadId);
        const nom = a ? a.nombre : 'Otras';
        actCount[nom] = (actCount[nom] || 0) + 1;
      });

      const actCanvas = document.getElementById('chart-stats-actividades');
      if (actCanvas) {
        chartsStats['act'] = new Chart(actCanvas, {
          type: 'doughnut',
          data: {
            labels: Object.keys(actCount).length ? Object.keys(actCount) : ['Sin datos'],
            datasets: [{
              data: Object.values(actCount).length ? Object.values(actCount) : [1],
              backgroundColor: ['#1B6B3A', '#F5B731', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } }
          }
        });
      }

      // 2. Edificios (Bar)
      const edifCount = {};
      soportes.forEach(s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        const ed = ub ? Delfos.Estado.getEdificio(ub.edificioId) : null;
        const nom = ed ? ed.nombre : 'Sin edificio';
        edifCount[nom] = (edifCount[nom] || 0) + 1;
      });

      const edifCanvas = document.getElementById('chart-stats-edificios');
      if (edifCanvas) {
        chartsStats['edif'] = new Chart(edifCanvas, {
          type: 'bar',
          data: {
            labels: Object.keys(edifCount),
            datasets: [{
              label: 'Incidencias',
              data: Object.values(edifCount),
              backgroundColor: '#1B6B3A',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
          }
        });
      }

      // 3. Top Problemas (Horizontal bar)
      const probCount = {};
      soportes.forEach(s => {
        const p = Delfos.Estado.getProblema(s.problemaId);
        const nom = p ? p.nombre : 'Otros';
        probCount[nom] = (probCount[nom] || 0) + 1;
      });
      const probOrd = Object.entries(probCount).sort((a,b) => b[1] - a[1]).slice(0, 5);

      const probCanvas = document.getElementById('chart-stats-problemas');
      if (probCanvas) {
        chartsStats['prob'] = new Chart(probCanvas, {
          type: 'bar',
          data: {
            labels: probOrd.map(p => p[0]),
            datasets: [{
              label: 'Frecuencia',
              data: probOrd.map(p => p[1]),
              backgroundColor: '#F5B731',
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
          }
        });
      }

      // 4. Categorías (Bar)
      const catCount = {};
      soportes.forEach(s => {
        const c = Delfos.Estado.getCategoria(s.categoriaId);
        const nom = c ? c.nombre : 'Otros';
        catCount[nom] = (catCount[nom] || 0) + 1;
      });
      const catOrd = Object.entries(catCount).sort((a,b) => b[1] - a[1]).slice(0, 6);

      const catCanvas = document.getElementById('chart-stats-categorias');
      if (catCanvas) {
        chartsStats['cat'] = new Chart(catCanvas, {
          type: 'bar',
          data: {
            labels: catOrd.map(c => c[0]),
            datasets: [{
              label: 'Incidencias',
              data: catOrd.map(c => c[1]),
              backgroundColor: '#175A31',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  };

  Delfos.Vistas.Estadisticas = Estadisticas;
})(window.Delfos);
