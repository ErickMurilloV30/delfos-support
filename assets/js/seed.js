/**
 * ==========================================================================
 * DELFOS SUPPORT - DATOS INICIALES Y GENERADOR DE DATOS DE EJEMPLO
 * Catálogos predefinidos, edificios Delfos, tipos y generador de 3 meses
 * ==========================================================================
 */

window.Delfos = window.Delfos || {};

(function(Delfos) {
  'use strict';

  const Seed = {
    /**
     * Carga los catálogos base si la base de datos está recién creada
     */
    inicializarBaseSiVacia: async function() {
      const yaCargado = await Delfos.DB.obtenerConfig('esquemaInicialCargado', false);
      if (yaCargado) return;

      // 1. Edificios Iniciales
      const edificios = [
        { id: 'edif_principal', nombre: 'Edificio Principal', referencia: 'Incluye extensión', orden: 1, activo: true },
        { id: 'edif_admin', nombre: 'Edificio Administrativo', referencia: '', orden: 2, activo: true },
        { id: 'edif_delfolandia', nombre: 'Delfolandia', referencia: 'Salones, 2 laboratorios, DECE, Médico y otros deptos', orden: 3, activo: true }
      ];
      await Delfos.DB.guardarLote('edificios', edificios);

      // 2. Tipos de Ubicación
      const tiposUbicacion = [
        { id: 'tipo_ub_salon', nombre: 'Salón de clases', orden: 1, activo: true },
        { id: 'tipo_ub_lab', nombre: 'Laboratorio', orden: 2, activo: true },
        { id: 'tipo_ub_oficina', nombre: 'Oficina/Departamento', orden: 3, activo: true },
        { id: 'tipo_ub_area_admin', nombre: 'Área administrativa', orden: 4, activo: true },
        { id: 'tipo_ub_otro', nombre: 'Otro', orden: 5, activo: true }
      ];
      await Delfos.DB.guardarLote('tiposUbicacion', tiposUbicacion);

      // 3. Ubicaciones Iniciales precargadas en Delfolandia
      const ubicaciones = [
        { id: 'ub_delfo_dece', edificioId: 'edif_delfolandia', tipoId: 'tipo_ub_oficina', nombre: 'DECE', referencia: 'Planta Baja', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_delfo_medico', edificioId: 'edif_delfolandia', tipoId: 'tipo_ub_oficina', nombre: 'Médico', referencia: 'Consultorio médico escolar', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_delfo_lab1', edificioId: 'edif_delfolandia', tipoId: 'tipo_ub_lab', nombre: 'Laboratorio 1', referencia: 'Informática Primaria', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_delfo_lab2', edificioId: 'edif_delfolandia', tipoId: 'tipo_ub_lab', nombre: 'Laboratorio 2', referencia: 'Informática Secundaria', revisadoEn: new Date().toISOString(), activo: true }
      ];
      await Delfos.DB.guardarLote('ubicaciones', ubicaciones);

      // 4. Tipos de Equipo con prefijo e ícono de Font Awesome
      const tiposEquipo = [
        { id: 'tipo_pc', nombre: 'Computadora', prefijo: 'PC', icono: 'fa-desktop', orden: 1, activo: true },
        { id: 'tipo_lap', nombre: 'Laptop', prefijo: 'LAP', icono: 'fa-laptop', orden: 2, activo: true },
        { id: 'tipo_tab', nombre: 'Tablet', prefijo: 'TAB', icono: 'fa-tablet-screen-button', orden: 3, activo: true },
        { id: 'tipo_mon', nombre: 'Monitor', prefijo: 'MON', icono: 'fa-display', orden: 4, activo: true },
        { id: 'tipo_pry', nombre: 'Proyector', prefijo: 'PRY', icono: 'fa-video', orden: 5, activo: true },
        { id: 'tipo_pin', nombre: 'Pantalla interactiva', prefijo: 'PIN', icono: 'fa-chalkboard-user', orden: 6, activo: true },
        { id: 'tipo_bar', nombre: 'Barra de sonido', prefijo: 'BAR', icono: 'fa-volume-high', orden: 7, activo: true },
        { id: 'tipo_par', nombre: 'Parlante', prefijo: 'PAR', icono: 'fa-bullhorn', orden: 8, activo: true },
        { id: 'tipo_imp', nombre: 'Impresora', prefijo: 'IMP', icono: 'fa-print', orden: 9, activo: true },
        { id: 'tipo_sw', nombre: 'Switch', prefijo: 'SW', icono: 'fa-network-wired', orden: 10, activo: true },
        { id: 'tipo_rt', nombre: 'Router', prefijo: 'RT', icono: 'fa-wifi', orden: 11, activo: true },
        { id: 'tipo_ap', nombre: 'Access Point', prefijo: 'AP', icono: 'fa-tower-broadcast', orden: 12, activo: true },
        { id: 'tipo_ups', nombre: 'UPS', prefijo: 'UPS', icono: 'fa-car-battery', orden: 13, activo: true }
      ];
      await Delfos.DB.guardarLote('tiposEquipo', tiposEquipo);

      // 5. Categorías
      const categoriasNombres = [
        'Computadora', 'Red', 'Internet', 'Monitor', 'Proyector',
        'Pantalla interactiva', 'Impresora', 'Audio', 'Mouse',
        'Teclado', 'HDMI', 'Cable de red', 'Switch', 'Router',
        'UPS', 'Software', 'Windows', 'Office', 'Google Workspace', 'Correo', 'Otro'
      ];
      const categorias = categoriasNombres.map((nombre, i) => ({
        id: 'cat_' + nombre.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        nombre: nombre,
        orden: i + 1,
        activo: true
      }));
      await Delfos.DB.guardarLote('categorias', categorias);

      // 6. Tipos de Problema vinculados a categorías
      const problemasPorCategoria = {
        'cat_computadora': ['No enciende', 'Lenta / Congelada', 'Pantalla azul', 'Virus / Malware', 'Fallo de disco', 'Ventilador ruidoso'],
        'cat_internet': ['Sin acceso a Internet', 'Navegación lenta', 'Desconexión intermitente', 'Fallo de DNS', 'Portal cautivo bloqueado'],
        'cat_red': ['Cable de red desconectado', 'Conflicto de IP', 'Sin acceso a recursos compartidos', 'Toma de pared dañada'],
        'cat_monitor': ['Sin video / Pantalla negra', 'Parpadeo constante', 'Líneas en pantalla', 'Resolución distorsionada'],
        'cat_proyector': ['Sin señal de video', 'Lámpara agotada / Luz roja', 'Imagen borrosa / Fuera de foco', 'Control no responde'],
        'cat_pantalla_interactiva': ['Táctil no responde', 'Sin imagen', 'No emite sonido', 'Calibración corrida'],
        'cat_impresora': ['No imprime', 'Atasco de papel', 'Tóner / Tinta agotada', 'Mancha o raya las hojas', 'Desconectada de la red'],
        'cat_audio': ['Sin sonido en parlantes', 'Sonido con estática', 'Micrófono no capta voz', 'Cable de 3.5mm roto'],
        'cat_mouse': ['Puntero no responde', 'Clic izquierdo dañado', 'Cable roto o conector flojo'],
        'cat_teclado': ['Teclas no responden', 'Derrame de líquido', 'Conector USB dañado'],
        'cat_hdmi': ['Sin señal de audio/video', 'Punta HDMI doblada', 'Se corta al mover el cable'],
        'cat_cable_de_red': ['Conector RJ45 quebrado', 'Sin continuidad en cable', 'Cable pisado / cortado'],
        'cat_switch': ['Puerto inactivo', 'Reinicio constante', 'Bucle de red en switch'],
        'cat_router': ['Sin emisión de WiFi', 'Luz roja en internet', 'Configuración desajustada'],
        'cat_ups': ['Alarma sonora continua', 'No retiene carga al corte', 'Sobrecalentamiento'],
        'cat_software': ['Programa no inicia', 'Error de archivo DLL', 'Falta permiso de administrador'],
        'cat_windows': ['Bucle de reinicio en Windows Update', 'Pantalla de reparación', 'Perfil de usuario temporal'],
        'cat_office': ['Error de licencia / Activación', 'Excel se congela al abrir', 'Outlook no envía correos'],
        'cat_google_workspace': ['Cuenta bloqueada o suspendida', 'Acceso denegado a Google Drive', 'Fallo de sincronización'],
        'cat_correo': ['Buzón lleno', 'Contraseña expirada', 'Rechazo de correos salientes'],
        'cat_otro': ['Solicitud de asistencia general', 'Reubicación física de equipo', 'Capacitación al docente']
      };

      const tiposProblema = [];
      let probIndex = 1;
      for (const [catId, lista] of Object.entries(problemasPorCategoria)) {
        lista.forEach(nomProblema => {
          tiposProblema.push({
            id: 'prob_' + probIndex++,
            categoriaId: catId,
            nombre: nomProblema,
            orden: probIndex,
            activo: true
          });
        });
      }
      await Delfos.DB.guardarLote('tiposProblema', tiposProblema);

      // 7. Tipos de Actividad
      const tiposActividad = [
        { id: 'act_correctivo', nombre: 'Soporte correctivo', esMantenimiento: false, esInstalacion: false, orden: 1, activo: true },
        { id: 'act_preventivo', nombre: 'Mantenimiento preventivo', esMantenimiento: true, esInstalacion: false, orden: 2, activo: true },
        { id: 'act_instalacion', nombre: 'Instalación', esMantenimiento: false, esInstalacion: true, orden: 3, activo: true },
        { id: 'act_configuracion', nombre: 'Configuración', esMantenimiento: false, esInstalacion: false, orden: 4, activo: true },
        { id: 'act_actualizacion', nombre: 'Actualización', esMantenimiento: false, esInstalacion: false, orden: 5, activo: true },
        { id: 'act_reemplazo', nombre: 'Reemplazo de equipo', esMantenimiento: false, esInstalacion: true, orden: 6, activo: true },
        { id: 'act_cambio_comp', nombre: 'Cambio de componente', esMantenimiento: false, esInstalacion: false, orden: 7, activo: true },
        { id: 'act_inventario', nombre: 'Inventario', esMantenimiento: false, esInstalacion: false, orden: 8, activo: true },
        { id: 'act_etiquetado', nombre: 'Etiquetado', esMantenimiento: false, esInstalacion: false, orden: 9, activo: true },
        { id: 'act_otro', nombre: 'Otro', esMantenimiento: false, esInstalacion: false, orden: 10, activo: true }
      ];
      await Delfos.DB.guardarLote('tiposActividad', tiposActividad);

      // 8. Estados
      const estados = [
        { id: 'est_pendiente', nombre: 'Pendiente', color: '#F59E0B', esFinal: false, porDefecto: false, orden: 1, activo: true },
        { id: 'est_proceso', nombre: 'En proceso', color: '#3B82F6', esFinal: false, porDefecto: false, orden: 2, activo: true },
        { id: 'est_resuelto', nombre: 'Resuelto', color: '#16A34A', esFinal: true, porDefecto: true, orden: 3, activo: true }
      ];
      await Delfos.DB.guardarLote('estados', estados);

      // 9. Plantillas Rápidas iniciales
      const plantillas = [
        {
          id: 'plant_mantenimiento_lab',
          nombre: 'Mantenimiento preventivo laboratorio',
          categoriaId: 'cat_computadora',
          tipoActividadId: 'act_preventivo',
          estadoId: 'est_resuelto',
          descripcion: 'Limpieza interna de polvo, optimización de sistema operativo, comprobación de antivirus y soplado de fuentes.',
          solucion: 'Mantenimiento preventivo completado en todas las estaciones de trabajo del aula.',
          observaciones: 'Todas las máquinas quedaron operativas y probadas en red.',
          activo: true
        },
        {
          id: 'plant_proyector_audio',
          nombre: 'Revisión rápida de proyector y audio',
          categoriaId: 'cat_proyector',
          tipoActividadId: 'act_correctivo',
          estadoId: 'est_resuelto',
          descripcion: 'Docente reporta que no proyecta y el parlante no suena.',
          solucion: 'Reconexión firme de cable HDMI, ajuste de entrada HDMI 1 en proyector y encendido de barra de sonido.',
          observaciones: 'Queda funcionando con video y audio para la clase.',
          activo: true
        },
        {
          id: 'plant_sin_internet',
          nombre: 'Restablecimiento de conexión a Internet',
          categoriaId: 'cat_internet',
          tipoActividadId: 'act_correctivo',
          estadoId: 'est_resuelto',
          descripcion: 'Sin navegación a internet.',
          solucion: 'Reinicio de adaptador de red, renovación de concesión DHCP (ipconfig /renew) y prueba de ping satisfactoria.',
          observaciones: 'Navegación restablecida a velocidad estándar.',
          activo: true
        }
      ];
      await Delfos.DB.guardarLote('plantillas', plantillas);

      // 10. Configuración General
      await Delfos.DB.guardarConfig('tecnico', 'Técnico de Soporte');
      await Delfos.DB.guardarConfig('institucion', 'Unidad Educativa Delfos');
      await Delfos.DB.guardarConfig('umbralProblematico', 4);
      await Delfos.DB.guardarConfig('esquemaInicialCargado', true);

      console.log('Delfos Support: Esquema inicial de catálogos cargado exitosamente.');
    },

    /**
     * Genera ~3 meses de soportes y equipos de ejemplo realistas para visualizar
     * métricas, gráficas, fichas y reportes de inmediato.
     */
    cargarDatosEjemplo: async function() {
      // 1. Crear varios salones y áreas en los 3 edificios
      const salonesNuevos = [
        { id: 'ub_p_s101', edificioId: 'edif_principal', tipoId: 'tipo_ub_salon', nombre: 'Aula 101 - 1ro BGU', referencia: 'Planta Alta', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_p_s102', edificioId: 'edif_principal', tipoId: 'tipo_ub_salon', nombre: 'Aula 102 - 2do BGU', referencia: 'Planta Alta', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_p_s103', edificioId: 'edif_principal', tipoId: 'tipo_ub_salon', nombre: 'Aula 103 - 3ro BGU', referencia: 'Extensión', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_p_biblio', edificioId: 'edif_principal', tipoId: 'tipo_ub_otro', nombre: 'Biblioteca Central', referencia: 'Extensión PB', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_adm_rectorado', edificioId: 'edif_admin', tipoId: 'tipo_ub_area_admin', nombre: 'Rectorado', referencia: 'Piso 2', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_adm_colecturia', edificioId: 'edif_admin', tipoId: 'tipo_ub_area_admin', nombre: 'Colecturía', referencia: 'Piso 1', revisadoEn: new Date().toISOString(), activo: true },
        { id: 'ub_adm_secretaria', edificioId: 'edif_admin', tipoId: 'tipo_ub_area_admin', nombre: 'Secretaría General', referencia: 'Piso 1', revisadoEn: new Date().toISOString(), activo: true }
      ];
      await Delfos.DB.guardarLote('ubicaciones', salonesNuevos);

      // 2. Crear equipos para ubicaciones
      const equiposEjemplo = [];
      // Laboratorio 1 (Delfolandia): 20 computadoras
      for (let i = 1; i <= 20; i++) {
        const num = String(i).padStart(2, '0');
        equiposEjemplo.push({
          id: `eq_lab1_pc_${num}`,
          codigo: `PC-${num}`,
          tipoId: 'tipo_pc',
          ubicacionId: 'ub_delfo_lab1',
          marca: 'Dell',
          modelo: 'OptiPlex 3080',
          serie: `SN-DL1-${num}94`,
          notas: i === 7 ? 'Disco duro con sectores reasignados' : 'Equipo estándar',
          activo: true,
          esEjemplo: true
        });
      }

      // Proyectores y pantallas en aulas
      equiposEjemplo.push(
        { id: 'eq_pry_101', codigo: 'PRY-01', tipoId: 'tipo_pry', ubicacionId: 'ub_p_s101', marca: 'Epson', modelo: 'PowerLite X49', serie: 'EP-49101', notas: 'Uso intensivo', activo: true, esEjemplo: true },
        { id: 'eq_pry_102', codigo: 'PRY-02', tipoId: 'tipo_pry', ubicacionId: 'ub_p_s102', marca: 'Epson', modelo: 'PowerLite X49', serie: 'EP-49102', notas: '', activo: true, esEjemplo: true },
        { id: 'eq_pin_103', codigo: 'PIN-01', tipoId: 'tipo_pin', ubicacionId: 'ub_p_s103', marca: 'ViewSonic', modelo: 'IFP6550', serie: 'VS-6501', notas: 'Pantalla 65 pulgadas táctil', activo: true, esEjemplo: true },
        { id: 'eq_imp_colecturia', codigo: 'IMP-01', tipoId: 'tipo_imp', ubicacionId: 'ub_adm_colecturia', marca: 'HP', modelo: 'LaserJet Pro M404n', serie: 'HP-COL-01', notas: 'Impresora principal de facturación', activo: true, esEjemplo: true },
        { id: 'eq_pc_dece', codigo: 'PC-DECE', tipoId: 'tipo_pc', ubicacionId: 'ub_delfo_dece', marca: 'HP', modelo: 'ProDesk 400 G6', serie: 'HP-DEC-09', notas: 'Máquina de psicóloga', activo: true, esEjemplo: true }
      );
      await Delfos.DB.guardarLote('equipos', equiposEjemplo);

      // 3. Generar ~65 soportes distribuidos en los últimos 90 días
      const hoy = new Date();
      const soportesEjemplo = [];

      const listaActividades = ['act_correctivo', 'act_preventivo', 'act_instalacion', 'act_configuracion'];
      const listaCategorias = ['cat_proyector', 'cat_computadora', 'cat_internet', 'cat_impresora', 'cat_audio', 'cat_hdmi', 'cat_windows'];

      const casos = [
        { cat: 'cat_proyector', prob: 'prob_20', desc: 'Proyector no envía señal de video a la laptop del docente.', sol: 'Se cambió el cable HDMI que tenía la clavija doblada. Señal restablecida.', obs: 'Se recomienda no tensionar el cable.', ub: 'ub_p_s101', eq: ['eq_pry_101'], act: 'act_correctivo' },
        { cat: 'cat_proyector', prob: 'prob_21', desc: 'Lámpara de proyector parpadea en rojo y se apaga a los 5 minutos.', sol: 'Limpieza de filtro antipolvo y reseteo de contador térmico.', obs: 'Lámpara con 2800 horas de uso.', ub: 'ub_p_s101', eq: ['eq_pry_101'], act: 'act_correctivo' },
        { cat: 'cat_proyector', prob: 'prob_20', desc: 'Proyector con imagen descolorida y parpadeante.', sol: 'Ajuste de pines en conector de pared y calibración de color.', obs: '', ub: 'ub_p_s101', eq: ['eq_pry_101'], act: 'act_correctivo' },
        { cat: 'cat_proyector', prob: 'prob_22', desc: 'Imagen no enfoca adecuadamente y proyector recalentado.', sol: 'Ajuste manual de zoom/foco y limpieza de rejilla de ventilación.', obs: 'Equipo problemático reportado 4 veces.', ub: 'ub_p_s101', eq: ['eq_pry_101'], act: 'act_correctivo' },
        { cat: 'cat_proyector', prob: 'prob_20', desc: 'Quinta falla en el mes en el proyector de Aula 101.', sol: 'Se bajó el equipo para mantenimiento técnico en taller.', obs: 'Se requiere cambio de balastro o reemplazo definitivo.', ub: 'ub_p_s101', eq: ['eq_pry_101'], act: 'act_reemplazo' },
        { cat: 'cat_computadora', prob: 'prob_2', desc: 'Equipo PC-07 se congela en pantalla azul WHEA_UNCORRECTABLE_ERROR.', sol: 'Reemplazo de módulo RAM defectuoso por repuesto de bodega.', obs: 'PC-07 queda bajo observación.', ub: 'ub_delfo_lab1', eq: ['eq_lab1_pc_07'], act: 'act_cambio_comp' },
        { cat: 'cat_computadora', prob: 'prob_1', desc: 'PC-07 no inicia el sistema operativo, indica No Boot Device.', sol: 'Reconexión de cable SATA de disco y fijación con precinto.', obs: '', ub: 'ub_delfo_lab1', eq: ['eq_lab1_pc_07'], act: 'act_correctivo' },
        { cat: 'cat_computadora', prob: 'prob_4', desc: 'PC-07 infectada con adware que abre ventanas publicitarias.', sol: 'Desinfección con Malwarebytes, limpieza de registros y reseteo de Chrome.', obs: '', ub: 'ub_delfo_lab1', eq: ['eq_lab1_pc_07'], act: 'act_correctivo' },
        { cat: 'cat_computadora', prob: 'prob_2', desc: 'PC-07 sumamente lenta al abrir navegador y programas educativos.', sol: 'Desfragmentación de disco y optimización de servicios de inicio.', obs: 'Cuarta incidencia en 90 días.', ub: 'ub_delfo_lab1', eq: ['eq_lab1_pc_07'], act: 'act_correctivo' },
        { cat: 'cat_impresora', prob: 'prob_28', desc: 'Atasco continuo de papel bond 75g en bandeja 2.', sol: 'Limpieza de rodillos de arrastre (pick-up rollers) con alcohol isopropílico.', obs: 'Impresión fluida.', ub: 'ub_adm_colecturia', eq: ['eq_imp_colecturia'], act: 'act_correctivo' },
        { cat: 'cat_impresora', prob: 'prob_29', desc: 'Tóner negro agotado, impresiones salen casi en blanco.', sol: 'Sustitución por cartucho de tóner HP 58A original nuevo.', obs: 'Páginas impresas contador: 14.520.', ub: 'ub_adm_colecturia', eq: ['eq_imp_colecturia'], act: 'act_reemplazo' },
        { cat: 'cat_internet', prob: 'prob_8', desc: 'Sin internet en Biblioteca para los estudiantes de investigación.', sol: 'Reinicio de Access Point de biblioteca y reconexión de switch de pared.', obs: 'Servicio restablecido para 40 usuarios simultáneos.', ub: 'ub_p_biblio', eq: [], act: 'act_correctivo' },
        { cat: 'cat_computadora', prob: 'prob_2', desc: 'Mantenimiento preventivo masivo del Laboratorio 1 completo.', sol: 'Soplado con compresor de las 20 estaciones de trabajo, limpieza de periféricos y verificación de red.', obs: 'Todas las 20 computadoras quedaron operativas al 100%.', ub: 'ub_delfo_lab1', eq: equiposEjemplo.filter(e => e.ubicacionId === 'ub_delfo_lab1').map(e => e.id), act: 'act_preventivo' }
      ];

      // Insertar los casos específicos
      let contador = 1;
      for (let i = 0; i < casos.length; i++) {
        const c = casos[i];
        const diasAtras = Math.floor(Math.random() * 80) + 1;
        const fecha = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        const fIso = fecha.toISOString().split('T')[0];
        const hIso = `${String(Math.floor(Math.random() * 8) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;

        soportesEjemplo.push({
          id: `sop_ejemplo_${contador++}`,
          fecha: fIso,
          hora: hIso,
          ubicacionId: c.ub,
          equipoIds: c.eq,
          categoriaId: c.cat,
          problemaId: c.prob,
          tipoActividadId: c.act,
          estadoId: i === 0 ? 'est_pendiente' : (i === 1 ? 'est_proceso' : 'est_resuelto'),
          descripcion: c.desc,
          solucion: c.sol,
          observaciones: c.obs,
          tecnico: 'Técnico de Soporte',
          activo: true,
          esEjemplo: true,
          creadoEn: fecha.toISOString()
        });
      }

      // Generar 50 soportes adicionales distribuidos para completar ~65 soportes
      const ubicacionesList = ['ub_p_s101', 'ub_p_s102', 'ub_p_s103', 'ub_p_biblio', 'ub_adm_rectorado', 'ub_adm_colecturia', 'ub_adm_secretaria', 'ub_delfo_dece', 'ub_delfo_medico', 'ub_delfo_lab1', 'ub_delfo_lab2'];

      for (let j = 0; j < 52; j++) {
        const diasAtras = Math.floor(Math.random() * 88);
        const fecha = new Date(hoy.getTime() - diasAtras * 24 * 60 * 60 * 1000);
        const fIso = fecha.toISOString().split('T')[0];
        const hIso = `${String(Math.floor(Math.random() * 8) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
        const ubSel = ubicacionesList[Math.floor(Math.random() * ubicacionesList.length)];
        const catSel = listaCategorias[Math.floor(Math.random() * listaCategorias.length)];
        const actSel = listaActividades[Math.floor(Math.random() * listaActividades.length)];

        let eqIds = [];
        if (ubSel === 'ub_p_s101') eqIds = ['eq_pry_101'];
        else if (ubSel === 'ub_adm_colecturia') eqIds = ['eq_imp_colecturia'];
        else if (ubSel === 'ub_delfo_dece') eqIds = ['eq_pc_dece'];

        soportesEjemplo.push({
          id: `sop_ejemplo_${contador++}`,
          fecha: fIso,
          hora: hIso,
          ubicacionId: ubSel,
          equipoIds: eqIds,
          categoriaId: catSel,
          problemaId: 'prob_1',
          tipoActividadId: actSel,
          estadoId: j % 12 === 0 ? 'est_pendiente' : (j % 18 === 0 ? 'est_proceso' : 'est_resuelto'),
          descripcion: `Soporte de rutina en ${catSel.replace('cat_', '')}. Verificación general de hardware y software.`,
          solucion: 'Se resolvió la anomalía reportada y se constató funcionamiento con el usuario a cargo.',
          observaciones: 'Actividad sin contratiempos.',
          tecnico: 'Técnico de Soporte',
          activo: true,
          esEjemplo: true,
          creadoEn: fecha.toISOString()
        });
      }

      await Delfos.DB.guardarLote('soportes', soportesEjemplo);
      console.log(`Delfos Support: Se cargaron ${soportesEjemplo.length} soportes de ejemplo.`);
    },

    /**
     * Elimina todos los registros de prueba identificados con 'esEjemplo: true'
     */
    borrarDatosEjemplo: async function() {
      const soportes = await Delfos.DB.listar('soportes', s => s.esEjemplo);
      for (const s of soportes) {
        await Delfos.DB.eliminar('soportes', s.id);
      }

      const equipos = await Delfos.DB.listar('equipos', e => e.esEjemplo);
      for (const e of equipos) {
        await Delfos.DB.eliminar('equipos', e.id);
      }

      console.log('Delfos Support: Datos de ejemplo eliminados.');
    }
  };

  Delfos.Seed = Seed;
})(window.Delfos);
