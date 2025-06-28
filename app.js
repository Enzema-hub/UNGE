// --- IndexedDB helper ---
const DB_NAME = 'unge_db';
const DB_VERSION = 1;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = function(e) {
            db = e.target.result;
            // Usuarios
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'email' });
            }
            // Facultades
            if (!db.objectStoreNames.contains('facultades')) {
                db.createObjectStore('facultades', { keyPath: 'id', autoIncrement: true });
            }
            // Carreras
            if (!db.objectStoreNames.contains('carreras')) {
                db.createObjectStore('carreras', { keyPath: 'id', autoIncrement: true });
            }
            // Departamentos
            if (!db.objectStoreNames.contains('departamentos')) {
                db.createObjectStore('departamentos', { keyPath: 'id', autoIncrement: true });
            }
            // Anuncios
            if (!db.objectStoreNames.contains('anuncios')) {
                db.createObjectStore('anuncios', { keyPath: 'id', autoIncrement: true });
            }
            // Notas
            if (!db.objectStoreNames.contains('notas')) {
                db.createObjectStore('notas', { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = function(e) {
            db = e.target.result;
            resolve(db);
        };
    });
}

function getStore(store, mode='readonly') {
    return db.transaction([store], mode).objectStore(store);
}

// --- App State ---
let currentUser = null;

// --- Utilidades ---
// Validación de email (solo Gmail)
function isValidGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}

// Validación de contraseña según rol
function getPasswordRegex(role) {
    // 6 letras (primera mayúscula), 4 números, 2 símbolos (@#&)
    const patterns = {
        rector:    /^Rector\d{4}[@#&]{2}$/,
        decano:    /^Decano\d{4}[@#&]{2}$/,
        profesor:  /^Profes\d{4}[@#&]{2}$/,
        estudiante:/^Estudi\d{4}[@#&]{2}$/,
        secretario:/^Secret\d{4}[@#&]{2}$/,
        jefe_dpto: /^Jefdep\d{4}[@#&]{2}$/,
        jefe_adjunto_dpto: /^Jefadj\d{4}[@#&]{2}$/
    };
    return patterns[role] || /.{12}/;
}

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', async () => {
    await openDB();

    // --- Registro dinámico según rol ---
    const roleSelect = document.getElementById('registerRole');
    const dynamicFields = document.getElementById('dynamicFields');
    roleSelect.addEventListener('change', function() {
        dynamicFields.innerHTML = '';
        const role = this.value;
        let html = '';

        // Opciones de campus y facultad
        const campusSelect = `
            <div class="mb-3">
                <label class="form-label">Campus</label>
                <select class="form-select" id="registerCampus" required>
                    <option value="">Selecciona</option>
                    <option>CAMPUS CENTRAL</option>
                    <option>CAMPUS 2</option>
                    <option>CAMPUS 3</option>
                </select>
            </div>
        `;
        const facultadSelect = `
            <div class="mb-3">
                <label class="form-label">Facultad</label>
                <input type="text" class="form-control" id="registerFacultad" required>
            </div>
        `;
        const dptoSelect = `
            <div class="mb-3">
                <label class="form-label">Departamento</label>
                <input type="text" class="form-control" id="registerDepartamento" required>
            </div>
        `;
        const carreraSelect = `
            <div class="mb-3">
                <label class="form-label">Carrera</label>
                <input type="text" class="form-control" id="registerCarrera" required>
            </div>
        `;
        const cursoSelect = `
            <div class="mb-3">
                <label class="form-label">Curso</label>
                <input type="text" class="form-control" id="registerCurso" required>
            </div>
        `;
        const semestreSelect = `
            <div class="mb-3">
                <label class="form-label">Semestre</label>
                <select class="form-select" id="registerSemestre" required>
                    <option value="">Selecciona</option>
                    <option>Primer semestre</option>
                    <option>Segundo semestre</option>
                </select>
            </div>
        `;
        const turnoSelect = `
            <div class="mb-3">
                <label class="form-label">Turno</label>
                <select class="form-select" id="registerTurno" required>
                    <option value="">Selecciona</option>
                    <option>Mañana</option>
                    <option>Tarde</option>
                    <option>Noche</option>
                </select>
            </div>
        `;

        // Campos según rol
        if (role === 'rector') {
            html += campusSelect;
        } else if (role === 'decano') {
            html += facultadSelect + campusSelect;
        } else if (role === 'secretario') {
            html += facultadSelect + campusSelect;
        } else if (role === 'profesor' || role === 'estudiante') {
            html += facultadSelect + dptoSelect + carreraSelect + cursoSelect + semestreSelect + turnoSelect + campusSelect;
        } else if (role === 'jefe_dpto' || role === 'jefe_adjunto_dpto') {
            html += facultadSelect + dptoSelect + campusSelect;
        }
        dynamicFields.innerHTML = html;
    });

    // --- Registro de usuario ---
    document.getElementById('registerForm').onsubmit = async function(e) {
        e.preventDefault();
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const gender = document.getElementById('registerGender').value;
        const role = document.getElementById('registerRole').value;

        // Validaciones
        if (!isValidGmail(email)) return showError('El correo debe ser de Gmail.');
        const pattern = getPasswordRegex(role);
        if (!pattern.test(password)) return showError('La contraseña no sigue el formato requerido para el rol seleccionado.');

        // Recoger campos dinámicos
        let extra = {};
        ['registerCampus','registerFacultad','registerDepartamento','registerCarrera','registerCurso','registerSemestre','registerTurno'].forEach(id => {
            const el = document.getElementById(id);
            if (el) extra[id.replace('register','').toLowerCase()] = el.value.trim();
        });

        // Guardar usuario en IndexedDB
        let user = { name, email, password, gender, role, ...extra };
        const tx = getStore('users', 'readwrite');
        const req = tx.put(user);
        req.onsuccess = () => {
            showSuccess('Registro exitoso. Redirigiendo al inicio de sesión...');
            setTimeout(() => {
                document.querySelector('#login-tab').click();
            }, 2000);
        };
        req.onerror = () => showError('Ya existe un usuario con ese correo.');
    };

    // --- Login de usuario ---
    document.getElementById('loginForm').onsubmit = function(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const tx = getStore('users').get(email);
        tx.onsuccess = function() {
            const user = tx.result;
            if (!user || user.password !== password) {
                showError('Credenciales incorrectas.');
            } else {
                currentUser = user;
                document.getElementById('auth-section').classList.add('hidden');
                document.getElementById('main-section').classList.remove('hidden');
                showWelcome();
                // Limpia formularios
                document.getElementById('loginForm').reset();
                document.getElementById('registerForm').reset();
            }
        };
        tx.onerror = () => showError('Error de inicio de sesión.');
    };

    // --- Logout ---
    document.getElementById('btnLogout').onclick = function() {
        currentUser = null;
        document.getElementById('main-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
    };

    // --- Bienvenida ---
    function showWelcome() {
        let prefix = currentUser.gender === 'M' ? 'Sr.' : 'Sra.';
        let roleDisplay = {
            rector: 'Rector',
            decano: 'Decano/a',
            profesor: 'Profesor/a',
            estudiante: 'Estudiante',
            secretario: 'Secretario/a',
            jefe_dpto: 'Jefe de Departamento',
            jefe_adjunto_dpto: 'Jefe Adjunto de Departamento'
        }[currentUser.role] || '';
        document.getElementById('welcomeMsg').textContent =
            `¡Bienvenido(a), ${prefix} ${currentUser.name} (${roleDisplay})!`;
    }

    // --- Mensajes de error/éxito ---
    function showError(msg) {
        document.getElementById('authError').textContent = msg;
        document.getElementById('authError').classList.remove('d-none');
        document.getElementById('authSuccess').classList.add('d-none');
    }
    function showSuccess(msg) {
        document.getElementById('authSuccess').textContent = msg;
        document.getElementById('authSuccess').classList.remove('d-none');
        document.getElementById('authError').classList.add('d-none');
    }

    // --- Módulos principales (extiende aquí) ---
    document.getElementById('btnFacultades').onclick = showFacultadesModule;
    document.getElementById('btnDepartamentos').onclick = showDepartamentosModule;
    document.getElementById('btnAnuncios').onclick = showAnunciosModule;

    // --- Ejemplo simple de módulo de facultades/carreras ---
    async function showFacultadesModule() {
        let facultades = await getAll('facultades');
        let carreras = await getAll('carreras');
        let html = `<h4>Facultades</h4>
            <button class="btn btn-success btn-sm mb-2" id="btnAddFacultad">Agregar Facultad</button>
            <ul class="list-group mb-3">`;
        facultades.forEach(f => {
            html += `<li class="list-group-item">
                <b>${f.nombre}</b> | Decano: ${f.decano || 'Sin asignar'}
                <button class="btn btn-link btn-sm float-end" onclick="deleteFacultad(${f.id})">Eliminar</button>
            </li>`;
        });
        html += `</ul>
            <h4>Carreras</h4>
            <button class="btn btn-success btn-sm mb-2" id="btnAddCarrera">Agregar Carrera</button>
            <ul class="list-group">`;
        carreras.forEach(c => {
            html += `<li class="list-group-item">
                <b>${c.nombre}</b> (${c.duracion} años) - Facultad: ${c.facultad}
                <button class="btn btn-link btn-sm float-end" onclick="deleteCarrera(${c.id})">Eliminar</button>
            </li>`;
        });
        html += `</ul>`;
        document.getElementById('module-content').innerHTML = html;

        // Agregar eventos
        document.getElementById('btnAddFacultad').onclick = function() {
            document.getElementById('module-content').innerHTML = `
                <h5>Agregar Facultad</h5>
                <form id="addFacultadForm">
                    <input class="form-control mb-2" placeholder="Nombre de la Facultad" id="addFacultadNombre" required>
                    <button class="btn btn-primary">Agregar</button>
                </form>
            `;
            document.getElementById('addFacultadForm').onsubmit = function(e) {
                e.preventDefault();
                let nombre = document.getElementById('addFacultadNombre').value.trim();
                let decano = ''; // Se puede asociar automáticamente desde usuarios
                let tx = getStore('facultades', 'readwrite').add({ nombre, decano });
                tx.onsuccess = showFacultadesModule;
            };
        };
        document.getElementById('btnAddCarrera').onclick = function() {
            let facHtml = '<option value="">Selecciona facultad</option>';
            facultades.forEach(f => facHtml += `<option>${f.nombre}</option>`);
            document.getElementById('module-content').innerHTML = `
                <h5>Agregar Carrera</h5>
                <form id="addCarreraForm">
                    <input class="form-control mb-2" placeholder="Nombre de la Carrera" id="addCarreraNombre" required>
                    <select class="form-select mb-2" id="addCarreraFacultad" required>${facHtml}</select>
                    <select class="form-select mb-2" id="addCarreraDuracion">
                        <option value="3">3 años</option>
                        <option value="4">4 años</option>
                    </select>
                    <button class="btn btn-primary">Agregar</button>
                </form>
            `;
            document.getElementById('addCarreraForm').onsubmit = function(e) {
                e.preventDefault();
                let nombre = document.getElementById('addCarreraNombre').value.trim();
                let facultad = document.getElementById('addCarreraFacultad').value;
                let duracion = parseInt(document.getElementById('addCarreraDuracion').value);
                let tx = getStore('carreras', 'readwrite').add({ nombre, facultad, duracion });
                tx.onsuccess = showFacultadesModule;
            };
        };
    }

    // (Implementa deleteFacultad, deleteCarrera, showDepartamentosModule, showAnunciosModule, etc.)
    window.deleteFacultad = async function(id) {
        getStore('facultades', 'readwrite').delete(id).onsuccess = showFacultadesModule;
    };
    window.deleteCarrera = async function(id) {
        getStore('carreras', 'readwrite').delete(id).onsuccess = showFacultadesModule;
    };

    // Utilidad para obtener todos los registros de un store
    function getAll(storeName) {
        return new Promise(resolve => {
            let tx = getStore(storeName).getAll();
            tx.onsuccess = () => resolve(tx.result || []);
        });
    }

    // EXTENSIÓN: Implementa aquí showDepartamentosModule, showAnunciosModule, gestión de notas, etc.

});
