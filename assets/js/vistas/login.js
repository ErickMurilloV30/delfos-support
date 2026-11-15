/**
 * ==========================================================================
 * DELFOS SUPPORT - VISTA: INICIO DE SESIÓN (FIREBASE AUTH)
 * ==========================================================================
 * Pantalla institucional verde/dorada. Sesión persistente.
 * Sin sesión iniciada ningún dato es accesible ni visible.
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};
window.Delfos.Vistas = window.Delfos.Vistas || {};

(function(Delfos) {
  'use strict';

  const Login = {
    render: function(container) {
      const isConfigured = Delfos.nube && Delfos.nube.isConfigured;

      container.innerHTML = `
        <div class="login-wrapper">
          <div class="login-card">
            <!-- Encabezado Institucional -->
            <div class="login-header">
              <div class="brand-badge-login">
                <span class="dot-login"></span>
                <span>Unidad Educativa Delfos</span>
              </div>
              <div class="login-logo-box">
                <div class="login-logo-emblem">D</div>
                <div>
                  <h1 class="login-title">Delfos <span>Support</span></h1>
                  <p class="login-subtitle">Gestión Técnica TI &middot; Acceso Seguro</p>
                </div>
              </div>
            </div>

            <!-- Cuerpo del Formulario -->
            <div class="login-body">
              ${!isConfigured ? `
                <div class="login-setup-warning">
                  <div class="setup-warning-header">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <strong>Paso previo: Conectar tu Nube de Firebase</strong>
                  </div>
                  <p style="margin-bottom:0.75rem;">
                    Los campos de correo y contraseña están bloqueados temporalmente porque aún no se han colocado tus credenciales reales en <code>assets/js/firebase-config.js</code>.
                  </p>
                  <button type="button" class="btn btn-sm btn-dorado" style="width:100%; font-weight:700;" onclick="Delfos.Vistas.Login.mostrarModalConfigurarClaves()">
                    <i class="fa-solid fa-key"></i> Pegar credenciales de Firebase aquí
                  </button>
                </div>
              ` : ''}

              <div id="login-error-box" class="login-error-alert" style="display:none;"></div>

              <form id="form-login-tecnico" onsubmit="event.preventDefault(); Delfos.Vistas.Login.enviarLogin();">
                <div class="form-group">
                  <label class="form-label" for="login-email">
                    <span><i class="fa-regular fa-envelope" style="color:var(--verde); margin-right:4px;"></i> Correo Electrónico</span>
                  </label>
                  <input type="email" id="login-email" class="form-control" placeholder="tu.correo@delfos.edu.ec" required autocomplete="username" ${!isConfigured ? 'disabled' : ''}>
                </div>

                <div class="form-group" style="margin-bottom:1.75rem;">
                  <label class="form-label" for="login-password">
                    <span><i class="fa-solid fa-lock" style="color:var(--verde); margin-right:4px;"></i> Contraseña</span>
                  </label>
                  <input type="password" id="login-password" class="form-control" placeholder="••••••••" required autocomplete="current-password" ${!isConfigured ? 'disabled' : ''}>
                </div>

                <button type="submit" id="btn-submit-login" class="btn btn-primary btn-login-submit" ${!isConfigured ? 'disabled' : ''}>
                  <i class="fa-solid fa-right-to-bracket"></i>
                  <span>Iniciar Sesión</span>
                </button>
              </form>

              <div class="login-footer-info">
                <i class="fa-solid fa-cloud" style="color:var(--verde);"></i>
                <span>Sincronización segura protegida por Cloud Firestore</span>
              </div>
            </div>
          </div>
        </div>
      `;
    },

    enviarLogin: async function() {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      const btnSubmit = document.getElementById('btn-submit-login');
      const errorBox = document.getElementById('login-error-box');

      if (!emailInput || !passInput) return;

      const email = emailInput.value.trim();
      const pass = passInput.value;

      if (!email || !pass) {
        this.mostrarError('Por favor completa tu correo y contraseña.');
        return;
      }

      // Estado de carga
      btnSubmit.disabled = true;
      btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Verificando...</span>`;
      errorBox.style.display = 'none';

      try {
        await Delfos.nube.iniciarSesion(email, pass);
        // El observer de Firebase (onAuthStateChanged) levantará la app shell automáticamente
      } catch (err) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> <span>Iniciar Sesión</span>`;
        this.mostrarError(err.message || 'Error al iniciar sesión.');
      }
    },

    mostrarError: function(msg) {
      const errorBox = document.getElementById('login-error-box');
      if (errorBox) {
        errorBox.textContent = msg;
        errorBox.style.display = 'block';
      }
    },

    mostrarModalConfigurarClaves: function() {
      const texto = prompt('Pega aquí el bloque de código o JSON de firebaseConfig que te dio Firebase Console (ej: const firebaseConfig = { apiKey: "AIza...", ... }):');
      if (!texto) return;

      try {
        let configObj = null;
        // Intentar parsear como JSON directo o extraer campos por regex
        if (texto.trim().startsWith('{')) {
          configObj = JSON.parse(texto);
        } else {
          // Extraer campos clave
          const extraer = (campo) => {
            const m = texto.match(new RegExp(`${campo}["'\\s]*:?["'\\s]*([^"',\\s\\n\\r]+)`));
            return m ? m[1].replace(/["',;]/g, '').trim() : '';
          };
          configObj = {
            apiKey: extraer('apiKey'),
            authDomain: extraer('authDomain'),
            projectId: extraer('projectId'),
            storageBucket: extraer('storageBucket'),
            messagingSenderId: extraer('messagingSenderId'),
            appId: extraer('appId')
          };
        }

        if (configObj && configObj.apiKey && configObj.projectId) {
          localStorage.setItem('delfos_firebase_config_custom', JSON.stringify(configObj));
          alert('¡Credenciales de Firebase guardadas correctamente! La página se recargará ahora para conectar tu nube.');
          window.location.reload();
        } else {
          alert('No se pudieron detectar las claves apiKey o projectId en el texto pegado. Verifica el código de Firebase Console.');
        }
      } catch (e) {
        alert('Error al leer las credenciales: ' + e.message);
      }
    }
  };

  Delfos.Vistas.Login = Login;
})(window.Delfos);
