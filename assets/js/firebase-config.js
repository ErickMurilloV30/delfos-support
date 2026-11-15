/**
 * ==========================================================================
 * DELFOS SUPPORT - CONFIGURACIÓN DE FIREBASE (NUBE)
 * ==========================================================================
 * 
 * INSTRUCCIONES PARA EL TÉCNICO:
 * 1. Crea tu proyecto gratuito en https://console.firebase.google.com
 * 2. Registra una aplicación web y copia los valores de firebaseConfig aquí abajo.
 * 3. Reemplaza los textos "TU_API_KEY", "TU_PROYECTO", etc. por tus credenciales reales.
 * 
 * NOTA DE SEGURIDAD:
 * La apiKey de Firebase es pública por diseño en aplicaciones web de cliente.
 * La verdadera seguridad de tus datos está garantizada al 100% por las Reglas de
 * Seguridad de Cloud Firestore (archivo firestore.rules), las cuales exigen que
 * únicamente tu usuario autenticado (request.auth.uid == uid) pueda leer o escribir.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

let customConfig = null;
try {
  customConfig = JSON.parse(localStorage.getItem('delfos_firebase_config_custom') || 'null');
} catch (e) {}

window.Delfos.firebaseConfig = customConfig || {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROYECTO.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROYECTO.firebasestorage.app",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};
