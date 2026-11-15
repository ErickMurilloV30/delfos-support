/**
 * ==========================================================================
 * DELFOS SUPPORT - INICIALIZADOR DE FIREBASE (ES MODULE)
 * ==========================================================================
 * Carga Firebase Auth y Cloud Firestore desde CDN oficial gstatic (v10.14.1).
 * Activa caché persistente multi-pestaña para trabajar 100% sin conexión.
 * Expone la API de nube en window.Delfos.nube para el resto de la aplicación.
 * ==========================================================================
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

window.Delfos = window.Delfos || {};

(function() {
  const config = window.Delfos.firebaseConfig || {};
  const isConfigured = Boolean(
    config.apiKey && 
    config.apiKey !== 'TU_API_KEY' && 
    !config.apiKey.includes('TU_') &&
    config.projectId &&
    !config.projectId.includes('TU_')
  );

  // Inicializar o leer estadísticas de consumo diario (Spark monitoring)
  const hoyStr = new Date().toISOString().split('T')[0];
  let statsHoy = { lecturas: 0, escrituras: 0, fecha: hoyStr };
  try {
    const guardadas = JSON.parse(localStorage.getItem('delfos_firebase_stats') || '{}');
    if (guardadas.fecha === hoyStr) {
      statsHoy = guardadas;
    }
  } catch (e) {
    // ignorar error de localStorage
  }

  function registrarConsumo(tipo, cantidad = 1) {
    if (tipo === 'lectura') statsHoy.lecturas += cantidad;
    if (tipo === 'escritura') statsHoy.escrituras += cantidad;
    try {
      localStorage.setItem('delfos_firebase_stats', JSON.stringify(statsHoy));
      // Notificar si está abierta la pestaña de configuración
      const elContador = document.getElementById('firebase-consumo-estimado');
      if (elContador) {
        elContador.textContent = `Lecturas hoy: ~${statsHoy.lecturas} | Escrituras hoy: ~${statsHoy.escrituras}`;
      }
    } catch (e) {}
  }

  // Estructura de la API pública en window.Delfos.nube
  const Nube = {
    isConfigured: isConfigured,
    app: null,
    auth: null,
    db: null,
    currentUser: null,
    syncState: 'sincronizado', // 'sincronizado' | 'sincronizando' | 'offline'
    pendingWritesCount: 0,
    authListeners: [],
    collectionListeners: {},
    statsHoy: statsHoy,
    registrarConsumo: registrarConsumo,

    /**
     * Actualiza el indicador visual en el Sidebar y Topbar
     */
    actualizarIndicador: function(estado, pendientes = 0) {
      this.syncState = estado;
      this.pendingWritesCount = pendientes;

      // Sidebar indicator
      const elSidebar = document.getElementById('sync-status-sidebar');
      if (elSidebar) {
        if (!navigator.onLine || estado === 'offline') {
          elSidebar.className = 'sync-status-indicator status-offline';
          elSidebar.innerHTML = `
            <span class="status-dot-offline"></span>
            <span>Sin conexión ${pendientes > 0 ? `· ${pendientes} pendientes` : ''}</span>
          `;
        } else if (estado === 'sincronizando') {
          elSidebar.className = 'sync-status-indicator status-sincronizando';
          elSidebar.innerHTML = `
            <span class="status-dot-pulse-gold"></span>
            <span>Sincronizando…</span>
          `;
        } else {
          elSidebar.className = 'sync-status-indicator status-sincronizado';
          elSidebar.innerHTML = `
            <span class="status-dot-pulse"></span>
            <span>Sincronizado en la nube</span>
          `;
        }
      }

      // Topbar chip (móvil y escritorio)
      const elTopbar = document.getElementById('sync-status-topbar');
      if (elTopbar) {
        if (!navigator.onLine || estado === 'offline') {
          elTopbar.className = 'sync-status-chip chip-offline';
          elTopbar.title = 'Modo fuera de línea: los cambios se guardan localmente';
          elTopbar.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="color:#9CA3AF;"></i> <span>${pendientes > 0 ? `${pendientes} pend.` : 'Offline'}</span>`;
        } else if (estado === 'sincronizando') {
          elTopbar.className = 'sync-status-chip chip-sincronizando';
          elTopbar.title = 'Sincronizando cambios con Firestore...';
          elTopbar.innerHTML = `<i class="fa-solid fa-arrows-rotate fa-spin" style="color:var(--dorado);"></i> <span>Sincronizando</span>`;
        } else {
          elTopbar.className = 'sync-status-chip chip-sincronizado';
          elTopbar.title = 'Conectado y sincronizado con la nube de Delfos';
          elTopbar.innerHTML = `<i class="fa-solid fa-cloud-check" style="color:var(--verde);"></i> <span>Nube OK</span>`;
        }
      }
    },

    /**
     * Iniciar sesión con correo y contraseña
     */
    iniciarSesion: async function(email, password) {
      if (!this.isConfigured || !this.auth) {
        throw new Error('Firebase no está configurado aún. Revisa assets/js/firebase-config.js y SETUP-FIREBASE.md');
      }

      try {
        const cred = await signInWithEmailAndPassword(this.auth, email.trim(), password);
        this.currentUser = cred.user;
        return cred.user;
      } catch (err) {
        console.error('Error de autenticación Firebase:', err);
        let mensajeEsp = 'Error al iniciar sesión. Intenta de nuevo.';
        switch (err.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            mensajeEsp = 'Correo o contraseña incorrectos.';
            break;
          case 'auth/invalid-email':
            mensajeEsp = 'El formato del correo electrónico no es válido.';
            break;
          case 'auth/user-disabled':
            mensajeEsp = 'Esta cuenta técnica ha sido deshabilitada.';
            break;
          case 'auth/too-many-requests':
            mensajeEsp = 'Demasiados intentos fallidos. Por seguridad, espera unos minutos.';
            break;
          case 'auth/network-request-failed':
            mensajeEsp = 'Sin conexión a internet. Verifica tu red Wi-Fi o datos móviles.';
            break;
          case 'auth/unauthorized-domain':
            mensajeEsp = 'Dominio no autorizado en Firebase. Añade erickmurillov30.github.io en Authorized Domains (ver SETUP-FIREBASE.md Paso 6).';
            break;
          default:
            mensajeEsp = err.message || mensajeEsp;
        }
        throw new Error(mensajeEsp);
      }
    },

    /**
     * Cerrar sesión técnica
     */
    cerrarSesion: async function() {
      if (!this.auth) return;
      // Detener todos los listeners en tiempo real
      this.detenerTodosListeners();
      await signOut(this.auth);
      this.currentUser = null;
      // Recargar o limpiar estado
      window.location.hash = '';
      window.location.reload();
    },

    /**
     * Suscribirse a cambios de autenticación
     */
    onAuthChange: function(fn) {
      if (typeof fn === 'function') {
        this.authListeners.push(fn);
        if (this.currentUser !== undefined) {
          fn(this.currentUser);
        }
      }
    },

    detenerTodosListeners: function() {
      Object.values(this.collectionListeners).forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      this.collectionListeners = {};
    },

    // Referencias nativas exportadas para la capa DB
    firestoreRefs: {
      collection,
      doc,
      getDoc,
      getDocs,
      setDoc,
      deleteDoc,
      query,
      where,
      orderBy,
      limit,
      onSnapshot,
      writeBatch,
      serverTimestamp
    }
  };

  // Monitoreo de conectividad del navegador
  window.addEventListener('online', () => {
    Nube.actualizarIndicador('sincronizando');
    setTimeout(() => Nube.actualizarIndicador('sincronizado'), 2000);
  });
  window.addEventListener('offline', () => {
    Nube.actualizarIndicador('offline');
  });

  // Inicialización de servicios si la configuración es válida
  if (isConfigured) {
    try {
      const app = initializeApp(config);
      const auth = getAuth(app);
      setPersistence(auth, browserLocalPersistence).catch(console.warn);

      // Firestore con caché multi-pestaña offline persistente
      const db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });

      Nube.app = app;
      Nube.auth = auth;
      Nube.db = db;

      // Escuchar estado de autenticación de forma reactiva
      onAuthStateChanged(auth, (user) => {
        Nube.currentUser = user || null;
        Nube.authListeners.forEach(fn => fn(user));
        window.dispatchEvent(new CustomEvent('delfos-auth-state-changed', { detail: { user } }));
      });
    } catch (err) {
      console.error('Error al inicializar Firebase SDK:', err);
    }
  }

  window.Delfos.nube = Nube;
  window.dispatchEvent(new CustomEvent('delfos-firebase-ready'));
})();
