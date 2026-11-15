# 🚀 Guía de Configuración de Firebase para Delfos Support

Esta guía paso a paso te explica cómo conectar **Delfos Support** a la nube gratuita de **Google Firebase (Plan Spark 100% gratuito)**.

Al completar estos pasos, cualquier soporte o equipo que registres en tu celular se sincronizará automáticamente con tu computadora en cuestión de segundos, y seguirá funcionando sin internet cuando no tengas señal.

---

## 📌 Requisitos Previos
- Una cuenta de Google (Gmail).
- Menos de 10 minutos para seguir estos 8 pasos.

---

## PASO 1: Crear el Proyecto en Firebase Console
1. Entra a 👉 **[console.firebase.google.com](https://console.firebase.google.com)** con tu cuenta de Google.
2. Haz clic en el botón grande **"Crear un proyecto"** (o *"Agregar proyecto"*).
3. Escribe el nombre de tu proyecto: por ejemplo `delfos-support` (o `delfos-ti`).
4. Haz clic en **Continuar**.
5. En la pantalla de *Google Analytics*, desactiva la casilla (déjala en **Desactivado** ya que no se necesita para tu herramienta personal).
6. Haz clic en **"Crear proyecto"**. Espera unos 20 segundos y cuando diga *"Tu proyecto está listo"*, haz clic en **Continuar**.

---

## PASO 2: Crear la Base de Datos Cloud Firestore
1. En el menú lateral izquierdo de Firebase, ve a **Compilación (Build)** ➔ **Firestore Database**.
2. Haz clic en el botón **"Crear base de datos"**.
3. **Ubicación de la base de datos:** Elige una región cercana, por ejemplo:
   - `nam5 (us-central)` o `us-east1`.
   - Haz clic en **Siguiente**.
4. **Reglas de seguridad:** Selecciona **"Comenzar en modo producción"**.
5. Haz clic en **Habilitar** (o *Crear*). Espera a que termine de aprovisionarse.

---

## PASO 3: Pegar las Reglas de Seguridad
1. Dentro de Firestore Database, en la parte superior verás varias pestañas: *Datos*, *Reglas*, *Índices*, *Uso*. Haz clic en la pestaña **Reglas**.
2. Borra todo lo que haya en el editor y pega exactamente este código:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{uid}/{documento=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

3. Haz clic en el botón azul **"Publicar"**.  
   *(Esto asegura que NADIE en el mundo pueda ver ni tocar tus datos, excepto tú con tu usuario y contraseña).*

---

## PASO 4: Activar el Inicio de Sesión (Authentication)
1. En el menú lateral izquierdo, haz clic en **Compilación (Build)** ➔ **Authentication**.
2. Haz clic en el botón **"Comenzar"** (o *Get started*).
3. En la lista de métodos de acceso, haz clic en **"Correo electrónico/contraseña"**.
4. Activa el primer interruptor: **"Habilitar correo electrónico y contraseña"**. (Deja desactivado el de "Vínculo del correo").
5. Haz clic en **Guardar**.

---

## PASO 5: Crear tu Usuario Técnico Manualmente
1. Dentro de **Authentication**, haz clic en la pestaña **Users (Usuarios)** arriba.
2. Haz clic en el botón **"Agregar usuario"**.
3. Escribe tu correo electrónico (por ejemplo: `erick@delfos.edu.ec` o tu correo personal) y una contraseña segura que recuerdes.
4. Haz clic en **"Agregar usuario"**.  
   *(¡Listo! Este será el único usuario con acceso a tu sistema).*

---

## PASO 6: Autorizar el Dominio de GitHub Pages
1. Dentro de **Authentication**, haz clic en la pestaña **Configuración (Settings)** arriba.
2. En el menú secundario, haz clic en **"Dominios autorizados"** (Authorized domains).
3. Verás que ya están `localhost` y tu dominio de firebase. Haz clic en **"Agregar dominio"**.
4. Escribe exactamente tu dominio de GitHub Pages (sin https:// ni barras):
   ```text
   erickmurillov30.github.io
   ```
5. Haz clic en **Guardar**.  
   *(Esto permite que la web alojada en GitHub Pages pueda autenticarse de forma segura).*

---

## PASO 7: Registrar la Aplicación Web y Copiar Credenciales
1. En el menú lateral izquierdo, haz clic en el icono de engranaje ⚙️ junto a *Descripción general del proyecto* y selecciona **"Configuración del proyecto"**.
2. Baja hasta la sección que dice *"Tus apps"* y haz clic en el icono web **`</>`** para registrar una aplicación web.
3. En *Sobrenombre de la app*, escribe: `Delfos Support Web`.
4. NO selecciones la casilla de Firebase Hosting (la dejamos desmarcada porque ya usas GitHub Pages).
5. Haz clic en **"Registrar app"**.
6. Te aparecerá un bloque de código con un objeto llamado `firebaseConfig`. Se verá algo así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD-xxxxxxxxxxxxxxxxxxxxx",
  authDomain: "delfos-support-xxxx.firebaseapp.com",
  projectId: "delfos-support-xxxx",
  storageBucket: "delfos-support-xxxx.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxxxx"
};
```

7. Abre en tu computadora el archivo:
   ```text
   assets/js/firebase-config.js
   ```
8. Reemplaza los textos `"TU_API_KEY"`, `"TU_PROYECTO"`, etc., con los valores reales que te dio Firebase.
9. Guarda el archivo.

---

## PASO 8: Publicar y Probar
1. Sube los cambios a GitHub (puedes pedirle al asistente que lo haga con un commit o hacerlo desde terminal):
   ```bash
   git add .
   git commit -m "Conexión a Firebase configurada"
   git push origin main
   ```
2. Espera 1 minuto y abre tu enlace:
   👉 **https://erickmurillov30.github.io/delfos-support/**
3. Verás la pantalla verde de **Inicio de Sesión**:
   - Ingresa el correo y la contraseña que creaste en el **Paso 5**.
   - Haz clic en **"Iniciar Sesión"**.
4. ¡Bienvenido a Delfos Support en la Nube! En la barra lateral verás el indicador verde:  
   **🟢 Sincronizado**.

---

## ❓ Si Algo Falla (Solución Rápida)

### 1. Mensaje: "Error de permisos en la base de datos" (`permission-denied`)
- Revisa el **Paso 3**. Asegúrate de haber copiado las reglas exactamente como están indicadas y de haber presionado el botón azul **"Publicar"**.

### 2. Mensaje: "Dominio no autorizado" (`auth/unauthorized-domain`)
- Revisa el **Paso 6**. Asegúrate de que `erickmurillov30.github.io` esté listado en *Authentication ➔ Settings ➔ Authorized domains*.

### 3. La pantalla de login dice: "Configuración de Firebase no detectada"
- Asegúrate de haber editado `assets/js/firebase-config.js` y de haber reemplazado `"TU_API_KEY"` por tu clave real, y haber subido el archivo a GitHub.

### 4. ¿Qué pasa si me quedo sin internet en el colegio?
- No te preocupes: Delfos Support tiene **Caché Persistente Fuera de Línea**. Puedes seguir registrando soportes y revisando salones. El indicador dirá **"Sin conexión · N cambios pendientes"**. En cuanto tu celular vuelva a tener WiFi o datos móviles, todo se subirá automáticamente a la nube sin perder nada.

### 5. ¿Se puede agotar el plan gratuito de Firebase?
- El plan gratuito Spark de Google te da **50.000 lecturas diarias** y **20.000 escrituras diarias**. Para un solo técnico de soporte, un día normal de trabajo consume menos de 100 lecturas y 30 escrituras (menos del 0.5% del límite). Es prácticamente imposible que se agote. Además, en **Configuración** tienes un contador que te muestra el consumo diario estimado.
