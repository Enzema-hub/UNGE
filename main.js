// ---------- IndexedDB Utility -----------
const DB_NAME = "ungeDB";
const DB_VERSION = 2; // Subido para migrar la store de historial
let db = null;

function openDB() {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        let request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // Users
            if (!db.objectStoreNames.contains("users")) {
                let userStore = db.createObjectStore("users", { keyPath: "email" });
                userStore.createIndex("role", "role", { unique: false });
            }
            // Announcement boards
            if (!db.objectStoreNames.contains("anuncios")) {
                db.createObjectStore("anuncios", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("facultades")) {
                db.createObjectStore("facultades", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("departamentos")) {
                db.createObjectStore("departamentos", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("carreras")) {
                db.createObjectStore("carreras", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("materias")) {
                db.createObjectStore("materias", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("matriculas")) {
                db.createObjectStore("matriculas", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("historial_matriculas")) {
                db.createObjectStore("historial_matriculas", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("notas")) {
                db.createObjectStore("notas", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("tareas")) {
                db.createObjectStore("tareas", { keyPath: "id", autoIncrement: true });
            }
            if (!db.objectStoreNames.contains("archivos")) {
                db.createObjectStore("archivos", { keyPath: "id", autoIncrement: true });
            }
        };
        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };
        request.onerror = (event) => reject(event.target.error);
    });
}

function dbAdd(store, obj) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).add(obj).onsuccess = e => resolve(e.target.result);
        tx.onerror = e => reject(e.target.error);
    }));
}
function dbPut(store, obj) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).put(obj).onsuccess = () => resolve();
        tx.onerror = e => reject(e.target.error);
    }));
}
function dbGet(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = e => reject(e.target.error);
    }));
}
function dbGetAll(store) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readonly");
        const req = tx.objectStore(store).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = e => reject(e.target.error);
    }));
}
function dbDelete(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(store, "readwrite");
        tx.objectStore(store).delete(key).onsuccess = () => resolve();
        tx.onerror = e => reject(e.target.error);
    }));
}

// ---------- Session ----------
let currentUser = null;

function setSession(user) {
    currentUser = user;
    if (user) localStorage.setItem("ungeUser", JSON.stringify(user));
    else localStorage.removeItem("ungeUser");
}

function loadSession() {
    const u = localStorage.getItem("ungeUser");
    if (u) currentUser = JSON.parse(u);
}

// ---------- UI Navigation ----------
const mainContent = document.getElementById('main-content');
const navLinks = document.getElementById('navLinks');
const userWelcome = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');

function showSection(section) {
    switch (section) {
        case "register": renderRegister(); break;
        case "login": renderLogin(); break;
        case "dashboard": renderDashboard(); break;
        case "informate": renderInformate(); break;
        default: renderHome(); break;
    }
}

navLinks.addEventListener('click', e => {
    if (e.target.matches('#nav-register')) { e.preventDefault(); showSection('register'); }
    if (e.target.matches('#nav-login')) { e.preventDefault(); showSection('login'); }
    if (e.target.matches('#nav-informate')) { e.preventDefault(); showSection('informate'); }
});

logoutBtn.addEventListener('click', () => {
    setSession(null);
    updateNav();
    showSection('login');
});

function updateNav() {
    if (currentUser) {
        document.getElementById('nav-login').classList.add('d-none');
        document.getElementById('nav-register').classList.add('d-none');
        userWelcome.classList.remove('d-none');
        logoutBtn.classList.remove('d-none');
        userWelcome.textContent = saludoPersonalizado(currentUser);
    } else {
        document.getElementById('nav-login').classList.remove('d-none');
        document.getElementById('nav-register').classList.remove('d-none');
        userWelcome.classList.add('d-none');
        logoutBtn.classList.add('d-none');
    }
}

function saludoPersonalizado(user) {
    let prefijo = user.genero === "Masculino" ? "Sr." : "Sra.";
    return `${prefijo} ${user.nombre.split(" ")[0]}, ${user.rol}`;
}

function renderHome() {
    mainContent.innerHTML = `
    <div class="text-center py-5">
        <h1 class="display-4 mb-3">Bienvenido al sistema de gestión de la UNGE</h1>
        <p class="lead mb-4">Administra facultades, carreras, usuarios, matrículas, notas y más desde un solo lugar.<br>
        <strong>¡La gestión educativa del futuro en Guinea Ecuatorial!</strong></p>
        <button class="btn btn-primary btn-lg mx-2" onclick="showSection('login')">Iniciar Sesión</button>
        <button class="btn btn-outline-primary btn-lg mx-2" onclick="showSection('register')">Registrarse</button>
    </div>
    `;
}

// ---------- Render Registro ----------
function renderRegister() {
    mainContent.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-8">
        <div class="card shadow p-4">
          <h2 class="mb-4 text-primary">Registro de usuario UNGE</h2>
          <form id="registerForm" novalidate autocomplete="off">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label>Nombre completo</label>
                    <input type="text" class="form-control" name="nombre" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Género</label>
                    <select class="form-select" name="genero" required>
                        <option value="">Seleccione...</option>
                        <option>Masculino</option>
                        <option>Femenino</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Email (@gmail.com)</label>
                    <input type="email" class="form-control" name="email" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Contraseña</label>
                    <input type="password" class="form-control" name="password" required>
                    <div class="form-text small">
                        12 caracteres: 6 letras iniciales (ver reglas abajo), 4 números, 2 símbolos (@, #, &).
                    </div>
                </div>
                <div class="col-md-6 mb-3">
                    <label>Rol</label>
                    <select class="form-select" name="rol" id="reg-rol" required>
                        <option value="">Seleccione...</option>
                        <option>rector</option>
                        <option>decano</option>
                        <option>profesor</option>
                        <option>estudiante</option>
                        <option>secretario/a</option>
                        <option>jefe de departamento</option>
                        <option>jefe adjunto de departamento</option>
                    </select>
                </div>
                <div class="col-md-6 mb-3" id="rol-din-fields"></div>
            </div>
            <div class="alert alert-danger d-none" id="registerError"></div>
            <button class="btn btn-primary mt-2" type="submit">Registrar</button>
          </form>
        </div>
      </div>
    </div>
    `;
    addRegisterListeners();
}
function addRegisterListeners() {
    let regRol = document.getElementById('reg-rol');
    let rolDinFields = document.getElementById('rol-din-fields');
    regRol.addEventListener('change', function() {
        rolDinFields.innerHTML = "";
        let rol = this.value;
        if (rol === "decano" || rol === "secretario/a") {
            rolDinFields.innerHTML = `
            <label>Facultad</label><select class="form-select mb-2" name="facultad" required></select>
            <label>Campus</label>
            <select class="form-select" name="campus" required>
                <option>CAMPUS CENTRAL</option>
                <option>CAMPUS 2</option>
                <option>CAMPUS 3</option>
            </select>
            `;
            cargarFacultadesCombo(rolDinFields.querySelector('select[name=facultad]'));
        } else if (rol === "profesor" || rol === "estudiante") {
            rolDinFields.innerHTML = `
            <label>Facultad</label><select class="form-select mb-2" name="facultad" required></select>
            <label>Departamento</label><select class="form-select mb-2" name="departamento" required></select>
            <label>Carrera</label><select class="form-select mb-2" name="carrera" required></select>
            <label>Curso</label><select class="form-select mb-2" name="curso" required></select>
            <label>Semestre</label><select class="form-select mb-2" name="semestre" required>
                <option>Primer semestre</option>
                <option>Segundo semestre</option>
            </select>
            <label>Turno</label><select class="form-select" name="turno" required>
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Noche</option>
            </select>
            `;
            cargarFacultadesCombo(rolDinFields.querySelector('select[name=facultad]'));
        } else if (rol === "jefe de departamento" || rol === "jefe adjunto de departamento") {
            rolDinFields.innerHTML = `
            <label>Facultad</label><select class="form-select mb-2" name="facultad" required></select>
            <label>Departamento</label><select class="form-select mb-2" name="departamento" required></select>
            `;
            cargarFacultadesCombo(rolDinFields.querySelector('select[name=facultad]'));
        }
    });

    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        let fd = new FormData(this);
        let user = {};
        for (let [k, v] of fd.entries()) user[k] = v.trim();

        let err = validarRegistro(user);
        if (err) {
            mostrarError('registerError', err);
            return;
        }
        let exists = await dbGet("users", user.email);
        if (exists) return mostrarError('registerError', "El email ya está registrado.");
        await dbAdd("users", user);
        alert("¡Registro exitoso!");
        showSection('login');
    });
}
function validarRegistro(user) {
    if (!/^[\w.-]+@gmail\.com$/.test(user.email)) return "El correo debe ser de Gmail.";
    let pass = user.password;
    if (!/^[A-Za-z]{6}\d{4}[@#&]{2}$/.test(pass)) return "La contraseña debe tener 6 letras, 4 números y 2 símbolos (@, #, &).";
    let rol = user.rol;
    let reglas = {
        "rector": /^Rector\d{4}[@#&]{2}$/,
        "decano": /^Decano\d{4}[@#&]{2}$/,
        "secretario/a": /^Secret\d{4}[@#&]{2}$/,
        "profesor": /^Profes\d{4}[@#&]{2}$/,
        "estudiante": /^Estudi\d{4}[@#&]{2}$/,
        "jefe de departamento": /^Jefdep\d{4}[@#&]{2}$/,
        "jefe adjunto de departamento": /^Jefadj\d{4}[@#&]{2}$/
    };
    if (!reglas[rol].test(pass)) return `La contraseña para el rol ${rol} debe empezar con ${reglas[rol].source.split('\\')[1]}`;
    if (["decano", "profesor", "estudiante", "secretario/a", "jefe de departamento", "jefe adjunto de departamento"].includes(rol)) {
        if (!user.facultad) return "Debe especificar la facultad.";
        if (rol === "profesor" || rol === "estudiante") {
            if (!user.departamento || !user.carrera || !user.curso || !user.semestre || !user.turno)
                return "Complete todos los campos requeridos para el rol seleccionado.";
        }
        if ((rol === "jefe de departamento" || rol === "jefe adjunto de departamento") && !user.departamento)
            return "Debe especificar el departamento.";
    }
    return null;
}
function mostrarError(id, msg) {
    let el = document.getElementById(id);
    el.textContent = msg;
    el.classList.remove('d-none');
    setTimeout(() => el.classList.add('d-none'), 4500);
}
function cargarFacultadesCombo(combo) {
    combo.innerHTML = `
        <option value="">Seleccione...</option>
        <option>Facultad de Ciencias Económicas</option>
        <option>Facultad de Ingeniería</option>
        <option>Facultad de Ciencias de la Salud</option>
    `;
}

// ---------- Render Login ----------
function renderLogin() {
    mainContent.innerHTML = `
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow p-4">
          <h2 class="mb-4 text-primary">Iniciar sesión</h2>
          <form id="loginForm" autocomplete="off">
            <div class="mb-3">
              <label>Email (@gmail.com)</label>
              <input type="email" class="form-control" name="email" required>
            </div>
            <div class="mb-3">
              <label>Contraseña</label>
              <input type="password" class="form-control" name="password" required>
            </div>
            <div class="alert alert-danger d-none" id="loginError"></div>
            <button class="btn btn-primary" type="submit">Entrar</button>
          </form>
        </div>
      </div>
    </div>
    `;
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        let email = this.email.value.trim();
        let password = this.password.value.trim();
        let user = await dbGet("users", email);
        if (!user || user.password !== password)
            return mostrarError('loginError', "Credenciales incorrectas.");
        setSession(user);
        updateNav();
        showSection('dashboard');
    });
}

// ---------- Render Dashboard (Principal) ----------
function renderDashboard() {
    if (!currentUser) { showSection('login'); return; }
    mainContent.innerHTML = `
    <div class="row">
      <div class="col-12 mb-3">
        <h2 class="text-primary">${saludoPersonalizado(currentUser)}</h2>
      </div>
      <div class="col-lg-3">
        <div class="list-group shadow-sm mb-4" id="dashboard-nav">
          <button class="list-group-item list-group-item-action active" data-section="facultades">Facultades</button>
          <button class="list-group-item list-group-item-action" data-section="departamentos">Departamentos</button>
          <button class="list-group-item list-group-item-action" data-section="carreras">Carreras</button>
          <button class="list-group-item list-group-item-action" data-section="matricula">Matrícula</button>
          <button class="list-group-item list-group-item-action" data-section="historial">Historial</button>
          <button class="list-group-item list-group-item-action" data-section="usuarios">Gestión de Usuarios</button>
          <button class="list-group-item list-group-item-action" data-section="anuncios">Tablón de Anuncios</button>
          <button class="list-group-item list-group-item-action" data-section="administracion">Administración</button>
          <button class="list-group-item list-group-item-action" data-section="notas">Notas Finales</button>
        </div>
      </div>
      <div class="col-lg-9" id="dashboard-content"></div>
    </div>
    `;
    let nav = document.getElementById('dashboard-nav');
    nav.querySelectorAll('button').forEach(btn => {
        btn.onclick = function() {
            nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderDashboardSection(this.dataset.section);
        }
    });
    renderDashboardSection('facultades');
}

function renderDashboardSection(section) {
    const content = document.getElementById('dashboard-content');
    switch (section) {
        case "facultades": renderFacultades(content); break;
        case "departamentos": renderDepartamentos(content); break;
        case "carreras": renderCarreras(content); break;
        case "matricula": renderMatricula(content); break;
        case "historial": renderHistorial(content); break;
        case "usuarios": renderGestionUsuarios(content); break;
        case "anuncios": renderAnuncios(content); break;
        case "administracion": renderAdministracion(content); break;
        case "notas": renderNotas(content); break;
        default: content.innerHTML = "<div class='p-4'>Módulo en desarrollo...</div>"; break;
    }
}

function renderFacultades(el) {
    el.innerHTML = `<h4>Gestión de Facultades</h4>
    <p>Permite agregar, listar y editar facultades.</p>`;
}
function renderDepartamentos(el) {
    el.innerHTML = `<h4>Gestión de Departamentos</h4>
    <p>Permite agregar, listar y editar departamentos.</p>`;
}
function renderCarreras(el) {
    el.innerHTML = `<h4>Gestión de Carreras</h4>
    <p>Permite agregar, editar y eliminar carreras, asociarlas a facultades y definir duración, cursos y semestres.</p>`;
}

// -------- MATRÍCULA con historial -----------
function renderMatricula(el) {
    el.innerHTML = `
    <h4>Matrícula de Estudiantes</h4>
    <form id="matriculaForm" class="card p-4 shadow mb-4">
        <div class="row g-3">
            <div class="col-md-6">
                <label>Nombre completo</label>
                <input type="text" name="nombre" class="form-control" required>
            </div>
            <div class="col-md-6">
                <label>Teléfono</label>
                <input type="text" name="telefono" class="form-control" required>
            </div>
            <div class="col-md-6">
                <label>Dirección</label>
                <input type="text" name="direccion" class="form-control" required>
            </div>
            <div class="col-md-6">
                <label>Email (@gmail.com)</label>
                <input type="email" name="email" class="form-control" required>
            </div>
            <div class="col-md-6">
                <label>Carrera</label>
                <select name="carrera" class="form-select" required>
                    <option value="">Seleccione...</option>
          
