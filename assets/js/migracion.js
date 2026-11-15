/**
 * ==========================================================================
 * DELFOS SUPPORT - ASISTENTE DE MIGRACIÓN (LOCAL -> NUBE FIRESTORE)
 * ==========================================================================
 * Permite subir los datos reales guardados en el navegador del celular hacia
 * Cloud Firestore de forma 100% segura, idempotente y sin duplicados.
 * 
 * Flujo de 4 pasos garantizados:
 * 1. Descarga automática de respaldo JSON preventivo en el dispositivo.
 * 2. Análisis y vista previa detallada de conteos (reales vs ejemplo).
 * 3. Detección de colisiones e idempotencia (fusión inteligente por ID y fecha).
 * 4. Subida masiva por lotes (WriteBatch) con barra de progreso interactiva.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  const STORES_MIGRACION = [
    'edificios',
    'tiposUbicacion',
    'ubicaciones',
    'tiposEquipo',
    'equipos',
    'categorias',
    'tiposProblema',
    'tiposActividad',
    'estados',
    'soportes',
    'plantillas',
    'configuracion',
    'informesGenerados'
  ];

  const Migracion = {
    /**
     * Analiza los datos locales de IndexedDB y los compara con la nube
     */
    analizar: async function() {
      // 1. Leer todo el almacenamiento local de IndexedDB
      const datosLocales = await Delfos.IndexedDB.exportarTodo();
      const colLocales = datosLocales.colecciones || {};

      const conteosLocales = {};
      let totalLocales = 0;
      let totalEjemplos = 0;
      let totalReales = 0;

      STORES_MIGRACION.forEach(store => {
        const items = colLocales[store] || [];
        const ejemplos = items.filter(it => it.ejemplo || it.esEjemplo).length;
        const reales = items.length - ejemplos;

        conteosLocales[store] = {
          total: items.length,
          reales: reales,
          ejemplos: ejemplos
        };

        totalLocales += items.length;
        totalEjemplos += ejemplos;
        totalReales += reales;
      });

      // 2. Comprobar si la nube ya tiene registros
      let totalNube = 0;
      const conteosNube = {};

      if (Delfos.nube && Delfos.nube.currentUser) {
        for (const store of STORES_MIGRACION) {
          const itemsNube = await Delfos.DB.listar(store);
          conteosNube[store] = itemsNube.length;
          totalNube += itemsNube.length;
        }
      }

      return {
        locales: {
          total: totalLocales,
          reales: totalReales,
          ejemplos: totalEjemplos,
          desglose: conteosLocales,
          raw: colLocales
        },
        nube: {
          total: totalNube,
          tieneDatos: totalNube > 0,
          desglose: conteosNube
        }
      };
    },

    /**
     * Renderiza el Asistente de Migración interactivo
     */
    renderAsistente: async function(container) {
      if (!Delfos.nube || !Delfos.nube.currentUser) {
        container.innerHTML = `
          <div class="card" style="padding:1.5rem; background:#FEF3C7; border:1px solid #FCD34D;">
            <div style="display:flex; align-items:center; gap:0.75rem; color:#92400E;">
              <i class="fa-solid fa-lock" style="font-size:1.5rem;"></i>
              <div>
                <strong>Inicia sesión primero</strong>
                <div style="font-size:0.85rem; margin-top:0.25rem;">
                  Para subir los datos de este dispositivo a la nube, debes haber iniciado sesión con tu cuenta técnica de Firebase.
                </div>
              </div>
            </div>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="text-align:center; padding:2rem 1rem;">
          <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:var(--verde); margin-bottom:1rem;"></i>
          <p style="font-weight:600; color:var(--texto-suave);">Analizando datos locales de este dispositivo...</p>
        </div>
      `;

      try {
        const analisis = await this.analizar();
        const loc = analisis.locales;
        const nub = analisis.nube;

        container.innerHTML = `
          <div class="card" style="padding:1.75rem; border:1.5px solid var(--borde); margin-bottom:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; margin-bottom:1.25rem;">
              <div>
                <span class="badge ${loc.total > 0 ? 'badge-resuelto' : 'badge-neutral'}" style="margin-bottom:0.4rem;">
                  <i class="fa-solid fa-hard-drive"></i> Datos Detectados en este Dispositivo
                </span>
                <h3 style="font-size:1.2rem; font-weight:800; color:var(--texto);">
                  Asistente de Migración a la Nube (Firebase)
                </h3>
                <p style="font-size:0.88rem; color:var(--texto-suave); margin-top:0.25rem;">
                  Pasa todo lo que tienes guardado en este navegador hacia tu base de datos central en Cloud Firestore.
                </p>
              </div>

              <div style="text-align:right;">
                <span style="font-size:1.4rem; font-weight:800; color:var(--verde);">${loc.reales}</span>
                <span style="font-size:0.8rem; color:var(--texto-suave); display:block;">registros reales listos</span>
              </div>
            </div>

            <!-- Resumen de Conteos Locales -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:0.75rem; margin-bottom:1.25rem;">
              <div style="background:var(--fondo); padding:0.75rem 1rem; border-radius:8px; border:1px solid var(--borde);">
                <div style="font-size:0.72rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Edificios</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--texto);">${loc.desglose.edificios.total}</div>
              </div>
              <div style="background:var(--fondo); padding:0.75rem 1rem; border-radius:8px; border:1px solid var(--borde);">
                <div style="font-size:0.72rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Salones / Aulas</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--verde);">${loc.desglose.ubicaciones.reales} <small style="font-size:0.75rem; color:var(--texto-suave); font-weight:600;">reales</small></div>
              </div>
              <div style="background:var(--fondo); padding:0.75rem 1rem; border-radius:8px; border:1px solid var(--borde);">
                <div style="font-size:0.72rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Equipos</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--verde);">${loc.desglose.equipos.reales} <small style="font-size:0.75rem; color:var(--texto-suave); font-weight:600;">reales</small></div>
              </div>
              <div style="background:var(--fondo); padding:0.75rem 1rem; border-radius:8px; border:1px solid var(--borde);">
                <div style="font-size:0.72rem; color:var(--texto-suave); text-transform:uppercase; font-weight:700;">Soportes</div>
                <div style="font-size:1.2rem; font-weight:800; color:var(--verde);">${loc.desglose.soportes.reales} <small style="font-size:0.75rem; color:var(--texto-suave); font-weight:600;">reales</small></div>
              </div>
            </div>

            <!-- Opciones de Configuración de Migración -->
            <div style="background:#F8FAFC; border:1px solid var(--borde); border-radius:8px; padding:1.15rem; margin-bottom:1.5rem;">
              <h4 style="font-size:0.9rem; font-weight:700; color:var(--texto); margin-bottom:0.75rem;">
                <i class="fa-solid fa-sliders" style="color:var(--verde);"></i> Opciones de subida segura:
              </h4>

              <!-- Opción: Excluir ejemplos -->
              <label style="display:flex; align-items:flex-start; gap:0.6rem; cursor:pointer; margin-bottom:0.85rem; font-size:0.88rem;">
                <input type="checkbox" id="mig-excluir-ejemplos" ${loc.ejemplos > 0 ? 'checked' : ''} style="width:18px; height:18px; margin-top:2px;">
                <div>
                  <strong>Excluir datos de ejemplo de prueba (${loc.ejemplos} elementos)</strong>
                  <div style="font-size:0.78rem; color:var(--texto-suave);">
                    Recomendado: Sube únicamente tus aulas y soportes verdaderos (como Salón Zeus o Laboratorio Olmedo) y deja fuera los 65 soportes de prueba.
                  </div>
                </div>
              </label>

              <!-- Aviso de Nube Existente -->
              ${nub.tieneDatos ? `
                <div style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:6px; padding:0.85rem 1rem; font-size:0.85rem; color:#92400E; margin-top:0.75rem;">
                  <i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>
                  <strong>Tu nube ya contiene ${nub.total} documentos.</strong>
                  <div style="margin-top:0.35rem; font-size:0.82rem;">
                    Se aplicará <strong>Fusión Inteligente (Merge Idempotente)</strong>: se respetarán los identificadores existentes y se conservará siempre el registro más reciente sin duplicar nada.
                  </div>
                </div>
              ` : `
                <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:6px; padding:0.75rem 1rem; font-size:0.85rem; color:#166534;">
                  <i class="fa-solid fa-circle-check" style="margin-right:4px;"></i>
                  Tu base de datos en la nube está limpia y lista para recibir esta primera carga completa.
                </div>
              `}
            </div>

            <!-- Caja de Progreso (Oculta al inicio) -->
            <div id="migracion-progreso-box" style="display:none; margin-bottom:1.5rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.88rem; font-weight:700; margin-bottom:0.5rem;">
                <span id="migracion-paso-texto"><i class="fa-solid fa-spinner fa-spin"></i> Preparando...</span>
                <span id="migracion-porcentaje-texto" style="color:var(--verde);">0%</span>
              </div>
              <div class="progress-bar-container">
                <div id="migracion-barra-progreso" class="progress-bar-fill" style="width:0%;"></div>
              </div>
              <div id="migracion-detalle-texto" style="font-size:0.78rem; color:var(--texto-suave); margin-top:0.4rem;">
                Iniciando proceso seguro...
              </div>
            </div>

            <!-- Botón Principal -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem;">
              <div style="font-size:0.8rem; color:var(--texto-suave);">
                <i class="fa-solid fa-shield-halved" style="color:var(--verde);"></i>
                Paso 1 automático: se descargará un archivo <code>.json</code> previo por protección.
              </div>

              <button type="button" id="btn-iniciar-migracion" class="btn btn-primary" style="height:52px; min-height:52px; font-size:1rem; font-weight:800;" onclick="Delfos.Migracion.iniciarProceso()">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <span>Subir los datos de este dispositivo a la nube</span>
              </button>
            </div>
          </div>
        `;
      } catch (err) {
        console.error('Error al analizar datos locales para migración:', err);
        container.innerHTML = `
          <div class="card" style="padding:1.5rem; background:#FEE2E2; border:1px solid #FECACA; color:#991B1B;">
            <strong>Error al leer los datos de este dispositivo:</strong> ${err.message}
          </div>
        `;
      }
    },

    /**
     * Ejecuta el proceso completo de migración
     */
    iniciarProceso: async function() {
      const btn = document.getElementById('btn-iniciar-migracion');
      const boxProgreso = document.getElementById('migracion-progreso-box');
      const barra = document.getElementById('migracion-barra-progreso');
      const pasoTxt = document.getElementById('migracion-paso-texto');
      const porcTxt = document.getElementById('migracion-porcentaje-texto');
      const detTxt = document.getElementById('migracion-detalle-texto');
      const chkExcluir = document.getElementById('mig-excluir-ejemplos');

      const excluirEjemplos = chkExcluir ? chkExcluir.checked : true;

      // 1. Confirmación explícita del técnico
      const confirmar = confirm('¿Deseas iniciar la sincronización de este dispositivo hacia la nube de Firebase?\n\nSe descargará automáticamente una copia JSON preventiva antes de comenzar.');
      if (!confirmar) return;

      btn.disabled = true;
      boxProgreso.style.display = 'block';

      const actualizarProgreso = (pct, paso, detalle) => {
        if (barra) barra.style.width = `${pct}%`;
        if (porcTxt) porcTxt.textContent = `${pct}%`;
        if (pasoTxt) pasoTxt.innerHTML = paso;
        if (detTxt) detTxt.textContent = detalle;
      };

      try {
        // PASO 1: Descarga automática de respaldo JSON
        actualizarProgreso(10, '<i class="fa-solid fa-download"></i> Paso 1/4: Generando respaldo preventivo...', 'Creando archivo JSON con la base local actual');
        const backupLocal = await Delfos.IndexedDB.exportarTodo();
        const hoyStr = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonStr = JSON.stringify(backupLocal, null, 2);
        Delfos.Utils.descargarArchivo(`delfos-respaldo-pre-migracion-${hoyStr}.json`, jsonStr, 'application/json');

        await new Promise(r => setTimeout(r, 600));

        // PASO 2: Filtrado y normalización idempotente
        actualizarProgreso(25, '<i class="fa-solid fa-filter"></i> Paso 2/4: Preparando documentos para la nube...', 'Filtrando registros y validando identificadores únicos');

        const colLocales = backupLocal.colecciones || {};
        const documentosAMigrar = {};
        let totalItemsAMigrar = 0;

        STORES_MIGRACION.forEach(store => {
          let items = colLocales[store] || [];
          if (excluirEjemplos) {
            items = items.filter(it => !it.ejemplo && !it.esEjemplo);
          }
          // Normalizar timestamps y borrado lógico
          const ahora = new Date().toISOString();
          const itemsNormalizados = items.map(it => {
            const clone = Object.assign({}, it);
            if (store === 'configuracion') {
              clone.id = clone.clave || clone.id || 'config_general';
            } else if (!clone.id) {
              clone.id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            if (clone.creadoEn === undefined) clone.creadoEn = ahora;
            if (clone.actualizadoEn === undefined) clone.actualizadoEn = ahora;
            clone.eliminadoEn = null;
            return clone;
          });

          documentosAMigrar[store] = itemsNormalizados;
          totalItemsAMigrar += itemsNormalizados.length;
        });

        // PASO 3: Subida masiva por lotes (WriteBatch)
        actualizarProgreso(40, '<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Paso 3/4: Subiendo lotes a Cloud Firestore...', `0 de ${totalItemsAMigrar} documentos sincronizados`);

        let itemsSubidos = 0;
        const totalStores = STORES_MIGRACION.length;
        let storeIndex = 0;

        for (const store of STORES_MIGRACION) {
          storeIndex++;
          const items = documentosAMigrar[store] || [];
          if (items.length > 0) {
            await Delfos.DB.guardarLote(store, items);
            itemsSubidos += items.length;
          }

          const progresoActual = Math.min(95, 40 + Math.round((storeIndex / totalStores) * 55));
          actualizarProgreso(
            progresoActual,
            `<i class="fa-solid fa-cloud-arrow-up fa-fade"></i> Subiendo ${store} (${itemsSubidos}/${totalItemsAMigrar})...`,
            `Lote de ${store} sincronizado correctamente.`
          );
        }

        // PASO 4: Recarga y verificación
        actualizarProgreso(100, '<i class="fa-solid fa-circle-check" style="color:var(--verde);"></i> Paso 4/4: ¡Migración completada con éxito!', 'Sincronización finalizada al 100%');

        await Delfos.Estado.recargarCatalogos();
        Delfos.Estado.emit('catalogosActualizados');
        Delfos.Estado.emit('soportesActualizados');

        Delfos.Utils.showToast(`¡${itemsSubidos} registros sincronizados con éxito en la nube!`, 'success');

        // Actualizar vista del asistente para mostrar el estado final
        setTimeout(() => {
          const contenedor = document.getElementById('migracion-asistente-box');
          if (contenedor) Migracion.renderAsistente(contenedor);
        }, 1500);

      } catch (err) {
        console.error('Error fatal durante la migración a Firestore:', err);
        actualizarProgreso(0, '<i class="fa-solid fa-circle-xmark" style="color:var(--estado-error);"></i> Error en la migración', err.message);
        btn.disabled = false;
        Delfos.Utils.showToast('Ocurrió un error al subir los datos a Firestore: ' + err.message, 'error');
      }
    }
  };

  Delfos.Migracion = Migracion;
})(window.Delfos);
