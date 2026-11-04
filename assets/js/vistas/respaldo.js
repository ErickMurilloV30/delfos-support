/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: GESTIÓN DE RESPALDOS Y PERSISTENCIA LOCAL
 * Exportación JSON completa con timestamp, restauración validada con pre-respaldo
 * de seguridad automático, recordatorio de 7 días y almacenamiento persistente.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  let datosRespaldoCargadosParaRestaurar = null;

  const Respaldo = {
    render: async function(container) {
      const ultimoRespaldo = await Delfos.DB.obtenerConfig('ultimoRespaldo', null);
      const hoyISO = Delfos.Utils.fechaHoyISO();
      const dias = ultimoRespaldo ? Delfos.Utils.diasDiferencia(ultimoRespaldo, hoyISO) : null;
      const necesitaRespaldo = dias === null || dias >= 7;

      // Verificar persistencia de almacenamiento en el navegador
      let esPersistente = false;
      if (navigator.storage && navigator.storage.persisted) {
        esPersistente = await navigator.storage.persisted();
      }

      // Conteos actuales
      const [edifs, ubs, eqs, sops] = await Promise.all([
        Delfos.DB.contar('edificios'),
        Delfos.DB.contar('ubicaciones'),
        Delfos.DB.contar('equipos'),
        Delfos.DB.contar('soportes')
      ]);

      container.innerHTML = `
        <div style="max-width:900px; margin:0 auto;">
          <!-- Banner Informativo de Estado de Respaldo -->
          <div class="card" style="margin-bottom:2rem; padding:1.75rem; border-left:5px solid ${necesitaRespaldo ? 'var(--estado-error)' : 'var(--verde)'};">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1.25rem;">
              <div>
                <span class="badge ${necesitaRespaldo ? 'badge-problematico' : 'badge-resuelto'}" style="margin-bottom:0.5rem;">
                  <i class="fa-solid ${necesitaRespaldo ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i>
                  ${necesitaRespaldo ? 'Respaldo recomendado' : 'Datos al día'}
                </span>
                <h2 style="font-size:1.35rem; font-weight:800; color:var(--texto);">Copia de Seguridad y Restauración</h2>
                <p style="font-size:0.88rem; color:var(--texto-suave); margin-top:0.25rem;">
                  Último respaldo descargado: <strong>${ultimoRespaldo ? Delfos.Utils.formatearFecha(ultimoRespaldo) : 'Nunca se ha descargado'}</strong>
                  ${dias !== null ? ` (hace ${dias} días)` : ''}
                </p>
              </div>

              <button class="btn btn-primary" style="height:52px; min-height:52px; font-size:1rem;" onclick="Delfos.Vistas.Respaldo.crearRespaldoCompleto()">
                <i class="fa-solid fa-cloud-arrow-down"></i> Descargar Respaldo Completo (.json)
              </button>
            </div>
          </div>

          <!-- Opciones de Respaldo y Restauración en Tarjetas -->
          <div class="charts-grid-2" style="margin-bottom:2rem;">
            <!-- Tarjeta 1: Restaurar Respaldo -->
            <div class="card" style="padding:1.75rem;">
              <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                <div class="kpi-icon-box ambar" style="width:44px; height:44px; font-size:1.2rem;">
                  <i class="fa-solid fa-upload"></i>
                </div>
                <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Restaurar Copia de Seguridad</h3>
              </div>
              <p style="font-size:0.88rem; color:var(--texto-suave); line-height:1.5; margin-bottom:1.5rem;">
                Carga un archivo <code>.json</code> previamente exportado. El sistema creará automáticamente un respaldo de seguridad del estado actual antes de aplicar los datos.
              </p>

              <input type="file" id="input-archivo-respaldo" accept=".json" style="display:none;" onchange="Delfos.Vistas.Respaldo.alSeleccionarArchivo(event)">
              <button type="button" class="btn btn-secondary" style="width:100%;" onclick="document.getElementById('input-archivo-respaldo').click()">
                <i class="fa-solid fa-folder-open"></i> Seleccionar archivo .json
              </button>
            </div>

            <!-- Tarjeta 2: Persistencia del Navegador -->
            <div class="card" style="padding:1.75rem;">
              <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1rem;">
                <div class="kpi-icon-box menta" style="width:44px; height:44px; font-size:1.2rem;">
                  <i class="fa-solid fa-shield-halved"></i>
                </div>
                <h3 style="font-size:1.1rem; font-weight:800; color:var(--texto);">Persistencia en Navegador</h3>
              </div>
              <p style="font-size:0.88rem; color:var(--texto-suave); line-height:1.5; margin-bottom:1.5rem;">
                Estado actual: <strong>${esPersistente ? '✓ Almacenamiento Persistente Concedido' : 'Temporal (el navegador podría limpiar la caché en poco espacio)'}</strong>.
              </p>

              ${!esPersistente ? `
                <button type="button" class="btn btn-secondary" style="width:100%;" onclick="Delfos.Vistas.Respaldo.solicitarPersistencia()">
                  <i class="fa-solid fa-lock"></i> Solicitar Protección Persistente
                </button>
              ` : `
                <span class="badge badge-resuelto" style="padding:0.6rem 1rem; width:100%; justify-content:center;">
                  <i class="fa-solid fa-lock"></i> Tu almacenamiento local está protegido
                </span>
              `}
            </div>
          </div>

          <!-- Resumen de Datos Locales Almacenados -->
          <div class="card" style="padding:1.75rem;">
            <h3 style="font-size:1.05rem; font-weight:800; color:var(--texto); margin-bottom:1.25rem;">
              <i class="fa-solid fa-database" style="color:var(--verde); margin-right:0.4rem;"></i>
              Inventario de Datos Almacenados en este Dispositivo
            </h3>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:1rem;">
              <div style="background:var(--fondo); padding:1rem; border-radius:var(--radio-md); border:1px solid var(--borde);">
                <span style="font-size:0.75rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Edificios</span>
                <h4 style="font-size:1.5rem; font-weight:800; color:var(--verde); margin-top:0.25rem;">${edifs}</h4>
              </div>
              <div style="background:var(--fondo); padding:1rem; border-radius:var(--radio-md); border:1px solid var(--borde);">
                <span style="font-size:0.75rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Ubicaciones</span>
                <h4 style="font-size:1.5rem; font-weight:800; color:var(--verde); margin-top:0.25rem;">${ubs}</h4>
              </div>
              <div style="background:var(--fondo); padding:1rem; border-radius:var(--radio-md); border:1px solid var(--borde);">
                <span style="font-size:0.75rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Equipos</span>
                <h4 style="font-size:1.5rem; font-weight:800; color:var(--verde); margin-top:0.25rem;">${eqs}</h4>
              </div>
              <div style="background:var(--fondo); padding:1rem; border-radius:var(--radio-md); border:1px solid var(--borde);">
                <span style="font-size:0.75rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Soportes Registrados</span>
                <h4 style="font-size:1.5rem; font-weight:800; color:var(--verde); margin-top:0.25rem;">${sops}</h4>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL CONFIRMACIÓN DE RESTAURACIÓN CON RESUMEN DE REGISTROS -->
        <div id="modal-confirmar-restauracion" class="modal-overlay">
          <div class="modal-dialog">
            <div class="modal-header">
              <h3 class="modal-title" style="color:#B45309;"><i class="fa-solid fa-triangle-exclamation"></i> Confirmar Restauración de Respaldo</h3>
              <button class="modal-close-btn" type="button" onclick="Delfos.Utils.closeModal('modal-confirmar-restauracion')"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="modal-body" id="modal-restauracion-body"></div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" onclick="Delfos.Utils.closeModal('modal-confirmar-restauracion')">Cancelar</button>
              <button type="button" class="btn btn-primary btn-sm" style="background:#B45309; border-color:#B45309;" onclick="Delfos.Vistas.Respaldo.ejecutarRestauracionConfirmada()">
                <i class="fa-solid fa-rotate-left"></i> Confirmar y Restaurar
              </button>
            </div>
          </div>
        </div>
      `;
    },

    crearRespaldoCompleto: async function() {
      const data = await Delfos.DB.exportarTodo();
      const hoyISO = Delfos.Utils.fechaHoyISO();
      const nombreArchivo = `delfos-respaldo-${hoyISO}.json`;
      const contenidoJson = JSON.stringify(data, null, 2);

      Delfos.Utils.descargarArchivo(nombreArchivo, contenidoJson, 'application/json');

      // Actualizar fecha del último respaldo
      await Delfos.DB.guardarConfig('ultimoRespaldo', hoyISO);

      Delfos.Utils.showToast('¡Copia de respaldo descargada con éxito!', 'success');
      this.render(document.getElementById('vista-activa-container'));
    },

    solicitarPersistencia: async function() {
      if (navigator.storage && navigator.storage.persist) {
        const concedido = await navigator.storage.persist();
        if (concedido) {
          Delfos.Utils.showToast('¡Almacenamiento persistente activado!', 'success');
        } else {
          Delfos.Utils.showToast('El navegador declinó la persistencia automática (guarda respaldos JSON con frecuencia)', 'info');
        }
        this.render(document.getElementById('vista-activa-container'));
      } else {
        Delfos.Utils.showToast('API de almacenamiento persistente no disponible en este navegador', 'info');
      }
    },

    alSeleccionarArchivo: function(event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (!parsed || !parsed.colecciones) {
            Delfos.Utils.showToast('El archivo no contiene un respaldo válido de Delfos Support', 'error');
            return;
          }

          datosRespaldoCargadosParaRestaurar = parsed;
          this.mostrarModalConfirmacion(parsed, file.name);
        } catch (err) {
          Delfos.Utils.showToast('Error al procesar el archivo JSON: formato corrupto', 'error');
        }
      };
      reader.readAsText(file);
    },

    mostrarModalConfirmacion: function(data, fileName) {
      const col = data.colecciones || {};
      const body = document.getElementById('modal-restauracion-body');

      body.innerHTML = `
        <div style="background:#FFFBEB; border:1px solid #FDE68A; border-radius:var(--radio-md); padding:1rem; margin-bottom:1.25rem; font-size:0.88rem; color:#92400E;">
          <strong>Atención:</strong> Vas a reemplazar los datos actuales con el contenido del archivo <code>${Delfos.Utils.escapeHTML(fileName)}</code>.
          Para tu total seguridad, <strong>se descargará automáticamente un respaldo previo del estado actual</strong> antes de sobrescribir.
        </div>

        <h4 style="font-size:0.9rem; font-weight:700; margin-bottom:0.75rem;">Resumen de elementos a restaurar:</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem; font-size:0.88rem;">
          <div style="background:var(--fondo); padding:0.6rem 0.9rem; border-radius:var(--radio-sm);">
            Edificios: <strong>${(col.edificios || []).length}</strong>
          </div>
          <div style="background:var(--fondo); padding:0.6rem 0.9rem; border-radius:var(--radio-sm);">
            Ubicaciones: <strong>${(col.ubicaciones || []).length}</strong>
          </div>
          <div style="background:var(--fondo); padding:0.6rem 0.9rem; border-radius:var(--radio-sm);">
            Equipos: <strong>${(col.equipos || []).length}</strong>
          </div>
          <div style="background:var(--fondo); padding:0.6rem 0.9rem; border-radius:var(--radio-sm);">
            Soportes: <strong>${(col.soportes || []).length}</strong>
          </div>
          <div style="background:var(--fondo); padding:0.6rem 0.9rem; border-radius:var(--radio-sm);">
            Categorías: <strong>${(col.categorias || []).length}</strong>
          </div>
          <div style="background:var(--fondo); padding:0.6rem 0.9rem; border-radius:var(--radio-sm);">
            Problemas: <strong>${(col.tiposProblema || []).length}</strong>
          </div>
        </div>
      `;

      Delfos.Utils.openModal('modal-confirmar-restauracion');
    },

    ejecutarRestauracionConfirmada: async function() {
      if (!datosRespaldoCargadosParaRestaurar) return;

      try {
        // 1. Descarga automática de respaldo de seguridad del estado actual
        const backupPrevio = await Delfos.DB.exportarTodo();
        const hoyISO = Delfos.Utils.fechaHoyISO();
        Delfos.Utils.descargarArchivo(`delfos-respaldo-seguridad-previo-${hoyISO}.json`, JSON.stringify(backupPrevio, null, 2), 'application/json');

        // 2. Restaurar los datos cargados
        await Delfos.DB.restaurarTodo(datosRespaldoCargadosParaRestaurar);
        await Delfos.Estado.recargarCatalogos();

        Delfos.Utils.closeModal('modal-confirmar-restauracion');
        Delfos.Utils.showToast('¡Datos restaurados con éxito!', 'success');

        // 3. Volver al dashboard
        Delfos.Estado.cambiarVista('dashboard');
      } catch (err) {
        console.error('Error durante restauración:', err);
        Delfos.Utils.showToast('Ocurrió un error al restaurar los datos', 'error');
      }
    }
  };

  Delfos.Vistas.Respaldo = Respaldo;
})(window.Delfos);
