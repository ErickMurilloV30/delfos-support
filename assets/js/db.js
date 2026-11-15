/**
 * ==========================================================================
 * DELFOS SUPPORT - CAPA DE ACCESO A DATOS HÍBRIDA (FIRESTORE + INDEXEDDB)
 * ==========================================================================
 * - Cuando hay sesión activa en Firebase: Cloud Firestore es la fuente de verdad.
 *   Usa ruta: usuarios/{uid}/{coleccion}/{id} con caché persistente y listeners.
 * - Soportes en tiempo real solo de mes actual y anterior (cuidado de cuotas Spark).
 * - Borrado lógico con eliminadoEn y resolución de conflictos por última escritura.
 * - Mantiene Delfos.IndexedDB intacto para migraciones locales y respaldos.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  const DB_NAME = 'DelfosSupportDB';
  const DB_VERSION = 1;

  const STORES = [
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

  let idbInstance = null;

  // ==========================================================================
  // 1. REPOSITORIO LOCAL (INDEXEDDB) - CONSERVADO PARA MIGRACIÓN Y RESPALDO
  // ==========================================================================
  const IndexedDB_Repo = {
    init: function() {
      return new Promise((resolve, reject) => {
        if (idbInstance) return resolve(idbInstance);
        if (!window.indexedDB) {
          return reject(new Error('IndexedDB no soportado.'));
        }

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = function(event) {
          const db = event.target.result;
          STORES.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              if (storeName === 'configuracion') {
                db.createObjectStore(storeName, { keyPath: 'clave' });
              } else {
                const store = db.createObjectStore(storeName, { keyPath: 'id' });
                if (storeName === 'ubicaciones') {
                  store.createIndex('edificioId', 'edificioId', { unique: false });
                } else if (storeName === 'equipos') {
                  store.createIndex('ubicacionId', 'ubicacionId', { unique: false });
                  store.createIndex('codigo', 'codigo', { unique: false });
                } else if (storeName === 'tiposProblema') {
                  store.createIndex('categoriaId', 'categoriaId', { unique: false });
                } else if (storeName === 'soportes') {
                  store.createIndex('fecha', 'fecha', { unique: false });
                  store.createIndex('ubicacionId', 'ubicacionId', { unique: false });
                  store.createIndex('categoriaId', 'categoriaId', { unique: false });
                  store.createIndex('estadoId', 'estadoId', { unique: false });
                }
              }
            }
          });
        };

        request.onsuccess = function(event) {
          idbInstance = event.target.result;
          resolve(idbInstance);
        };

        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    },

    listar: async function(coleccion, filtroFn) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readonly');
        const store = transaction.objectStore(coleccion);
        const request = store.getAll();

        request.onsuccess = function() {
          let items = request.result || [];
          if (typeof filtroFn === 'function') {
            items = items.filter(filtroFn);
          }
          resolve(items);
        };
        request.onerror = function(e) { reject(e.target.error); };
      });
    },

    obtener: async function(coleccion, id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readonly');
        const store = transaction.objectStore(coleccion);
        const request = store.get(id);
        request.onsuccess = function() { resolve(request.result || null); };
        request.onerror = function(e) { reject(e.target.error); };
      });
    },

    guardar: async function(coleccion, item) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        if (!item) return reject(new Error('Item no puede ser nulo'));
        const clone = Object.assign({}, item);
        if (coleccion !== 'configuracion') {
          if (!clone.id) {
            clone.id = (window.crypto && crypto.randomUUID) 
              ? crypto.randomUUID() 
              : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          }
          if (clone.creadoEn === undefined) clone.creadoEn = new Date().toISOString();
          clone.actualizadoEn = new Date().toISOString();
        }
        const transaction = db.transaction([coleccion], 'readwrite');
        const store = transaction.objectStore(coleccion);
        const request = store.put(clone);
        request.onsuccess = function() { resolve(clone); };
        request.onerror = function(e) { reject(e.target.error); };
      });
    },

    guardarLote: async function(coleccion, items) {
      if (!items || !items.length) return [];
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readwrite');
        const store = transaction.objectStore(coleccion);
        const guardados = [];
        items.forEach(item => {
          const clone = Object.assign({}, item);
          if (coleccion !== 'configuracion' && !clone.id) {
            clone.id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          }
          store.put(clone);
          guardados.push(clone);
        });
        transaction.oncomplete = function() { resolve(guardados); };
        transaction.onerror = function(e) { reject(e.target.error); };
      });
    },

    eliminar: async function(coleccion, id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readwrite');
        const store = transaction.objectStore(coleccion);
        const request = store.delete(id);
        request.onsuccess = function() { resolve(true); };
        request.onerror = function(e) { reject(e.target.error); };
      });
    },

    exportarTodo: async function() {
      const db = await this.init();
      const exportData = {
        app: 'Delfos Support',
        version: 1,
        fechaExportacion: new Date().toISOString(),
        colecciones: {}
      };
      for (const s of STORES) {
        exportData.colecciones[s] = await this.listar(s);
      }
      return exportData;
    }
  };

  Delfos.IndexedDB = IndexedDB_Repo;

  // ==========================================================================
  // 2. CAPA PRINCIPAL DE DATOS (NUBE FIRESTORE CON MEMORIA EN TIEMPO REAL)
  // ==========================================================================
  // Caché en memoria sincronizada por snapshots de Firestore
  const memoriaNube = {
    edificios: {},
    tiposUbicacion: {},
    ubicaciones: {},
    tiposEquipo: {},
    equipos: {},
    categorias: {},
    tiposProblema: {},
    tiposActividad: {},
    estados: {},
    soportes: {}, // Soportes de mes actual y anterior en tiempo real
    soportesHistoricos: {}, // Soportes cargados bajo demanda para consultas históricas
    plantillas: {},
    configuracion: {},
    informesGenerados: {}
  };

  let listenersActivos = false;

  const DB = {
    /**
     * Inicializa la capa de datos
     */
    init: async function() {
      // Siempre inicializar IndexedDB local por si se requiere para migración o respaldo
      await IndexedDB_Repo.init();
      return true;
    },

    /**
     * Verifica si hay una sesión activa de Firebase
     */
    usarFirestore: function() {
      return Boolean(Delfos.nube && Delfos.nube.isConfigured && Delfos.nube.currentUser && Delfos.nube.db);
    },

    getUid: function() {
      return Delfos.nube && Delfos.nube.currentUser ? Delfos.nube.currentUser.uid : null;
    },

    /**
     * Inicia los listeners de Firestore en tiempo real para el usuario autenticado
     */
    iniciarListenersNube: function() {
      if (!this.usarFirestore() || listenersActivos) return;

      const uid = this.getUid();
      const nube = Delfos.nube;
      const { collection, onSnapshot, query, where } = nube.firestoreRefs;

      listenersActivos = true;

      // 1. Catálogos, ubicaciones y equipos: listener completo
      const coleccionesCatalogo = [
        'edificios',
        'tiposUbicacion',
        'ubicaciones',
        'tiposEquipo',
        'equipos',
        'categorias',
        'tiposProblema',
        'tiposActividad',
        'estados',
        'plantillas',
        'configuracion',
        'informesGenerados'
      ];

      coleccionesCatalogo.forEach(colNombre => {
        try {
          const colRef = collection(nube.db, 'usuarios', uid, colNombre);
          const q = query(colRef);

          const unsub = onSnapshot(q, (snapshot) => {
            nube.registrarConsumo('lectura', snapshot.docChanges().length || 1);
            
            // Detectar si hay escrituras pendientes en caché local
            if (snapshot.metadata.hasPendingWrites) {
              nube.actualizarIndicador('sincronizando');
            } else {
              nube.actualizarIndicador('sincronizado');
            }

            memoriaNube[colNombre] = memoriaNube[colNombre] || {};

            snapshot.docChanges().forEach(change => {
              const docData = change.doc.data();
              const docId = change.doc.id;
              
              if (change.type === 'removed' || docData.eliminadoEn) {
                delete memoriaNube[colNombre][docId];
              } else {
                memoriaNube[colNombre][docId] = docData;
              }
            });

            // Si es la primera carga o actualización en vivo, sincronizar con Estado
            if (Delfos.Estado && typeof Delfos.Estado.recargarCatalogos === 'function') {
              Delfos.Estado.recargarCatalogos();
            }
          }, (error) => {
            console.error(`Error en listener de ${colNombre}:`, error);
            if (error.code === 'resource-exhausted') {
              Delfos.Utils.showToast('Límite diario de lecturas alcanzado temporalmente. Se usarán datos locales.', 'error');
            }
          });

          nube.collectionListeners[colNombre] = unsub;
        } catch (e) {
          console.error(`No se pudo iniciar listener para ${colNombre}:`, e);
        }
      });

      // 2. Soportes: listener en tiempo real SOLO del mes actual y el mes anterior (A5)
      try {
        const colRef = collection(nube.db, 'usuarios', uid, 'soportes');
        const hoy = new Date();
        const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0];

        // Filtro en cliente para no depender de índices compuestos en Firestore
        const qSoportes = query(colRef, where('fecha', '>=', fechaInicio));

        const unsubSoportes = onSnapshot(qSoportes, (snapshot) => {
          nube.registrarConsumo('lectura', snapshot.docChanges().length || 1);
          
          if (snapshot.metadata.hasPendingWrites) {
            nube.actualizarIndicador('sincronizando');
          } else {
            nube.actualizarIndicador('sincronizado');
          }

          memoriaNube.soportes = memoriaNube.soportes || {};

          snapshot.docChanges().forEach(change => {
            const data = change.doc.data();
            const docId = change.doc.id;

            if (change.type === 'removed' || data.eliminadoEn) {
              delete memoriaNube.soportes[docId];
            } else {
              memoriaNube.soportes[docId] = data;
            }
          });

          // Notificar que los soportes cambiaron para que el Dashboard o Historial se refresquen
          if (Delfos.Estado) {
            Delfos.Estado.emit('soportesActualizados');
          }
        }, (error) => {
          console.error('Error en listener de soportes recientes:', error);
        });

        nube.collectionListeners.soportesRecientes = unsubSoportes;
      } catch (e) {
        console.error('No se pudo iniciar listener para soportes:', e);
      }
    },

    detenerListenersNube: function() {
      if (Delfos.nube && typeof Delfos.nube.detenerTodosListeners === 'function') {
        Delfos.nube.detenerTodosListeners();
      }
      listenersActivos = false;
      // Limpiar memoria
      Object.keys(memoriaNube).forEach(k => { memoriaNube[k] = {}; });
    },

    /**
     * Listar registros de una colección
     */
    listar: async function(coleccion, filtroFn, opciones = {}) {
      if (this.usarFirestore()) {
        const uid = this.getUid();
        const nube = Delfos.nube;

        // Si la colección es 'soportes' y se solicitan registros históricos de otros periodos
        if (coleccion === 'soportes' && opciones.cargarHistorico) {
          try {
            const { collection, getDocs, query, where } = nube.firestoreRefs;
            const colRef = collection(nube.db, 'usuarios', uid, 'soportes');
            let q = query(colRef);
            if (opciones.desde) {
              q = query(colRef, where('fecha', '>=', opciones.desde));
            }
            const snap = await getDocs(q);
            nube.registrarConsumo('lectura', snap.size || 1);
            snap.forEach(d => {
              const data = d.data();
              if (!data.eliminadoEn) {
                memoriaNube.soportesHistoricos[d.id] = data;
              }
            });
          } catch (e) {
            console.warn('Error al cargar soportes históricos bajo demanda:', e);
          }
        }

        // Combinar memoria en tiempo real con datos históricos cargados
        const fuente = Object.assign({}, memoriaNube[coleccion] || {});
        if (coleccion === 'soportes') {
          Object.assign(fuente, memoriaNube.soportesHistoricos || {});
        }

        let items = Object.values(fuente).filter(item => !item.eliminadoEn);
        if (typeof filtroFn === 'function') {
          items = items.filter(filtroFn);
        }
        return items;
      }

      // Si no hay sesión en Firestore, pero Firebase está activo: no mostrar datos (A2)
      if (Delfos.nube && Delfos.nube.isConfigured && !Delfos.nube.currentUser) {
        return [];
      }

      // Fallback a IndexedDB local únicamente si Firebase no está configurado
      return IndexedDB_Repo.listar(coleccion, filtroFn);
    },

    /**
     * Obtener un registro por ID
     */
    obtener: async function(coleccion, id) {
      if (!id) return null;

      if (this.usarFirestore()) {
        // Buscar primero en memoria rápida
        if (memoriaNube[coleccion] && memoriaNube[coleccion][id]) {
          const item = memoriaNube[coleccion][id];
          return item.eliminadoEn ? null : item;
        }
        if (coleccion === 'soportes' && memoriaNube.soportesHistoricos[id]) {
          const item = memoriaNube.soportesHistoricos[id];
          return item.eliminadoEn ? null : item;
        }

        // Buscar en Firestore si no está en la memoria
        try {
          const uid = this.getUid();
          const { doc, getDoc } = Delfos.nube.firestoreRefs;
          const docRef = doc(Delfos.nube.db, 'usuarios', uid, coleccion, id);
          const snap = await getDoc(docRef);
          Delfos.nube.registrarConsumo('lectura', 1);
          if (snap.exists()) {
            const data = snap.data();
            return data.eliminadoEn ? null : data;
          }
          return null;
        } catch (e) {
          console.warn('Error al obtener documento:', e);
          return null;
        }
      }

      if (Delfos.nube && Delfos.nube.isConfigured && !Delfos.nube.currentUser) {
        return null;
      }

      return IndexedDB_Repo.obtener(coleccion, id);
    },

    /**
     * Guardar o actualizar un registro
     */
    guardar: async function(coleccion, item) {
      if (!item) throw new Error('Item no puede ser nulo');

      const clone = Object.assign({}, item);
      const ahora = new Date().toISOString();

      if (coleccion === 'configuracion') {
        clone.id = clone.clave || clone.id || 'config_general';
      } else {
        if (!clone.id) {
          clone.id = (window.crypto && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
      }

      if (clone.creadoEn === undefined) {
        clone.creadoEn = ahora;
      }
      clone.actualizadoEn = ahora;
      clone.eliminadoEn = null; // Activo

      if (this.usarFirestore()) {
        const uid = this.getUid();
        const nube = Delfos.nube;
        const { doc, setDoc } = nube.firestoreRefs;

        nube.actualizarIndicador('sincronizando');

        try {
          const docRef = doc(nube.db, 'usuarios', uid, coleccion, clone.id);
          await setDoc(docRef, clone, { merge: true });
          nube.registrarConsumo('escritura', 1);

          // Actualizar memoria local de inmediato para feedback instantáneo
          memoriaNube[coleccion] = memoriaNube[coleccion] || {};
          memoriaNube[coleccion][clone.id] = clone;

          return clone;
        } catch (err) {
          console.error('Error al guardar en Firestore (se conservará en caché local):', err);
          memoriaNube[coleccion] = memoriaNube[coleccion] || {};
          memoriaNube[coleccion][clone.id] = clone;
          nube.actualizarIndicador('offline');
          return clone;
        }
      }

      // Si no hay nube, guardar en IndexedDB local
      return IndexedDB_Repo.guardar(coleccion, clone);
    },

    /**
     * Guardar múltiples registros en lote (Batch Write máx 500 ops)
     */
    guardarLote: async function(coleccion, items) {
      if (!items || !items.length) return [];

      const ahora = new Date().toISOString();
      const procesados = items.map(item => {
        const clone = Object.assign({}, item);
        if (coleccion === 'configuracion') {
          clone.id = clone.clave || clone.id || 'config_general';
        } else if (!clone.id) {
          clone.id = (window.crypto && crypto.randomUUID) 
            ? crypto.randomUUID() 
            : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        if (clone.creadoEn === undefined) clone.creadoEn = ahora;
        clone.actualizadoEn = ahora;
        clone.eliminadoEn = null;
        return clone;
      });

      if (this.usarFirestore()) {
        const uid = this.getUid();
        const nube = Delfos.nube;
        const { doc, writeBatch } = nube.firestoreRefs;

        nube.actualizarIndicador('sincronizando');

        // Firestore permite máximo 500 operaciones por lote
        const TAMANO_LOTE = 450;
        for (let i = 0; i < procesados.length; i += TAMANO_LOTE) {
          const chunk = procesados.slice(i, i + TAMANO_LOTE);
          const batch = writeBatch(nube.db);

          chunk.forEach(item => {
            const docRef = doc(nube.db, 'usuarios', uid, coleccion, item.id);
            batch.set(docRef, item, { merge: true });
            memoriaNube[coleccion] = memoriaNube[coleccion] || {};
            memoriaNube[coleccion][item.id] = item;
          });

          await batch.commit();
          nube.registrarConsumo('escritura', chunk.length);
        }

        nube.actualizarIndicador('sincronizado');
        return procesados;
      }

      return IndexedDB_Repo.guardarLote(coleccion, procesados);
    },

    /**
     * Borrado lógico: coloca eliminadoEn con fecha y sincroniza a la nube
     */
    eliminar: async function(coleccion, id) {
      if (!id) return false;

      const ahora = new Date().toISOString();

      if (this.usarFirestore()) {
        const uid = this.getUid();
        const nube = Delfos.nube;
        const { doc, setDoc } = nube.firestoreRefs;

        nube.actualizarIndicador('sincronizando');

        try {
          const docRef = doc(nube.db, 'usuarios', uid, coleccion, id);
          // Borrado lógico para que otros dispositivos también reciban la eliminación
          await setDoc(docRef, { eliminadoEn: ahora, actualizadoEn: ahora }, { merge: true });
          nube.registrarConsumo('escritura', 1);

          if (memoriaNube[coleccion]) {
            delete memoriaNube[coleccion][id];
          }
          if (coleccion === 'soportes' && memoriaNube.soportesHistoricos) {
            delete memoriaNube.soportesHistoricos[id];
          }

          nube.actualizarIndicador('sincronizado');
          return true;
        } catch (e) {
          console.error('Error al eliminar en Firestore:', e);
          if (memoriaNube[coleccion]) delete memoriaNube[coleccion][id];
          return true;
        }
      }

      return IndexedDB_Repo.eliminar(coleccion, id);
    },

    /**
     * Contar registros con filtro opcional
     */
    contar: async function(coleccion, filtroFn) {
      const items = await this.listar(coleccion, filtroFn);
      return items.length;
    },

    /**
     * Helpers de configuración
     */
    obtenerConfig: async function(clave, valorPorDefecto = null) {
      const item = await this.obtener('configuracion', clave);
      return item ? item.valor : valorPorDefecto;
    },

    guardarConfig: async function(clave, valor) {
      return this.guardar('configuracion', {
        id: clave,
        clave: clave,
        valor: valor,
        actualizadoEn: new Date().toISOString()
      });
    },

    /**
     * Exporta toda la base de datos completa a un objeto JSON (desde la nube si está activa)
     */
    exportarTodo: async function() {
      if (this.usarFirestore()) {
        const exportData = {
          app: 'Delfos Support',
          version: 2,
          fuente: 'Cloud Firestore',
          fechaExportacion: new Date().toISOString(),
          colecciones: {}
        };

        for (const storeName of STORES) {
          exportData.colecciones[storeName] = await this.listar(storeName, null, { cargarHistorico: true });
        }
        return exportData;
      }

      return IndexedDB_Repo.exportarTodo();
    },

    /**
     * Restaura toda la base de datos desde un archivo JSON
     */
    restaurarTodo: async function(datosImportados) {
      if (!datosImportados || !datosImportados.colecciones) {
        throw new Error('Estructura de respaldo no válida.');
      }

      if (this.usarFirestore()) {
        for (const [colNombre, items] of Object.entries(datosImportados.colecciones)) {
          if (Array.isArray(items) && items.length > 0) {
            await this.guardarLote(colNombre, items);
          }
        }
        return true;
      }

      return IndexedDB_Repo.restaurarTodo(datosImportados);
    },

    /**
     * Limpia completamente todos los almacenes de datos
     */
    limpiarTodo: async function() {
      if (this.usarFirestore()) {
        // En Firestore realizar borrado lógico de todo
        for (const colNombre of STORES) {
          const items = await this.listar(colNombre);
          for (const it of items) {
            await this.eliminar(colNombre, it.id || it.clave);
          }
        }
        return true;
      }

      return IndexedDB_Repo.limpiarTodo();
    }
  };

  Delfos.DB = DB;
})(window.Delfos);
