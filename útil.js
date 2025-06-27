// --- IndexedDB Wrapper ---
const DB_NAME = "unge_db";
const DB_VERSION = 1;

export async function dbInit() {
    return new Promise((resolve, reject) => {
        const open = indexedDB.open(DB_NAME, DB_VERSION);
        open.onupgradeneeded = (ev) => {
            const db = ev.target.result;
            // Users
            if (!db.objectStoreNames.contains("users")) {
                const store = db.createObjectStore("users", { keyPath: "email" });
                store.createIndex("role", "role", { unique: false });
            }
            // Faculties
            if (!db.objectStoreNames.contains("faculties")) {
                db.createObjectStore("faculties", { keyPath: "id", autoIncrement: true });
            }
            // Departments
            if (!db.objectStoreNames.contains("departments")) {
                db.createObjectStore("departments", { keyPath: "id", autoIncrement: true });
            }
            // Careers
            if (!db.objectStoreNames.contains("careers")) {
                db.createObjectStore("careers", { keyPath: "id", autoIncrement: true });
            }
            // Courses
            if (!db.objectStoreNames.contains("courses")) {
                db.createObjectStore("courses", { keyPath: "id", autoIncrement: true });
            }
            // Subjects
            if (!db.objectStoreNames.contains("subjects")) {
                db.createObjectStore("subjects", { keyPath: "id", autoIncrement: true });
            }
            // Students
            if (!db.objectStoreNames.contains("students")) {
                db.createObjectStore("students", { keyPath: "email" });
            }
            // Matriculas
            if (!db.objectStoreNames.contains("matriculas")) {
                db.createObjectStore("matriculas", { keyPath: "id", autoIncrement: true });
            }
            // Announcements
            if (!db.objectStoreNames.contains("announcements")) {
                db.createObjectStore("announcements", { keyPath: "id", autoIncrement: true });
            }
            // Notes
            if (!db.objectStoreNames.contains("notes")) {
                db.createObjectStore("notes", { keyPath: "id", autoIncrement: true });
            }
            // Tasks
            if (!db.objectStoreNames.contains("tasks")) {
                db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
            }
            // Files
            if (!db.objectStoreNames.contains("files")) {
                db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
            }
        };
        open.onsuccess = () => resolve(open.result);
        open.onerror = (e) => reject(e.target.error);
    });
}

export function openDB() {
    return new Promise((resolve, reject) => {
        const open = indexedDB.open(DB_NAME, DB_VERSION);
        open.onsuccess = () => resolve(open.result);
        open.onerror = (e) => reject(e.target.error);
    });
}

// --- SESSION MANAGEMENT ---
export async function getUserSession() {
    const userStr = localStorage.getItem("unge_session");
    if (!userStr) return null;
    try {
        return JSON.parse(userStr);
    } catch { return null; }
}
export async function logoutUser() {
    localStorage.removeItem("unge_session");
}
export function setFooterYear() {
    document.getElementById("footerYear").innerText = new Date().getFullYear();
}

// --- VALIDATION HELPERS ---
export function validateEmailGmail(email) {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
}
export function validatePasswordRole(password, role, extra = {}) {
    // Password must be 12 chars, 6 letters (first uppercase), then 4 digits, then 2 symbols (@#&)
    if (!/^[A-Z][a-zA-Z]{5}\d{4}[@#&]{2}$/.test(password)) return false;
    // Specific initial 6 letters per role
    const six = password.substring(0, 6);
    switch (role) {
        case "rector": return six === "Rector";
        case "decano": return six === "Decano" && extra.facultad && extra.campus;
        case "secretario": return six === "Secret" && extra.facultad && extra.campus;
        case "profesor": return six === "Profes" && extra.facultad && extra.departamento && extra.carrera && extra.curso && extra.semestre && extra.turno;
        case "estudiante": return six === "Estudi" && extra.facultad && extra.departamento && extra.carrera && extra.curso && extra.semestre && extra.turno;
        case "jefedep": return six === "Jefdep" && extra.facultad && extra.departamento;
        case "jefadj": return six === "Jefadj" && extra.facultad && extra.departamento;
        default: return false;
    }
}

// --- USER REGISTER/LOGIN FUNCTIONS (attached to window for script.js) ---
window.ungeRegister = async (formData) => {
    // Destructure fields
    let {
        nombre, email, password, sexo, role, campus, facultad, departamento, carrera, curso, semestre, turno
    } = formData;
    // Validations
    if (!nombre || !email || !password || !role || !sexo) return { success: false, msg: "Todos los campos obligatorios." };
    if (!validateEmailGmail(email)) return { success: false, msg: "El email debe ser de Gmail (@gmail.com)." };
    // Validate password role
    let valid = validatePasswordRole(password, role, { campus, facultad, departamento, carrera, curso, semestre, turno });
    if (!valid) return { success: false, msg: "La contraseña no cumple los requisitos del rol." };
    // Check if email exists
    const db = await openDB();
    const tx = db.transaction("users", "readonly");
    const req = tx.objectStore("users").get(email);
    return new Promise((resolve) => {
        req.onsuccess = async () => {
            if (req.result) return resolve({ success: false, msg: "El usuario ya existe." });
            // Store user (never store password in prod!)
            const tx2 = db.transaction("users", "readwrite");
            tx2.objectStore("users").add({
                nombre, email, password, sexo, role, campus, facultad, departamento, carrera, curso, semestre, turno,
                created: new Date().toISOString()
            });
            tx2.oncomplete = () => resolve({ success: true });
            tx2.onerror = () => resolve({ success: false, msg: "Error al registrar usuario." });
        };
        req.onerror = () => resolve({ success: false, msg: "Error al validar email." });
    });
};

window.ungeLogin = async (email, password) => {
    if (!email || !password) return { success: false, msg: "Faltan email o contraseña." };
    const db = await openDB();
    const tx = db.transaction("users", "readonly");
    const req = tx.objectStore("users").get(email);
    return new Promise((resolve) => {
        req.onsuccess = () => {
            const user = req.result;
            if (!user || user.password !== password) return resolve({ success: false, msg: "Email o contraseña incorrectos." });
            resolve({ success: true, user });
        };
        req.onerror = () => resolve({ success: false, msg: "Error al buscar usuario." });
    });
};
window.ungeSetSession = (user) => {
    localStorage.setItem("unge_session", JSON.stringify(user));
};
