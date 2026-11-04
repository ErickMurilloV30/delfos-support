/**
 * ==========================================================================
 * DELFOS SUPPORT - CAPA DE ACCESO A DATOS (INDEXEDDB REPOSITORY)
 * Repositorio desacoplado: DB.listar, DB.obtener, DB.guardar, DB.eliminar
 * Permite migrar en el futuro a Firebase/Supabase sin tocar las vistas.
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

  let dbInstance = null;

  const DB = {
    /**
     * Inicializa la base de datos IndexedDB y crea los almacenes necesarios
     */
    init: function() {
      return new Promise((resolve, reject) => {
        if (dbInstance) {
          return resolve(dbInstance);
        }

        if (!window.indexedDB) {
          const err = new Error('IndexedDB no está soportado en este navegador.');
          console.error(err);
          return reject(err);
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
                // Índices útiles
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
          dbInstance = event.target.result;
          resolve(dbInstance);
        };

        request.onerror = function(event) {
          console.error('Error al abrir IndexedDB:', event.target.error);
          reject(event.target.error);
        };
      });
    },

    /**
     * Lista todos los registros de una colección, con filtro opcional
     */
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

        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    },

    /**
     * Obtiene un registro por su clave primaria
     */
    obtener: async function(coleccion, id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readonly');
        const store = transaction.objectStore(coleccion);
        const request = store.get(id);

        request.onsuccess = function() {
          resolve(request.result || null);
        };

        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    },

    /**
     * Guarda o actualiza un registro (asigna ID si no tiene)
     */
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
          if (clone.creadoEn === undefined) {
            clone.creadoEn = new Date().toISOString();
          }
          clone.actualizadoEn = new Date().toISOString();
        }

        const transaction = db.transaction([coleccion], 'readwrite');
        const store = transaction.objectStore(coleccion);
        const request = store.put(clone);

        request.onsuccess = function() {
          resolve(clone);
        };

        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    },

    /**
     * Guarda múltiples registros en una sola transacción
     */
    guardarLote: async function(coleccion, items) {
      if (!items || !items.length) return [];
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readwrite');
        const store = transaction.objectStore(coleccion);
        const guardados = [];

        items.forEach(item => {
          const clone = Object.assign({}, item);
          if (coleccion !== 'configuracion') {
            if (!clone.id) {
              clone.id = (window.crypto && crypto.randomUUID) 
                ? crypto.randomUUID() 
                : 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            if (clone.creadoEn === undefined) {
              clone.creadoEn = new Date().toISOString();
            }
          }
          store.put(clone);
          guardados.push(clone);
        });

        transaction.oncomplete = function() {
          resolve(guardados);
        };

        transaction.onerror = function(event) {
          reject(event.target.error);
        };
      });
    },

    /**
     * Elimina un registro por ID
     */
    eliminar: async function(coleccion, id) {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([coleccion], 'readwrite');
        const store = transaction.objectStore(coleccion);
        const request = store.delete(id);

        request.onsuccess = function() {
          resolve(true);
        };

        request.onerror = function(event) {
          reject(event.target.error);
        };
      });
    },

    /**
     * Cuenta registros que cumplan con una condición opcional
     */
    contar: async function(coleccion, filtroFn) {
      const items = await this.listar(coleccion, filtroFn);
      return items.length;
    },

    /**
     * Atajos para leer/guardar valores de configuración
     */
    obtenerConfig: async function(clave, valorPorDefecto = null) {
      const item = await this.obtener('configuracion', clave);
      return item ? item.valor : valorPorDefecto;
    },

    guardarConfig: async function(clave, valor) {
      return this.guardar('configuracion', { clave: clave, valor: valor, actualizadoEn: new Date().toISOString() });
    },

    /**
     * Exporta toda la base de datos completa a un objeto JSON
     */
    exportarTodo: async function() {
      const db = await this.init();
      const exportData = {
        app: 'Delfos Support',
        version: 1,
        fechaExportacion: new Date().toISOString(),
        colecciones: {}
      };

      for (const storeName of STORES) {
        exportData.colecciones[storeName] = await this.listar(storeName);
      }

      return exportData;
    },

    /**
     * Restaura toda la base de datos a partir de un objeto JSON validado
     */
    restaurarTodo: async function(datosImportados) {
      if (!datosImportados || !datosImportados.colecciones) {
        throw new Error('Estructura de respaldo no válida.');
      }

      const db = await this.init();

      for (const storeName of STORES) {
        if (Array.isArray(datosImportados.colecciones[storeName])) {
          const transaction = db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          store.clear();
          for (const item of datosImportados.colecciones[storeName]) {
            store.put(item);
          }
          await new Promise((res, rej) => {
            transaction.oncomplete = res;
            transaction.onerror = rej;
          });
        }
      }

      return true;
    },

    /**
     * Limpia completamente todos los almacenes de datos
     */
    limpiarTodo: async function() {
      const db = await this.init();
      for (const storeName of STORES) {
        const transaction = db.transaction([storeName], 'readwrite');
        transaction.objectStore(storeName).clear();
        await new Promise((res, rej) => {
          transaction.oncomplete = res;
          transaction.onerror = rej;
        });
      }
      return true;
    }
  };

  Delfos.DB = DB;
})(window.Delfos);
