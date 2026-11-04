/**
 * ==========================================================================
 * DELFOS SUPPORT - UTILIDADES GENERALES
 * Formateo de fechas dd/mm/aaaa, hora 24h, toasts con deshacer, modales, CSV
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  const Utils = {
    /**
     * Devuelve la fecha actual en formato ISO YYYY-MM-DD
     */
    fechaHoyISO: function() {
      const hoy = new Date();
      const a = hoy.getFullYear();
      const m = String(hoy.getMonth() + 1).padStart(2, '0');
      const d = String(hoy.getDate()).padStart(2, '0');
      return `${a}-${m}-${d}`;
    },

    /**
     * Devuelve la hora actual en formato 24h HH:MM
     */
    horaActual24: function() {
      const hoy = new Date();
      const h = String(hoy.getHours()).padStart(2, '0');
      const m = String(hoy.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    },

    /**
     * Formatea una fecha ISO (YYYY-MM-DD) a dd/mm/aaaa
     */
    formatearFecha: function(fechaStr) {
      if (!fechaStr) return '-';
      try {
        const partes = fechaStr.split('T')[0].split('-');
        if (partes.length === 3) {
          return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
      } catch (e) {
        // Fallback
      }
      return fechaStr;
    },

    /**
     * Formatea fecha y hora: dd/mm/aaaa HH:MM
     */
    formatearFechaHora: function(fechaStr, horaStr) {
      const f = this.formatearFecha(fechaStr);
      return horaStr ? `${f} ${horaStr}` : f;
    },

    /**
     * Calcula diferencia de días entre dos fechas ISO
     */
    diasDiferencia: function(fechaIso1, fechaIso2) {
      if (!fechaIso1 || !fechaIso2) return 0;
      const d1 = new Date(fechaIso1);
      const d2 = new Date(fechaIso2);
      const diffTime = Math.abs(d2 - d1);
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    },

    /**
     * Sanitiza cadenas para evitar inyecciones HTML
     */
    escapeHTML: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    },

    /**
     * Sistema de Notificaciones Toast con soporte para botón de acción (ej. Deshacer)
     */
    showToast: function(mensaje, tipo = 'info', duracion = 3800, accionTexto = null, accionCallback = null) {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${tipo}`;

      let iconoClase = 'fa-info-circle';
      if (tipo === 'success') iconoClase = 'fa-check-circle';
      if (tipo === 'error') iconoClase = 'fa-triangle-exclamation';

      let accionBtnHtml = '';
      if (accionTexto && typeof accionCallback === 'function') {
        accionBtnHtml = `<button class="toast-action-btn" type="button">${this.escapeHTML(accionTexto)}</button>`;
      }

      toast.innerHTML = `
        <div class="toast-content">
          <i class="fa-solid ${iconoClase}"></i>
          <span>${this.escapeHTML(mensaje)}</span>
        </div>
        ${accionBtnHtml}
      `;

      if (accionTexto && typeof accionCallback === 'function') {
        const btn = toast.querySelector('.toast-action-btn');
        btn.addEventListener('click', () => {
          accionCallback();
          toast.remove();
        });
      }

      container.appendChild(toast);

      const timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duracion);

      toast.addEventListener('click', (e) => {
        if (!e.target.classList.contains('toast-action-btn')) {
          clearTimeout(timer);
          toast.remove();
        }
      });
    },

    /**
     * Control de Modales
     */
    openModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        const focusable = modal.querySelector('input:not([type=hidden]), select, textarea, button.btn-primary');
        if (focusable) {
          setTimeout(() => focusable.focus(), 80);
        }
      }
    },

    closeModal: function(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('open');
        const openModals = document.querySelectorAll('.modal-overlay.open');
        if (openModals.length === 0) {
          document.body.style.overflow = '';
        }
      }
    },

    /**
     * Descarga de archivos Blob/Texto
     */
    descargarArchivo: function(nombreArchivo, contenido, tipoMime = 'application/json') {
      const blob = new Blob([contenido], { type: tipoMime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },

    /**
     * Exporta datos en memoria a un archivo CSV estructurado
     */
    exportarACSV: function(nombreArchivo, encabezados, filas) {
      let csvContent = '\uFEFF'; // BOM para que Excel respete tildes y caracteres en español
      csvContent += encabezados.map(h => `"${(h || '').toString().replace(/"/g, '""')}"`).join(';') + '\r\n';

      filas.forEach(fila => {
        const filaStr = fila.map(val => `"${(val === undefined || val === null ? '' : val).toString().replace(/"/g, '""')}"`).join(';');
        csvContent += filaStr + '\r\n';
      });

      this.descargarArchivo(nombreArchivo, csvContent, 'text/csv;charset=utf-8;');
    },

    /**
     * Convierte un archivo de imagen local a Data URL Base64
     */
    leerArchivoBase64: function(archivo) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(archivo);
      });
    }
  };

  Delfos.Utils = Utils;
})(window.Delfos);
