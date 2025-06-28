// --- IndexedDB helper ---
const DB_NAME = 'unge_db';
const DB_VERSION = 2;
let db;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = function(e) {
            db = e.target.result;
            // Usuarios
            if (!db.objectStoreNames.contains('users')) {
                db.createObjectStore('users', { keyPath: 'email' });
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
            // Materias
            if (!db.objectStoreNames.contains('materias')) {
                db.createObjectStore('materias', { keyPath: 'id', autoIncrement: true });
            }
            // Asignación de materias a profesores
            if (!db.objectStoreNames.contains('profesores_materias')) {
                db.createObjectStore('profesores_materias', { keyPath: 'id', autoIncrement: true });
            }
            // Tareas
            if (!db.objectStoreNames.contains('tareas')) {
                db.createObjectStore('tareas', { keyPath: 'id', autoIncrement: true });
            }
            // Tareas entregadas
            if (!db.objectStoreNames.contains('tareas_entregadas')) {
                db.createObjectStore('tareas_entregadas', { keyPath: 'id', autoIncrement: true });
            }
            // Matrículas
            if (!db.objectStoreNames.contains('matriculas')) {
                db.createObjectStore('matriculas', { keyPath: 'id', autoIncrement: true });
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

let currentUser = null;

// --- Utilidades ---
function isValidGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}
function getPasswordRegex(role) {
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

document.addEventListener('DOMContentLoaded', async () => {
    await openDB();

    // Paneles extra por rol
    function mostrarPanelPorRol() {
        if(currentUser && currentUser.role === 'profesor') {
            document.getElementById('profesorModulePanel').style.display = '';
        } else {
            document.getElementById('profesorModulePanel').style.display = 'none';
        }
        if(currentUser && currentUser.role === 'estudiante') {
            document.getElementById('estudianteModulePanel').style.display = '';
        } else {
            document.getElementById('estudianteModulePanel').style.display = 'none';
        }
    }

    // --- Registro dinámico según rol ---
    const roleSelect = document.getElementById('registerRole');
    const dynamicFields = document.getElementById('dynamicFields');
    roleSelect.addEventListener('change', function() {
        dynamicFields.innerHTML = '';
        const role = this.value;
        let html = '';
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

        if (!isValidGmail(email)) return showError('El correo debe ser de Gmail.');
        const pattern = getPasswordRegex(role);
        if (!pattern.test(password)) return showError('La contraseña no sigue el formato requerido para el rol seleccionado.');

        let extra = {};
        ['registerCampus','registerFacultad','registerDepartamento','registerCarrera','registerCurso','registerSemestre','registerTurno'].forEach(id => {
            const el = document.getElementById(id);
            if (el) extra[id.replace('register','').toLowerCase()] = el.value.trim();
        });

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
                mostrarPanelPorRol();
                document.getElementById('loginForm').reset();
                document.getElementById('registerForm').reset();
            }
        };
        tx.onerror = () => showError('Error de inicio de sesión.');
    };

    document.getElementById('btnLogout').onclick = function() {
        currentUser = null;
        document.getElementById('main-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
        mostrarPanelPorRol();
    };

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

    document.getElementById('btnFacultades').onclick = showFacultadesModule;
    document.getElementById('btnDepartamentos').onclick = showDepartamentosModule;
    document.getElementById('btnAnuncios').onclick = showAnunciosModule;
    document.getElementById('btnMateriasProfesor').onclick = showProfesorMateriasModule;
    document.getElementById('btnTareasEstudiante').onclick = showEstudianteTareasModule;
    document.getElementById('btnMatricula').onclick = showMatriculaModule;

    // Utilidad para obtener todos los registros de un store
    function getAll(storeName) {
        return new Promise(resolve => {
            let tx = getStore(storeName).getAll();
            tx.onsuccess = () => resolve(tx.result || []);
        });
    }

    // --- Módulo de gestión de materias de profesores ---
    async function showProfesorMateriasModule() {
        // Panel de asignación de materias y listado
        let carreras = await getAll('carreras');
        let materias = await getAll('materias');
        let html = `<h4>Asignar Materias a Profesor</h4>
        <form id="asignarMateriaForm">
            <div class="mb-2">
                <label>Carrera:</label>
                <select id="carreraSelect" class="form-select">${carreras.map(c => `<option value="${c.id}">${c.nombre}</option>`)}</select>
            </div>
            <div class="mb-2">
                <label>Curso:</label>
                <select id="cursoSelect" class="form-select"></select>
            </div>
            <div class="mb-2">
                <label>Semestre:</label>
                <select id="semestreSelect" class="form-select">
                    <option value="1">Primer semestre</option>
                    <option value="2">Segundo semestre</option>
                </select>
            </div>
            <div class="mb-2">
                <label>Grupo:</label>
                <select id="grupoSelect" class="form-select">
                    <option value="GRUPO 1">GRUPO 1</option>
                    <option value="GRUPO 2">GRUPO 2</option>
                    <option value="GRUPO 3">GRUPO 3</option>
                </select>
            </div>
            <div class="mb-2">
                <label>Turno:</label>
                <select id="turnoSelect" class="form-select">
                    <option value="Mañana">Mañana</option>
                    <option value="Tarde">Tarde</option>
                    <option value="Noche">Noche</option>
                </select>
            </div>
            <div class="mb-2">
                <label>Letra (Turno):</label>
                <select id="turnoLetraSelect" class="form-select">
                    <option value="A">A (Mañana)</option>
                    <option value="B">B (Mañana)</option>
                    <option value="C">C (Tarde)</option>
                    <option value="D">D (Tarde)</option>
                    <option value="E">E (Noche)</option>
                </select>
            </div>
            <div class="mb-2">
                <label>Materia:</label>
                <select id="materiaSelect" class="form-select"></select>
            </div>
            <button class="btn btn-success mt-2">Asignar Materia</button>
        </form>
        <div id="materiasAsignadas"></div>
        <hr>
        <div id="panelProfesorTareas"></div>
        `;
        document.getElementById('module-content').innerHTML = html;
        cargarCursosYMaterias();
        document.getElementById('carreraSelect').onchange = cargarCursosYMaterias;
        document.getElementById('cursoSelect').onchange = cargarMaterias;
        document.getElementById('semestreSelect').onchange = cargarMaterias;

        async function cargarCursosYMaterias() {
            const carreraId = parseInt(document.getElementById('carreraSelect').value);
            const carrera = carreras.find(c => c.id === carreraId);
            let cursos = [];
            if(carrera) {
                cursos = (carrera.duracion == 4) ?
                    [`Primero de ${carrera.nombre}`, `Segundo de ${carrera.nombre}`,
                     `Tercero de ${carrera.nombre}`, `Finalista en ${carrera.nombre}`]
                    :
                    [`Primero de ${carrera.nombre}`, `Segundo de ${carrera.nombre}`,
                     `Finalista en ${carrera.nombre}`];
            }
            document.getElementById('cursoSelect').innerHTML =
                cursos.map(c => `<option>${c}</option>`).join('');
            cargarMaterias();
        }
        async function cargarMaterias() {
            const carreraId = parseInt(document.getElementById('carreraSelect').value);
            const curso = document.getElementById('cursoSelect').value;
            const semestre = document.getElementById('semestreSelect').value;
            let materias = await getAll('materias');
            materias = materias.filter(m => m.carreraId === carreraId && m.curso === curso && m.semestre == semestre);
            document.getElementById('materiaSelect').innerHTML =
                materias.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('');
        }

        document.getElementById('asignarMateriaForm').onsubmit = function(e) {
            e.preventDefault();
            const asignacion = {
                profesorEmail: currentUser.email,
                carreraId: parseInt(document.getElementById('carreraSelect').value),
                curso: document.getElementById('cursoSelect').value,
                semestre: document.getElementById('semestreSelect').value,
                grupo: document.getElementById('grupoSelect').value,
                turno: document.getElementById('turnoSelect').value,
                turno_letra: document.getElementById('turnoLetraSelect').value,
                materiaId: parseInt(document.getElementById('materiaSelect').value)
            };
            getStore('profesores_materias', 'readwrite').add(asignacion).onsuccess = listarMateriasAsignadas;
        };

        async function listarMateriasAsignadas() {
            let asignaciones = await getAll('profesores_materias');
            asignaciones = asignaciones.filter(a => a.profesorEmail === currentUser.email);
            let materias = await getAll('materias');
            let carreras = await getAll('carreras');
            document.getElementById('materiasAsignadas').innerHTML =
                `<h5>Materias Asignadas</h5><ul class="list-group">` +
                asignaciones.map(a => {
                    let mat = materias.find(m => m.id === a.materiaId);
                    let carr = carreras.find(c => c.id === a.carreraId);
                    return `<li class="list-group-item">
                        <b>${mat?.nombre || ''}</b> - ${a.curso}, Semestre ${a.semestre}, ${a.grupo}, ${a.turno_letra} (${a.turno})
                        <button class="btn btn-sm btn-outline-secondary float-end" onclick="window.mostrarPanelTareasProfesor(${a.id})">Tareas</button>
                        </li>`;
                }).join('') + '</ul>';
        }
        listarMateriasAsignadas();
        // Exponer función global para tareas del profesor
        window.mostrarPanelTareasProfesor = async function(asignacionId) {
            // Panel de tareas de la materia asignada
            let tareas = await getAll('tareas');
            tareas = tareas.filter(t => t.profesorMateriaId === asignacionId);
            let html = `<h5>Tareas de la Materia Asignada</h5>
            <form id="tareaForm">
                <input type="hidden" id="profesorMateriaId" value="${asignacionId}">
                <input class="form-control mb-2" id="tareaTitulo" placeholder="Título de la tarea" required>
                <textarea class="form-control mb-2" id="tareaDescripcion" placeholder="Descripción" required></textarea>
                <input type="file" class="form-control mb-2" id="tareaArchivo">
                <button class="btn btn-primary mb-2">Asignar Tarea</button>
            </form>
            <ul class="list-group mb-3">` +
            tareas.map(t => `<li class="list-group-item">
                <b>${t.titulo}</b> - ${t.descripcion}
                ${t.archivo ? `<br><a href="${t.archivo}" download>Archivo</a>` : ''}
                <br><small>Comentarios:</small>
                <ul>${(t.comentarios||[]).map(c => `<li>${c}</li>`).join('')}</ul>
            </li>`).join('') +
            '</ul>';
            document.getElementById('panelProfesorTareas').innerHTML = html;
            document.getElementById('tareaForm').onsubmit = function(e) {
                e.preventDefault();
                let archInput = document.getElementById('tareaArchivo');
                let archivo = archInput.files[0];
                if (archivo) {
                    let reader = new FileReader();
                    reader.onload = function(ev) {
                        saveTarea(ev.target.result);
                    };
                    reader.readAsDataURL(archivo);
                } else {
                    saveTarea('');
                }
                function saveTarea(fileDataUrl) {
                    let tareaData = {
                        profesorMateriaId: asignacionId,
                        titulo: document.getElementById('tareaTitulo').value,
                        descripcion: document.getElementById('tareaDescripcion').value,
                        archivo: fileDataUrl,
                        comentarios: []
                    };
                    getStore('tareas', 'readwrite').add(tareaData).onsuccess = () => window.mostrarPanelTareasProfesor(asignacionId);
                }
            };
        };
    }

    // --- Módulo de tareas de estudiante ---
    async function showEstudianteTareasModule() {
        // Busca matrícula del estudiante
        let matriculas = await getAll('matriculas');
        let mat = matriculas.find(m => m.email === currentUser.email);
        if (!mat) {
            document.getElementById('module-content').innerHTML =
                `<div class="alert alert-warning">No tienes matrícula registrada.</div>`;
            return;
        }
        // Busca materias asignadas a profesores para ese curso, grupo, turno y carrera
        let asignaciones = await getAll('profesores_materias');
        asignaciones = asignaciones.filter(a =>
            a.carreraId === mat.carreraId &&
            a.curso === mat.curso &&
            a.grupo === mat.grupo &&
            a.turno === mat.turno &&
            a.turno_letra === mat.turno_letra
        );
        let materias = await getAll('materias');
        let tareas = await getAll('tareas');
        let tareas_entregadas = await getAll('tareas_entregadas');
        let html = `<h4>Tareas asignadas por tus profesores</h4>`;
        asignaciones.forEach(a => {
            let matObj = materias.find(m => m.id === a.materiaId);
            let tareasMateria = tareas.filter(t => t.profesorMateriaId === a.id);
            html += `<h5>${matObj?.nombre || ''} - ${a.curso}, ${a.grupo}, ${a.turno_letra}</h5><ul class="list-group mb-3">`;
            tareasMateria.forEach(t => {
                let entregada = tareas_entregadas.find(e =>
                    e.tareaId === t.id && e.estudianteEmail === currentUser.email
                );
                html += `<li class="list-group-item">
                    <b>${t.titulo}</b><br>${t.descripcion}
                    ${t.archivo ? `<br><a href="${t.archivo}" download>Archivo</a>` : ''}
                    <div>
                        <form class="mt-2" enctype="multipart/form-data" onsubmit="window.entregarTareaEstudiante(event, ${t.id})">
                            <input type="file" class="form-control mb-1" name="archivoEstudiante" ${entregada ? 'disabled' : ''}>
                            <button class="btn btn-success btn-sm" ${entregada ? 'disabled' : ''}>${entregada ? 'Entregada' : 'Entregar'}</button>
                        </form>
                        <form class="mt-2" onsubmit="window.comentarTareaEstudiante(event, ${t.id})">
                            <input class="form-control mb-1" name="comentarioEst" placeholder="Comentario..." required>
                            <button class="btn btn-outline-primary btn-sm">Comentar</button>
                        </form>
                        <div><small>Comentarios:</small>
                        <ul>${(t.comentarios||[]).map(c => `<li>${c}</li>`).join('')}</ul></div>
                    </div>
                </li>`;
            });
            html += '</ul>';
        });
        document.getElementById('module-content').innerHTML = html;
        window.entregarTareaEstudiante = function(e, tareaId) {
            e.preventDefault();
            let input = e.target.querySelector('input[type="file"]');
            let archivo = input.files[0];
            if (!archivo) return alert("Adjunta un archivo para entregar la tarea");
            let reader = new FileReader();
            reader.onload = function(ev) {
                let data = {
                    tareaId,
                    estudianteEmail: currentUser.email,
                    archivo: ev.target.result,
                    estado: 'Entregado'
                };
                getStore('tareas_entregadas', 'readwrite').add(data).onsuccess = showEstudianteTareasModule;
            };
            reader.readAsDataURL(archivo);
        };
        window.comentarTareaEstudiante = function(e, tareaId) {
            e.preventDefault();
            let comentario = e.target.comentarioEst.value;
            // Guardar comentario en la tarea correspondiente
            let tx = getStore('tareas', 'readwrite').get(tareaId);
            tx.onsuccess = function() {
                let tarea = tx.result;
                if (!tarea.comentarios) tarea.comentarios = [];
                tarea.comentarios.push(`${currentUser.name}: ${comentario}`);
                getStore('tareas', 'readwrite').put(tarea).onsuccess = showEstudianteTareasModule;
            };
        };
    }

    // --- Módulo matrícula ---
    async function showMatriculaModule() {
        let carreras = await getAll('carreras');
        let html = `<h4>Matrícula de Estudiantes</h4>
        <form id="matriculaForm">
            <input class="form-control mb-2" id="matriculaNombre" placeholder="Nombre Completo" required>
            <input class="form-control mb-2" id="matriculaTelefono" placeholder="Teléfono" required>
            <input class="form-control mb-2" id="matriculaDireccion" placeholder="Dirección" required>
            <input class="form-control mb-2" id="matriculaEmail" placeholder="Correo Gmail" required>
            <select class="form-select mb-2" id="matriculaCarrera" required>
                <option value="">Seleccione Carrera</option>
                ${carreras.map(c => `<option value="${c.id}">${c.nombre}</option>`)}
            </select>
            <select class="form-select mb-2" id="matriculaCurso" required></select>
            <select class="form-select mb-2" id="matriculaGrupo" required>
                <option>GRUPO 1</option>
                <option>GRUPO 2</option>
                <option>GRUPO 3</option>
            </select>
            <select class="form-select mb-2" id="matriculaTurnoGeneral" required>
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Noche</option>
            </select>
            <select class="form-select mb-2" id="matriculaTurnoLetra" required>
                <option>A</option>
                <option>B</option>
                <option>C</option>
                <option>D</option>
                <option>E</option>
            </select>
            <select class="form-select mb-2" id="matriculaPago" required>
                <option>Efectivo (pago efectuado sin deuda alguna)</option>
            </select>
            <input class="form-control mb-2" id="matriculaMoneda" value="XFA" readonly>
            <button class="btn btn-success mt-2">Matricular</button>
        </form>`;
        document.getElementById('module-content').innerHTML = html;

        document.getElementById('matriculaCarrera').onchange = function() {
            const carreraId = parseInt(this.value);
            const carrera = carreras.find(c => c.id === carreraId);
            let cursos = [];
            if(carrera) {
                cursos = (carrera.duracion == 4) ?
                    [`Primero de ${carrera.nombre}`, `Segundo de ${carrera.nombre}`,
                     `Tercero de ${carrera.nombre}`, `Finalista en ${carrera.nombre}`]
                    :
                    [`Primero de ${carrera.nombre}`, `Segundo de ${carrera.nombre}`,
                     `Finalista en ${carrera.nombre}`];
            }
            document.getElementById('matriculaCurso').innerHTML =
                cursos.map(c => `<option>${c}</option>`).join('');
        };
        document.getElementById('matriculaForm').onsubmit = function(e) {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('matriculaNombre').value.trim(),
                telefono: document.getElementById('matriculaTelefono').value.trim(),
                direccion: document.getElementById('matriculaDireccion').value.trim(),
                email: document.getElementById('matriculaEmail').value.trim(),
                carreraId: parseInt(document.getElementById('matriculaCarrera').value),
                curso: document.getElementById('matriculaCurso').value,
                grupo: document.getElementById('matriculaGrupo').value,
                turno: document.getElementById('matriculaTurnoGeneral').value,
                turno_letra: document.getElementById('matriculaTurnoLetra').value,
                pago: document.getElementById('matriculaPago').value,
                moneda: document.getElementById('matriculaMoneda').value
            };
            if(!isValidGmail(data.email)) return alert('El email debe ser de Gmail');
            getStore('matriculas', 'readwrite').add(data).onsuccess = function() {
                alert('Matrícula realizada correctamente');
                document.getElementById('matriculaForm').reset();
            };
        };
    }

    // --- Ejemplo simple de módulo de facultades/carreras (igual que antes) ---
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
                let decano = '';
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

    window.deleteFacultad = async function(id) {
        getStore('facultades', 'readwrite').delete(id).onsuccess = showFacultadesModule;
    };
    window.deleteCarrera = async function(id) {
        getStore('carreras', 'readwrite').delete(id).onsuccess = showFacultadesModule;
    };

    // Implementa showDepartamentosModule, showAnunciosModule, etc.
    function showDepartamentosModule() {
        document.getElementById('module-content').innerHTML = "<h4>Módulo Departamentos - en desarrollo</h4>";
    }
    function showAnunciosModule() {
        document.getElementById('module-content').innerHTML = "<h4>Módulo Anuncios - en desarrollo</h4>";
                          }// ...[código anterior de gestión de usuarios, login, registro, materias, matrícula, tareas, etc.]...

// --- NUEVO: Panel gestión usuarios ---
document.getElementById('btnGestionUsuarios').onclick = showGestionUsuarios;

async function showGestionUsuarios() {
    let html = `
    <h3>Gestión de Usuarios</h3>
    <ul class="nav nav-pills mb-3" id="usuariosTabs">
      <li class="nav-item"><button class="nav-link active" id="tab-profesores" data-bs-toggle="pill" data-bs-target="#panel-profesores">Profesores</button></li>
      <li class="nav-item"><button class="nav-link" id="tab-estudiantes" data-bs-toggle="pill" data-bs-target="#panel-estudiantes">Estudiantes</button></li>
      <li class="nav-item"><button class="nav-link" id="tab-usuarios" data-bs-toggle="pill" data-bs-target="#panel-usuarios">Usuarios</button></li>
    </ul>
    <div class="tab-content">
      <div class="tab-pane fade show active" id="panel-profesores"></div>
      <div class="tab-pane fade" id="panel-estudiantes"></div>
      <div class="tab-pane fade" id="panel-usuarios"></div>
    </div>`;
    document.getElementById('module-content').innerHTML = html;
    showProfesoresPanel();
    showEstudiantesPanel();
    showUsuariosPanel();
}

// --- Submódulo Profesores ---
async function showProfesoresPanel() {
    let usuarios = await getAll('users');
    let profesores = usuarios.filter(u => u.role === 'profesor');
    let asignaciones = await getAll('profesores_materias');
    let carreras = await getAll('carreras');
    let facultades = await getAll('facultades');
    let materias = await getAll('materias');
    let html = `<h4>Profesores</h4>
    <table class="table table-bordered table-sm">
      <thead><tr>
        <th>Nombre</th><th>Email</th><th>Facultades</th>
        <th>Carreras</th><th>Materias</th><th>Cursos</th>
        <th>Opciones</th>
      </tr></thead>
      <tbody>
    `;
    for (let prof of profesores) {
        let asigs = asignaciones.filter(a => a.profesorEmail === prof.email);
        let facs = [...new Set(asigs.map(a => facultades.find(f => f.id === a.carreraId)?.nombre || ''))].join(', ');
        let carrs = [...new Set(asigs.map(a => carreras.find(c => c.id === a.carreraId)?.nombre || ''))].join(', ');
        let mats = [...new Set(asigs.map(a => materias.find(m => m.id === a.materiaId)?.nombre || ''))].join(', ');
        let cursos = [...new Set(asigs.map(a => a.curso))].join(', ');
        html += `<tr>
          <td>${prof.name}</td>
          <td>${prof.email}</td>
          <td>${facs}</td>
          <td>${carrs}</td>
          <td>${mats}</td>
          <td>${cursos}</td>
          <td><button class="btn btn-sm btn-info" onclick="window.panelDetalleProfesor('${prof.email}')">Ver/Añadir</button></td>
        </tr>`;
    }
    html += `</tbody></table>
    <div id="profesorDetallePanel"></div>
    `;
    document.getElementById('panel-profesores').innerHTML = html;
    // Exponer detalle para añadir materias/carreras/facultad a profe
    window.panelDetalleProfesor = async function(email) {
        let prof = profesores.find(p => p.email === email);
        let asigs = asignaciones.filter(a => a.profesorEmail === prof.email);
        let materias = await getAll('materias');
        let carreras = await getAll('carreras');
        let facs = await getAll('facultades');
        let html = `<h5>Asignar a ${prof.name} (puede impartir en distintas facultades/carreras/materias)</h5>
        <form id="addAsigProfesor">
          <select class="form-select mb-2" name="carreraId">
            ${carreras.map(c => `<option value="${c.id}">${c.nombre}</option>`)}
          </select>
          <select class="form-select mb-2" name="curso">
            <option>Primero</option>
            <option>Segundo</option>
            <option>Tercero</option>
            <option>Finalista</option>
          </select>
          <select class="form-select mb-2" name="semestre">
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          <select class="form-select mb-2" name="materiaId">
            ${materias.map(m => `<option value="${m.id}">${m.nombre}</option>`)}
          </select>
          <button class="btn btn-primary btn-sm">Agregar</button>
        </form>
        <ul class="list-group mt-2 mb-2">
        ${asigs.map(a => {
            let mat = materias.find(m => m.id === a.materiaId);
            let carrera = carreras.find(c => c.id === a.carreraId);
            return `<li class="list-group-item">${mat?.nombre || '-'} - ${carrera?.nombre || '-'} - Curso ${a.curso} - Semestre ${a.semestre}</li>`;
        }).join('')}</ul>`;
        document.getElementById('profesorDetallePanel').innerHTML = html;
        document.getElementById('addAsigProfesor').onsubmit = function(e) {
            e.preventDefault();
            let data = Object.fromEntries(new FormData(e.target));
            let asignacion = {
                profesorEmail: prof.email,
                carreraId: parseInt(data.carreraId),
                curso: data.curso,
                semestre: data.semestre,
                materiaId: parseInt(data.materiaId)
            };
            getStore('profesores_materias','readwrite').add(asignacion).onsuccess = () => window.panelDetalleProfesor(prof.email);
        };
    };
}

// --- Submódulo Estudiantes ---
async function showEstudiantesPanel() {
    let usuarios = await getAll('users');
    let estudiantes = usuarios.filter(u => u.role === 'estudiante');
    let html = `<h4>Estudiantes</h4>
      <table class="table table-bordered table-sm">
        <thead><tr>
          <th>Nombre</th><th>Email</th><th>Opciones</th>
        </tr></thead><tbody>
        ${estudiantes.map(est => `<tr>
          <td>${est.name}</td>
          <td>${est.email}</td>
          <td>
            <button class="btn btn-sm btn-info" onclick="window.panelDetalleEstudiante('${est.email}')">Ver Matriculados</button>
          </td>
        </tr>`).join('')}
      </tbody></table>
      <div id="estudianteDetallePanel"></div>`;
    document.getElementById('panel-estudiantes').innerHTML = html;

    window.panelDetalleEstudiante = async function(email) {
        let matriculas = await getAll('matriculas');
        let carreras = await getAll('carreras');
        let facultades = await getAll('facultades');
        let departamentos = await getAll('departamentos');
        let matAlumno = matriculas.filter(m => m.email === email);
        let html = `<h5>Alumnos Matriculados</h5>
        <div class="accordion" id="accordionMatriculados">
        ${matAlumno.map((m,i) => {
            let carrera = carreras.find(c => c.id === m.carreraId);
            let facultad = facultades.find(f => f.nombre === carrera?.facultad);
            // Suponiendo que el departamento está incluido en la matrícula o carrera
            return `<div class="accordion-item">
            <h2 class="accordion-header" id="heading${i}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${i}">
                ${m.nombre} - ${carrera?.nombre || '-'} (${facultad?.nombre || '-'})
                </button>
            </h2>
            <div id="collapse${i}" class="accordion-collapse collapse" data-bs-parent="#accordionMatriculados">
                <div class="accordion-body">
                <b>Dirección:</b> ${m.direccion}<br>
                <b>Teléfono:</b> ${m.telefono}<br>
                <b>Email:</b> ${m.email}<br>
                <b>Curso:</b> ${m.curso}<br>
                <b>Grupo:</b> ${m.grupo}<br>
                <b>Turno:</b> ${m.turno} (${m.turno_letra})<br>
                <b>Pago:</b> ${m.pago} (${m.moneda})<br>
                </div>
            </div>
            </div>`;
        }).join('')}
        </div>`;
        document.getElementById('estudianteDetallePanel').innerHTML = html;
    };
}

// --- Submódulo Usuarios (solo lista general) ---
async function showUsuariosPanel() {
    let usuarios = await getAll('users');
    let html = `<h4>Todos los Usuarios</h4>
    <table class="table table-bordered table-sm">
      <thead><tr>
        <th>Nombre</th><th>Email</th><th>Rol</th>
      </tr></thead>
      <tbody>
      ${usuarios.map(u =>
        `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.role}</td></tr>`
      ).join('')}
      </tbody>
    </table>`;
    document.getElementById('panel-usuarios').innerHTML = html;
}

// --- Módulo Carreras público ---
async function showListadoCarreras() {
    let carreras = await getAll('carreras');
    let html = `<h4>Carreras Disponibles</h4>
    <ul class="list-group mb-2">
    ${carreras.map(c => `<li class="list-group-item">${c.nombre} (${c.duracion} años)</li>`).join('')}
    </ul>
    <p><b>Fechas de examen de SELECTIVIDAD:</b></p>
    <ul>
        <li>Junio: 20 de junio 2025</li>
        <li>Septiembre: 10 de septiembre 2025</li>
    </ul>
    <button class="btn btn-outline-secondary mb-2" id="btnCondicionesMatricula">Ver Condiciones de Matrícula</button>
    <div id="condicionesMatriculaPanel" class="mb-2"></div>
    <button class="btn btn-outline-secondary" id="btnProcesoMatricula">Ver Proceso de Matrícula</button>
    <div id="procesoMatriculaPanel"></div>
    `;
    document.getElementById('module-content').innerHTML = html;
    document.getElementById('btnCondicionesMatricula').onclick = function() {
        document.getElementById('condicionesMatriculaPanel').innerHTML = `
        <div class="alert alert-info mt-2">
        <ul>
          <li>El estudiante debe estar al día en el pago de tasas.</li>
          <li>Debe presentar la documentación requerida.</li>
          <li>El correo de matrícula debe ser @gmail.com</li>
        </ul>
        </div>
        `;
    };
    document.getElementById('btnProcesoMatricula').onclick = function() {
        document.getElementById('procesoMatriculaPanel').innerHTML = `
        <div class="alert alert-info mt-2">
          <ol>
            <li>Rellenar el formulario de matrícula.</li>
            <li>Adjuntar la documentación y comprobante de pago.</li>
            <li>Esperar confirmación de la secretaría.</li>
          </ol>
        </div>
        `;
    };
}

// --- ANUNCIOS: Para secretaría general (envío selectivo/profesores/estudiantes/general) ---
async function showAnunciosModule() {
    let user = currentUser;
    let html = `<h4>Tablón de Anuncios</h4>`;
    // Si es secretaría general, puede publicar para todos o por usuario/rol
    if (user.role === 'secretario') {
        html += `<form id="formAnuncio" class="mb-3">
          <input class="form-control mb-1" placeholder="Título" name="titulo" required>
          <textarea class="form-control mb-1" placeholder="Mensaje" name="mensaje" required></textarea>
          <label>Destinatario:</label>
          <select class="form-select mb-1" name="destino" required>
            <option value="todos">Todos</option>
            <option value="profesores">Todos los Profesores</option>
            <option value="estudiantes">Todos los Estudiantes</option>
            <option value="usuario">Usuario concreto</option>
          </select>
          <input class="form-control mb-1" placeholder="Email usuario" name="emailUsuario" style="display:none;">
          <button class="btn btn-success">Publicar</button>
        </form>`;
    }
    html += `<div id="panelAnuncios"></div>`;
    document.getElementById('module-content').innerHTML = html;

    // Dinámica para mostrar input de email si el destino es usuario concreto
    if (user.role === 'secretario') {
        document.querySelector('[name="destino"]').onchange = function() {
            document.querySelector('[name="emailUsuario"]').style.display =
                (this.value === 'usuario') ? '' : 'none';
        };
        document.getElementById('formAnuncio').onsubmit = function(e) {
            e.preventDefault();
            let data = Object.fromEntries(new FormData(e.target));
            getStore('anuncios', 'readwrite').add({
                titulo: data.titulo,
                mensaje: data.mensaje,
                destino: data.destino,
                emailUsuario: data.emailUsuario || '',
                fecha: new Date().toLocaleString(),
            }).onsuccess = showAnunciosModule;
        };
    }

    // Mostrar anuncios visibles para el usuario
    let anuncios = await getAll('anuncios');
    let visibles = anuncios.filter(a =>
        a.destino === 'todos' ||
        (a.destino === 'profesores' && user.role === 'profesor') ||
        (a.destino === 'estudiantes' && user.role === 'estudiante') ||
        (a.destino === 'usuario' && a.emailUsuario === user.email)
    );
    document.getElementById('panelAnuncios').innerHTML =
      visibles.length
      ? visibles.map(a => `<div class="alert alert-primary"><b>${a.titulo}</b><br>${a.mensaje}<br><small>${a.fecha}</small></div>`).join('')
      : `<div class="alert alert-info">No hay anuncios para ti.</div>`;
}

// --- ADMINISTRACIÓN: Compartir archivos/comentarios según reglas por rol ---
document.getElementById('btnAdministracion') && (document.getElementById('btnAdministracion').onclick = showAdministracionModule);

async function showAdministracionModule() {
    let user = currentUser;
    let html = `<h4>Administración de Archivos y Comentarios</h4>`;
    // Panel de compartir archivos/comentarios según rol
    // Ejemplo: secretaría general puede compartir con decanos, subsecretarías...
    html += `
    <form id="formCompartirArchivo" class="mb-2">
      <input class="form-control mb-1" name="titulo" placeholder="Título" required>
      <textarea class="form-control mb-1" name="comentario" placeholder="Comentario"></textarea>
      <input type="file" class="form-control mb-1" name="archivo">
      <label>Compartir con:</label>
      <select class="form-select mb-1" name="destino">
         <option value="todos">Todos los Campus</option>
         <option value="decanos">Decanos</option>
         <option value="jefes">Jefes de Departamentos</option>
         <option value="profesores">Profesores</option>
         <option value="estudiantes">Estudiantes</option>
         <option value="usuario">Usuario concreto</option>
      </select>
      <input class="form-control mb-1" name="emailUsuario" placeholder="Email usuario" style="display:none;">
      <button class="btn btn-warning">Compartir</button>
    </form>
    <div id="panelArchivos"></div>
    `;
    document.getElementById('module-content').innerHTML = html;
    document.querySelector('[name="destino"]').onchange = function() {
        document.querySelector('[name="emailUsuario"]').style.display =
            (this.value === 'usuario') ? '' : 'none';
    };
    document.getElementById('formCompartirArchivo').onsubmit = function(e) {
        e.preventDefault();
        let data = Object.fromEntries(new FormData(e.target));
        let fileInput = e.target.querySelector('[name="archivo"]');
        let archivo = fileInput.files[0];
        if (archivo) {
            let reader = new FileReader();
            reader.onload = function(ev) {
                guardarArchivo(ev.target.result);
            };
            reader.readAsDataURL(archivo);
        } else {
            guardarArchivo('');
        }
        function guardarArchivo(archivoUrl) {
            getStore('anuncios', 'readwrite').add({
                titulo: data.titulo,
                mensaje: data.comentario,
                destino: data.destino,
                emailUsuario: data.emailUsuario || '',
                archivo: archivoUrl,
                fecha: new Date().toLocaleString(),
                tipo: 'archivo'
            }).onsuccess = showAdministracionModule;
        }
    };
    // Mostrar archivos/comentarios visibles para el usuario
    let anuncios = await getAll('anuncios');
    let visibles = anuncios.filter(a =>
        a.tipo === 'archivo' &&
        (a.destino === 'todos' ||
         (a.destino === 'decanos' && user.role === 'decano') ||
         (a.destino === 'jefes' && user.role.startsWith('jefe')) ||
         (a.destino === 'profesores' && user.role === 'profesor') ||
         (a.destino === 'estudiantes' && user.role === 'estudiante') ||
         (a.destino === 'usuario' && a.emailUsuario === user.email))
    );
    document.getElementById('panelArchivos').innerHTML =
      visibles.length
      ? visibles.map(a => `<div class="alert alert-warning">
        <b>${a.titulo}</b><br>${a.mensaje}<br>
        ${a.archivo ? `<a href="${a.archivo}" download>Descargar archivo</a><br>` : ''}
        <small>${a.fecha}</small></div>`).join('')
      : `<div class="alert alert-info">No hay archivos para ti.</div>`;
}

// --- Visión por rol: rector, secretario, decano, jefe, adjunto ---
function mostrarPanelPorRol() {
    document.getElementById('profesorModulePanel').style.display = (currentUser && currentUser.role === 'profesor') ? '' : 'none';
    document.getElementById('estudianteModulePanel').style.display = (currentUser && currentUser.role === 'estudiante') ? '' : 'none';
    document.getElementById('adminModulePanel').style.display =
        (currentUser && ['rector','secretario','decano','jefe_dpto','jefe_adjunto_dpto'].includes(currentUser.role))
        ? '' : 'none';
}

// --- Vínculo carreras públicas ---
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnFacultades').onclick = showListadoCarreras;
});// ... [El resto de tu código previo permanece igual] ...

// --- Módulo INFÓRMATE ---
document.getElementById('btnInformate').onclick = function() {
    document.getElementById('module-content').innerHTML = `
        <div class="card border-success mb-4">
            <div class="card-header bg-success text-white"><b>¿Para qué sirve la aplicación?</b></div>
            <div class="card-body">
                <p>La plataforma UNGE - Gestión Universitaria es una solución integral para la administración eficiente de los procesos académicos y administrativos en la Universidad Nacional de Guinea Ecuatorial. Permite gestionar usuarios, matrículas, carreras, departamentos, anuncios, tareas y el intercambio de información y archivos entre todos los actores del entorno universitario.</p>
            </div>
        </div>
        <div class="card border-success mb-4">
            <div class="card-header bg-success text-white"><b>¿Cómo se utiliza?</b></div>
            <div class="card-body">
                <ul>
                    <li>Regístrate según tu rol (estudiante, profesor, decano, etc.) y accede con tus credenciales.</li>
                    <li>Gestiona tus materias, carreras, anuncios, tareas o matrículas desde los módulos correspondientes.</li>
                    <li>Los estudiantes pueden matricularse y descargar su comprobante en PDF tras la inscripción.</li>
                    <li>El sistema permite el flujo de archivos, comentarios y tareas entre los distintos roles de la universidad.</li>
                </ul>
            </div>
        </div>
        <div class="card border-success mb-4">
            <div class="card-header bg-success text-white"><b>Información sobre el desarrollador</b></div>
            <div class="card-body">
                <b>Nombre completo:</b> Tarciano ENZEMA NCHAMA<br>
                <b>Formación académica:</b> Finalista universitario de la UNGE<br>
                <b>Facultad:</b> Ciencias económicas gestión y administración<br>
                <b>Departamento:</b> Informática de gestión empresarial<br>
                <b>Contacto:</b> <a href="mailto:enzemajr@gmail.com">enzemajr@gmail.com</a><br>
                <b>Fecha de creación:</b> 27/07/2025
            </div>
        </div>
    `;
};

// --- Matrícula: Generar comprobante PDF tras matrícula exitosa ---
async function showMatriculaModule() {
    let carreras = await getAll('carreras');
    let html = `<h4>Matrícula de Estudiantes</h4>
    <form id="matriculaForm">
        <input class="form-control mb-2" id="matriculaNombre" placeholder="Nombre Completo" required>
        <input class="form-control mb-2" id="matriculaTelefono" placeholder="Teléfono" required>
        <input class="form-control mb-2" id="matriculaDireccion" placeholder="Dirección" required>
        <input class="form-control mb-2" id="matriculaEmail" placeholder="Correo Gmail" required>
        <select class="form-select mb-2" id="matriculaCarrera" required>
            <option value="">Seleccione Carrera</option>
            ${carreras.map(c => `<option value="${c.id}">${c.nombre}</option>`)}
        </select>
        <select class="form-select mb-2" id="matriculaCurso" required></select>
        <select class="form-select mb-2" id="matriculaGrupo" required>
            <option>GRUPO 1</option>
            <option>GRUPO 2</option>
            <option>GRUPO 3</option>
        </select>
        <select class="form-select mb-2" id="matriculaTurnoGeneral" required>
            <option>Mañana</option>
            <option>Tarde</option>
            <option>Noche</option>
        </select>
        <select class="form-select mb-2" id="matriculaTurnoLetra" required>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
            <option>E</option>
        </select>
        <select class="form-select mb-2" id="matriculaPago" required>
            <option>Efectivo (pago efectuado sin deuda alguna)</option>
        </select>
        <input class="form-control mb-2" id="matriculaMoneda" value="XFA" readonly>
        <button class="btn btn-success mt-2">Matricular</button>
    </form>
    <div id="matriculaPDFPanel"></div>
    `;
    document.getElementById('module-content').innerHTML = html;

    document.getElementById('matriculaCarrera').onchange = function() {
        const carreraId = parseInt(this.value);
        const carrera = carreras.find(c => c.id === carreraId);
        let cursos = [];
        if(carrera) {
            cursos = (carrera.duracion == 4) ?
                [`Primero de ${carrera.nombre}`, `Segundo de ${carrera.nombre}`,
                 `Tercero de ${carrera.nombre}`, `Finalista en ${carrera.nombre}`]
                :
                [`Primero de ${carrera.nombre}`, `Segundo de ${carrera.nombre}`,
                 `Finalista en ${carrera.nombre}`];
        }
        document.getElementById('matriculaCurso').innerHTML =
            cursos.map(c => `<option>${c}</option>`).join('');
    };
    document.getElementById('matriculaForm').onsubmit = function(e) {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('matriculaNombre').value.trim(),
            telefono: document.getElementById('matriculaTelefono').value.trim(),
            direccion: document.getElementById('matriculaDireccion').value.trim(),
            email: document.getElementById('matriculaEmail').value.trim(),
            carreraId: parseInt(document.getElementById('matriculaCarrera').value),
            curso: document.getElementById('matriculaCurso').value,
            grupo: document.getElementById('matriculaGrupo').value,
            turno: document.getElementById('matriculaTurnoGeneral').value,
            turno_letra: document.getElementById('matriculaTurnoLetra').value,
            pago: document.getElementById('matriculaPago').value,
            moneda: document.getElementById('matriculaMoneda').value
        };
        if(!isValidGmail(data.email)) return alert('El email debe ser de Gmail');
        getStore('matriculas', 'readwrite').add(data).onsuccess = function() {
            alert('Matrícula realizada correctamente');
            document.getElementById('matriculaForm').reset();
            generarComprobantePDF(data, carreras.find(c => c.id === data.carreraId));
        };
    };
}

// --- Generar PDF de matrícula ---
function generarComprobantePDF(data, carrera) {
    // Usar jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(31, 77, 170);
    doc.text("UNGE - Universidad Nacional de Guinea Ecuatorial", 15, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 51, 51);
    doc.text("Comprobante de Matrícula Universitaria", 15, 30);

    doc.setDrawColor(40, 167, 69);
    doc.setLineWidth(0.7);
    doc.line(14, 33, 195, 33);

    doc.setFontSize(11);
    doc.text(`Nombre del estudiante: ${data.nombre}`, 15, 42);
    doc.text(`Teléfono: ${data.telefono}`, 15, 50);
    doc.text(`Dirección: ${data.direccion}`, 15, 58);
    doc.text(`Correo electrónico: ${data.email}`, 15, 66);
    doc.text(`Carrera: ${carrera?.nombre || ''}`, 15, 74);
    doc.text(`Curso: ${data.curso}`, 15, 82);
    doc.text(`Grupo: ${data.grupo}`, 15, 90);
    doc.text(`Turno: ${data.turno} (${data.turno_letra})`, 15, 98);
    doc.text(`Pago: ${data.pago}`, 15, 106);
    doc.text(`Moneda: ${data.moneda}`, 15, 114);

    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 120, 190, 120);
    doc.text(
        "Este comprobante avala que el estudiante ha realizado legalmente su matrícula en la UNGE.\n" +
        "Cualquier falsificación será sancionada conforme a la normativa vigente.",
        15, 127
    );

    // Espacios para firmas
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Firma Secretario/a:", 20, 170);
    doc.text("Firma Tutor/a:", 120, 170);
    doc.setDrawColor(40, 167, 69);
    doc.line(20, 175, 80, 175);
    doc.line(120, 175, 180, 175);

    // Mensaje breve legalidad
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
        "La presente matrícula tiene validez legal y reconoce al estudiante como miembro oficial de la comunidad universitaria.",
        15, 185
    );

    doc.setFontSize(10);
    doc.setTextColor(31, 77, 170);
    doc.text("UNGE - El futuro educativo de Guinea Ecuatorial", 15, 200);

    doc.save(`Comprobante_Matricula_${data.nombre.replace(/ /g, "_")}.pdf`);
    // Opción: mostrar mensaje y opción de descargar de nuevo
    document.getElementById('matriculaPDFPanel').innerHTML = `
        <div class="alert alert-success mt-3">
            El comprobante de matrícula ha sido generado y descargado en PDF.
        </div>
    `;
}

// Mantén el resto de la lógica como antes...
