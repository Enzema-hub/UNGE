// ===================
// UNGE GESTIÓN UNIVERSITARIA - LÓGICA COMPLETA
// ===================

/*--- INICIO BLOQUE: IndexedDB y Utilidades ---*/
{
const DB_NAME = 'unge_db';
const DB_VERSION = 2;
let db;
let currentUser = null;

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = function(e) {
            db = e.target.result;
            if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'email' });
            if (!db.objectStoreNames.contains('facultades')) db.createObjectStore('facultades', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('carreras')) db.createObjectStore('carreras', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('departamentos')) db.createObjectStore('departamentos', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('anuncios')) db.createObjectStore('anuncios', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('notas')) db.createObjectStore('notas', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('materias')) db.createObjectStore('materias', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('profesores_materias')) db.createObjectStore('profesores_materias', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('tareas')) db.createObjectStore('tareas', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('tareas_entregadas')) db.createObjectStore('tareas_entregadas', { keyPath: 'id', autoIncrement: true });
            if (!db.objectStoreNames.contains('matriculas')) db.createObjectStore('matriculas', { keyPath: 'id', autoIncrement: true });
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
function getAll(storeName) {
    return new Promise(resolve => {
        let tx = getStore(storeName).getAll();
        tx.onsuccess = () => resolve(tx.result || []);
    });
}
function isValidGmail(email) { return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email); }
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
}
/*--- FIN BLOQUE: IndexedDB y Utilidades ---*/


/*--- INICIO BLOQUE: Autenticación y Registro ---*/
{
document.addEventListener('DOMContentLoaded', async () => {
    await openDB();
    // Panel por rol
    function mostrarPanelPorRol() {
        document.getElementById('profesorModulePanel').style.display = (currentUser && currentUser.role === 'profesor') ? '' : 'none';
        document.getElementById('estudianteModulePanel').style.display = (currentUser && currentUser.role === 'estudiante') ? '' : 'none';
        document.getElementById('adminModulePanel').style.display =
            (currentUser && ['rector','secretario','decano','jefe_dpto','jefe_adjunto_dpto'].includes(currentUser.role))
            ? '' : 'none';
    }
    // Registro dinámico según rol
    const roleSelect = document.getElementById('registerRole');
    const dynamicFields = document.getElementById('dynamicFields');
    roleSelect.addEventListener('change', function() {
        dynamicFields.innerHTML = '';
        const role = this.value;
        let html = '';
        const campusSelect = `
            <div class="mb-3"><label class="form-label">Campus</label>
            <select class="form-select" id="registerCampus" required>
                <option value="">Selecciona</option>
                <option>CAMPUS CENTRAL</option>
                <option>CAMPUS 2</option>
                <option>CAMPUS 3</option>
            </select></div>`;
        const facultadSelect = `<div class="mb-3"><label class="form-label">Facultad</label>
            <input type="text" class="form-control" id="registerFacultad" required></div>`;
        const dptoSelect = `<div class="mb-3"><label class="form-label">Departamento</label>
            <input type="text" class="form-control" id="registerDepartamento" required></div>`;
        const carreraSelect = `<div class="mb-3"><label class="form-label">Carrera</label>
            <input type="text" class="form-control" id="registerCarrera" required></div>`;
        const cursoSelect = `<div class="mb-3"><label class="form-label">Curso</label>
            <input type="text" class="form-control" id="registerCurso" required></div>`;
        const semestreSelect = `<div class="mb-3"><label class="form-label">Semestre</label>
            <select class="form-select" id="registerSemestre" required>
                <option value="">Selecciona</option>
                <option>Primer semestre</option>
                <option>Segundo semestre</option>
            </select></div>`;
        const turnoSelect = `<div class="mb-3"><label class="form-label">Turno</label>
            <select class="form-select" id="registerTurno" required>
                <option value="">Selecciona</option>
                <option>Mañana</option>
                <option>Tarde</option>
                <option>Noche</option>
            </select></div>`;
        if (role === 'rector') html += campusSelect;
        else if (role === 'decano' || role === 'secretario') html += facultadSelect + campusSelect;
        else if (role === 'profesor' || role === 'estudiante') html += facultadSelect + dptoSelect + carreraSelect + cursoSelect + semestreSelect + turnoSelect + campusSelect;
        else if (role === 'jefe_dpto' || role === 'jefe_adjunto_dpto') html += facultadSelect + dptoSelect + campusSelect;
        dynamicFields.innerHTML = html;
    });

    // Registro
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
            setTimeout(() => { document.querySelector('#login-tab').click(); }, 2000);
        };
        req.onerror = () => showError('Ya existe un usuario con ese correo.');
    };

    // Login
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
        document.getElementById('welcomeMsg').textContent = `¡Bienvenido(a), ${prefix} ${currentUser.name} (${roleDisplay})!`;
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
/*--- FIN BLOQUE: Autenticación y Registro ---*/


/*--- INICIO BLOQUE: Módulos Principales y Navegación ---*/
// Vínculos de navegación
document.getElementById('btnFacultades').onclick = showListadoCarreras;
document.getElementById('btnGestionUsuarios').onclick = showGestionUsuarios;
document.getElementById('btnMatricula').onclick = showMatriculaModule;
document.getElementById('btnAnuncios').onclick = showAnunciosModule;
document.getElementById('btnMateriasProfesor').onclick = showProfesorMateriasModule;
document.getElementById('btnTareasEstudiante').onclick = showEstudianteTareasModule;
document.getElementById('btnAdministracion') && (document.getElementById('btnAdministracion').onclick = showAdministracionModule);
document.getElementById('btnInformate').onclick = showInformatePanel;
/*--- FIN BLOQUE: Módulos Principales y Navegación ---*/


/*--- INICIO BLOQUE: Módulo INFÓRMATE ---*/
function showInformatePanel() {
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
}
/*--- FIN BLOQUE: Módulo INFÓRMATE ---*/


/*--- INICIO BLOQUE: Matrícula y PDF ---*/
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
function generarComprobantePDF(data, carrera) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text("Firma Secretario/a:", 20, 170);
    doc.text("Firma Tutor/a:", 120, 170);
    doc.setDrawColor(40, 167, 69);
    doc.line(20, 175, 80, 175);
    doc.line(120, 175, 180, 175);
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
    document.getElementById('matriculaPDFPanel').innerHTML = `
        <div class="alert alert-success mt-3">
            El comprobante de matrícula ha sido generado y descargado en PDF.
        </div>
    `;
}
/*--- FIN BLOQUE: Matrícula y PDF ---*/

/*--- INICIO BLOQUE: Otros módulos (usuarios, profesores, anuncios, administración, materias, tareas, carreras) ---*/
// ... Aquí puedes pegar los módulos showGestionUsuarios, showProfesoresPanel, showEstudiantesPanel, showUsuariosPanel,
// showListadoCarreras, showAnunciosModule, showAdministracionModule, showProfesorMateriasModule, s
