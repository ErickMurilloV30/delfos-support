/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: DASHBOARD (INICIO)
 * Banner de degradado verde/dorado, KPIs del mes, gráficas Chart.js,
 * últimos 5 soportes, pendientes con botón 1-toque y aviso de respaldo.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let chartsInstances = {};

  const Dashboard = {
    render: async function(container) {
      // Destruir gráficas previas para liberar canvas
      this.destruirGraficas();

      const hoy = new Date();
      const añoActual = hoy.getFullYear();
      const mesActual = hoy.getMonth(); // 0 a 11
      const primerDiaMes = new Date(añoActual, mesActual, 1).toISOString().split('T')[0];
      const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0).toISOString().split('T')[0];

      // Cargar soportes
      const todosSoportes = await Delfos.DB.listar('soportes', s => s.activo !== false);
      const soportesMes = todosSoportes.filter(s => s.fecha >= primerDiaMes && s.fecha <= ultimoDiaMes);

      // Calcular métricas del mes
      const tiposActividad = Delfos.Estado.tiposActividad;
      const idsMantenimiento = tiposActividad.filter(a => a.esMantenimiento).map(a => a.id);
      const idsInstalacion = tiposActividad.filter(a => a.esInstalacion).map(a => a.id);

      const totalSoportesMes = soportesMes.length;
      const totalMantenimientos = soportesMes.filter(s => idsMantenimiento.includes(s.tipoActividadId)).length;
      const totalInstalaciones = soportesMes.filter(s => idsInstalacion.includes(s.tipoActividadId)).length;

      // Equipos atendidos distintos en el mes
      const equiposAtendidosSet = new Set();
      soportesMes.forEach(s => {
        if (Array.isArray(s.equipoIds)) {
          s.equipoIds.forEach(eqId => equiposAtendidosSet.add(eqId));
        }
      });
      const totalEquiposAtendidos = equiposAtendidosSet.size;

      // Soportes pendientes (globales no resueltos)
      const estadosNoFinales = Delfos.Estado.estados.filter(e => !e.esFinal).map(e => e.id);
      const soportesPendientes = todosSoportes.filter(s => estadosNoFinales.includes(s.estadoId));

      // Revisión de respaldo > 7 días
      const ultimoRespaldo = await Delfos.DB.obtenerConfig('ultimoRespaldo', null);
      let alertaRespaldoHtml = '';
      if (!ultimoRespaldo || Delfos.Utils.diasDiferencia(ultimoRespaldo, Delfos.Utils.fechaHoyISO()) >= 7) {
        const dias = ultimoRespaldo ? Delfos.Utils.diasDiferencia(ultimoRespaldo, Delfos.Utils.fechaHoyISO()) : 'varios';
        alertaRespaldoHtml = `
          <div class="backup-alert-banner">
            <div style="display:flex; align-items:center; gap:0.75rem;">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span><strong>Aviso de seguridad:</strong> Hace más de 7 días no descargas una copia de respaldo de tus datos locales.</span>
            </div>
            <button class="btn btn-sm btn-dorado" onclick="Delfos.Estado.cambiarVista('respaldos')">
              <i class="fa-solid fa-download"></i> Respaldar ahora
            </button>
          </div>
        `;
      }

      // Nombre del técnico
      const tecnicoNombre = Delfos.Estado.config.tecnico || 'Técnico de Soporte';
      const fechaTextoHoy = hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      const fechaTextoCapitalizada = fechaTextoHoy.charAt(0).toUpperCase() + fechaTextoHoy.slice(1);

      container.innerHTML = `
        ${alertaRespaldoHtml}

        <!-- Banner de Bienvenida -->
        <div class="dashboard-banner">
          <div class="banner-content">
            <h1 class="banner-greeting">¡Hola, <span class="tech-highlight">${Delfos.Utils.escapeHTML(tecnicoNombre)}</span>!</h1>
            <div class="banner-date">
              <i class="fa-regular fa-calendar-check" style="color:var(--dorado);"></i>
              <span>${fechaTextoCapitalizada}</span>
            </div>
          </div>
          <button class="banner-action-btn" onclick="Delfos.Estado.cambiarVista('nuevo-soporte')">
            <i class="fa-solid fa-plus-circle" style="color:var(--verde);"></i>
            <span>Nuevo soporte</span>
          </button>
        </div>

        <!-- Tarjetas de KPIs del mes actual -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon-box menta">
              <i class="fa-solid fa-headset"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">${totalSoportesMes}</span>
              <span class="kpi-label">Soportes del mes</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-box azul">
              <i class="fa-solid fa-screwdriver-wrench"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">${totalMantenimientos}</span>
              <span class="kpi-label">Mantenimientos</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-box morado">
              <i class="fa-solid fa-box-open"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">${totalInstalaciones}</span>
              <span class="kpi-label">Instalaciones</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-box ambar">
              <i class="fa-solid fa-laptop-medical"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">${totalEquiposAtendidos}</span>
              <span class="kpi-label">Equipos atendidos</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-box rosa">
              <i class="fa-solid fa-clock-rotate-left"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">${soportesPendientes.length}</span>
              <span class="kpi-label">Soportes pendientes</span>
            </div>
          </div>
        </div>

        <!-- Fila de Gráficas Chart.js 1 -->
        <div class="charts-grid-2">
          <div class="chart-card-wrapper">
            <div class="chart-header">
              <h3 class="chart-title"><i class="fa-solid fa-chart-pie" style="color:var(--verde); margin-right:0.5rem;"></i>Incidencias por Categoría</h3>
            </div>
            <div class="chart-container-rel">
              <canvas id="chart-categorias-dash"></canvas>
            </div>
          </div>

          <div class="chart-card-wrapper">
            <div class="chart-header">
              <h3 class="chart-title"><i class="fa-solid fa-chart-column" style="color:var(--verde); margin-right:0.5rem;"></i>Incidencias por Ubicación</h3>
            </div>
            <div class="chart-container-rel">
              <canvas id="chart-ubicaciones-dash"></canvas>
            </div>
          </div>
        </div>

        <!-- Fila de Gráficas Chart.js 2 -->
        <div class="charts-grid-2">
          <div class="chart-card-wrapper">
            <div class="chart-header">
              <h3 class="chart-title"><i class="fa-solid fa-chart-line" style="color:var(--verde); margin-right:0.5rem;"></i>Soportes por Día (Este Mes)</h3>
            </div>
            <div class="chart-container-rel">
              <canvas id="chart-dias-dash"></canvas>
            </div>
          </div>

          <div class="chart-card-wrapper">
            <div class="chart-header">
              <h3 class="chart-title"><i class="fa-solid fa-fire" style="color:var(--dorado); margin-right:0.5rem;"></i>Problemas más Frecuentes</h3>
            </div>
            <div class="chart-container-rel">
              <canvas id="chart-problemas-dash"></canvas>
            </div>
          </div>
        </div>

        <!-- Tablas Rápidas: Últimos 5 y Pendientes -->
        <div class="dashboard-tables-grid">
          <!-- Últimos 5 soportes -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title"><i class="fa-solid fa-clock"></i> Últimos 5 soportes</h3>
              <button class="btn btn-sm btn-secondary" onclick="Delfos.Estado.cambiarVista('historial')">Ver todos</button>
            </div>
            <div class="card-body" style="padding:0.5rem 1rem;">
              ${this.generarTablaUltimosSoportes(todosSoportes.slice(-5).reverse())}
            </div>
          </div>

          <!-- Soportes pendientes de atención -->
          <div class="card">
            <div class="card-header">
              <h3 class="card-title" style="color:#B45309;"><i class="fa-solid fa-bell"></i> Pendientes de resolución (${soportesPendientes.length})</h3>
            </div>
            <div class="card-body" style="padding:0.5rem 1rem;">
              ${this.generarTablaPendientes(soportesPendientes)}
            </div>
          </div>
        </div>
      `;

      // Inicializar las gráficas de Chart.js
      this.inicializarGraficasDashboard(todosSoportes, soportesMes);
    },

    generarTablaUltimosSoportes: function(ultimos) {
      if (!ultimos || ultimos.length === 0) {
        return '<p style="padding:1.5rem; text-align:center; color:var(--texto-suave);">No hay soportes registrados aún.</p>';
      }

      let html = `
        <table class="quick-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ubicación</th>
              <th>Categoría</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
      `;

      ultimos.forEach(s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        const cat = Delfos.Estado.getCategoria(s.categoriaId);
        const est = Delfos.Estado.getEstado(s.estadoId);

        let badgeClass = 'badge-neutral';
        if (est && est.esFinal) badgeClass = 'badge-resuelto';
        else if (est && est.id === 'est_proceso') badgeClass = 'badge-proceso';
        else if (est) badgeClass = 'badge-pendiente';

        html += `
          <tr style="cursor:pointer;" onclick="Delfos.Vistas.Historial.abrirDetalle('${s.id}')">
            <td><strong>${Delfos.Utils.formatearFecha(s.fecha)}</strong> <span style="font-size:0.75rem; color:var(--texto-suave);">${s.hora || ''}</span></td>
            <td>${Delfos.Utils.escapeHTML(ub ? ub.nombre : 'General')}</td>
            <td>${Delfos.Utils.escapeHTML(cat ? cat.nombre : '-')}</td>
            <td><span class="badge ${badgeClass}">${Delfos.Utils.escapeHTML(est ? est.nombre : '-')}</span></td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      return html;
    },

    generarTablaPendientes: function(pendientes) {
      if (!pendientes || pendientes.length === 0) {
        return '<p style="padding:1.5rem; text-align:center; color:var(--verde);"><i class="fa-solid fa-circle-check"></i> ¡Excelente! No tienes soportes pendientes por resolver.</p>';
      }

      let html = `
        <table class="quick-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ubicación / Detalle</th>
              <th style="text-align:right;">Acción</th>
            </tr>
          </thead>
          <tbody>
      `;

      pendientes.forEach(s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        const cat = Delfos.Estado.getCategoria(s.categoriaId);
        const descCorta = s.descripcion ? (s.descripcion.length > 40 ? s.descripcion.slice(0, 40) + '...' : s.descripcion) : (cat ? cat.nombre : 'Sin descripción');

        html += `
          <tr>
            <td>${Delfos.Utils.formatearFecha(s.fecha)}</td>
            <td>
              <strong>${Delfos.Utils.escapeHTML(ub ? ub.nombre : 'General')}</strong><br>
              <span style="font-size:0.8rem; color:var(--texto-suave);">${Delfos.Utils.escapeHTML(descCorta)}</span>
            </td>
            <td style="text-align:right;">
              <button class="btn btn-sm btn-primary" onclick="Delfos.Vistas.Dashboard.marcarResuelto('${s.id}')" title="Marcar como resuelto">
                <i class="fa-solid fa-check"></i> Resolver
              </button>
            </td>
          </tr>
        `;
      });

      html += '</tbody></table>';
      return html;
    },

    marcarResuelto: async function(soporteId) {
      const soporte = await Delfos.DB.obtener('soportes', soporteId);
      if (!soporte) return;

      const estadoResuelto = Delfos.Estado.estados.find(e => e.esFinal) || { id: 'est_resuelto' };
      soporte.estadoId = estadoResuelto.id;
      if (!soporte.solucion) {
        soporte.solucion = 'Marcado como resuelto desde el Dashboard.';
      }

      await Delfos.DB.guardar('soportes', soporte);
      Delfos.Utils.showToast('Soporte marcado como resuelto', 'success');
      this.render(document.getElementById('vista-activa-container'));
    },

    destruirGraficas: function() {
      Object.keys(chartsInstances).forEach(key => {
        if (chartsInstances[key]) {
          chartsInstances[key].destroy();
        }
      });
      chartsInstances = {};
    },

    inicializarGraficasDashboard: function(todosSoportes, soportesMes) {
      if (!window.Chart) return;

      // 1. Gráfica Categorías (Doughnut)
      const catCount = {};
      soportesMes.forEach(s => {
        const cat = Delfos.Estado.getCategoria(s.categoriaId);
        const nom = cat ? cat.nombre : 'Sin categoría';
        catCount[nom] = (catCount[nom] || 0) + 1;
      });

      const catLabels = Object.keys(catCount).slice(0, 6);
      const catData = catLabels.map(l => catCount[l]);

      const canvasCat = document.getElementById('chart-categorias-dash');
      if (canvasCat) {
        chartsInstances['cat'] = new Chart(canvasCat, {
          type: 'doughnut',
          data: {
            labels: catLabels.length ? catLabels : ['Sin registros'],
            datasets: [{
              data: catData.length ? catData : [1],
              backgroundColor: ['#1B6B3A', '#F5B731', '#175A31', '#0D4221', '#3B82F6', '#8B5CF6'],
              borderWidth: 2,
              borderColor: '#FFFFFF'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Plus Jakarta Sans', size: 11 } } }
            }
          }
        });
      }

      // 2. Gráfica Ubicaciones (Bar)
      const ubCount = {};
      soportesMes.forEach(s => {
        const ub = Delfos.Estado.getUbicacion(s.ubicacionId);
        const nom = ub ? ub.nombre : 'General';
        ubCount[nom] = (ubCount[nom] || 0) + 1;
      });

      const ubOrdenadas = Object.entries(ubCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
      const ubLabels = ubOrdenadas.map(u => u[0]);
      const ubData = ubOrdenadas.map(u => u[1]);

      const canvasUb = document.getElementById('chart-ubicaciones-dash');
      if (canvasUb) {
        chartsInstances['ub'] = new Chart(canvasUb, {
          type: 'bar',
          data: {
            labels: ubLabels.length ? ubLabels : ['Sin datos'],
            datasets: [{
              label: 'Incidencias',
              data: ubData.length ? ubData : [0],
              backgroundColor: '#1B6B3A',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } },
              x: { ticks: { font: { family: 'Plus Jakarta Sans', size: 10 } } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // 3. Gráfica Soportes por Día (Line)
      const hoy = new Date();
      const diasEnMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
      const diasLabels = [];
      const diasData = [];

      for (let d = 1; d <= diasEnMes; d++) {
        const dStr = String(d).padStart(2, '0');
        const mStr = String(hoy.getMonth() + 1).padStart(2, '0');
        const iso = `${hoy.getFullYear()}-${mStr}-${dStr}`;
        diasLabels.push(d);
        const count = soportesMes.filter(s => s.fecha === iso).length;
        diasData.push(count);
      }

      const canvasDias = document.getElementById('chart-dias-dash');
      if (canvasDias) {
        chartsInstances['dias'] = new Chart(canvasDias, {
          type: 'line',
          data: {
            labels: diasLabels,
            datasets: [{
              label: 'Soportes por día',
              data: diasData,
              borderColor: '#1B6B3A',
              backgroundColor: 'rgba(27, 107, 58, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#F5B731'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      // 4. Gráfica Problemas más Frecuentes (Horizontal Bar)
      const probCount = {};
      soportesMes.forEach(s => {
        const prob = Delfos.Estado.getProblema(s.problemaId);
        const nom = prob ? prob.nombre : 'Otros problemas';
        probCount[nom] = (probCount[nom] || 0) + 1;
      });

      const probOrdenados = Object.entries(probCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const probLabels = probOrdenados.map(p => p[0]);
      const probData = probOrdenados.map(p => p[1]);

      const canvasProb = document.getElementById('chart-problemas-dash');
      if (canvasProb) {
        chartsInstances['prob'] = new Chart(canvasProb, {
          type: 'bar',
          data: {
            labels: probLabels.length ? probLabels : ['Sin registros'],
            datasets: [{
              label: 'Frecuencia',
              data: probData.length ? probData : [0],
              backgroundColor: '#F5B731',
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  };

  Delfos.Vistas.Dashboard = Dashboard;
})(window.Delfos);
