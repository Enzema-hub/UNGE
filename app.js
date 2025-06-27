// UNGE Gestión Universitaria SPA
// Todos los datos y lógica en este archivo para demo simple, modulariza en producción

// ==== IndexedDB SETUP ====
const DB_NAME = "UNGE_DB";
const DB_VERSION = 1;
let db;

const openDB = () => {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (e) {
      db = e.target.result;
      // Usuarios
      if (!db.objectStoreNames.contains("users")) {
        const userStore = db.createObjectStore("users", { keyPath: "email" });
      }
      // Facultades
      if (!db.objectStoreNames.contains("faculties")) {
        db.createObjectStore("faculties", { keyPath: "id", autoIncrement: true });
      }
      // Departamentos
      if (!db.objectStoreNames.contains("departments")) {
        db.createObjectStore("departments", { keyPath: "id", autoIncrement: true });
      }
      // Carreras
      if (!db.objectStoreNames.contains("careers")) {
        db.createObjectStore("careers", { keyPath: "id", autoIncrement: true });
      }
      // Materias
      if (!db.objectStoreNames.contains("subjects")) {
        db.createObjectStore("subjects", { keyPath: "id", autoIncrement: true });
      }
      // Estudiantes
      if (!db.objectStoreNames.contains("students")) {
        db.createObjectStore("students", { keyPath: "id", autoIncrement: true });
      }
      // Matrículas
      if (!db.objectStoreNames.contains("enrollments")) {
        db.createObjectStore("enrollments", { keyPath: "id", autoIncrement: true });
      }
      // Anuncios
      if (!db.objectStoreNames.contains("announcements")) {
        db.createObjectStore("announcements", { keyPath: "id", autoIncrement: true });
      }
      // Notas
      if (!db.objectStoreNames.contains("grades")) {
        db.createObjectStore("grades", { keyPath: "id", autoIncrement: true });
      }
      // Tareas
      if (!db.objectStoreNames.contains("tasks")) {
        db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
      }
      // Archivos
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = function (e) {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = function (e) {
      reject(e);
    };
  });
};

function transaction(store, mode = "readonly") {
  return openDB().then(db =>
    db.transaction([store], mode).objectStore(store)
  );
}

// ==== DATA MODELS ====
const campuses = [
  { id: "central", name: "Campus Central" },
  { id: "2", name: "Campus 2" },
  { id: "3", name: "Campus 3" }
];

const roles = [
  { value: "rector", label: "Rector" },
  { value: "dean", label: "Decano de la facultad de" },
  { value: "professor", label: "Profesor" },
  { value: "student", label: "Estudiante" },
  { value: "secretary", label: "Secretario/a" },
  { value: "department_head", label: "Jefe de departamento" },
  { value: "department_adjunct", label: "Jefe adjunto de departamento" }
];

const genderOptions = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" }
];

// ==== STATE ====
let currentUser = null;

// ==== HELPERS ====
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return document.querySelectorAll(sel); }
function clearApp() { $("#app-root").innerHTML = ""; }
function showAlert(msg, type = "danger") {
  return `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

// ==== VALIDACIONES ====
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim());
}
function isValidPassword(password, rol, facultad) {
  let regex, prefix;
  switch (rol) {
    case "rector":
      regex = /^Rector[0-9]{4}[@#&]{2}$/;
      break;
    case "dean":
      regex = /^Decano[0-9]{4}[@#&]{2}$/;
      break;
    case "secretary":
      regex = /^Secret[0-9]{4}[@#&]{2}$/;
      break;
    case "professor":
      regex = /^Profes[0-9]{4}[@#&]{2}$/;
      break;
    case "student":
      regex = /^Estudi[0-9]{4}[@#&]{2}$/;
      break;
    case "department_head":
      regex = /^Jefdep[0-9]{4}[@#&]{2}$/;
      break;
    case "department_adjunct":
      regex = /^Jefadj[0-9]{4}[@#&]{2}$/;
      break;
    default:
      return false;
  }
  return regex.test(password);
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}
function getRoleLabel(role) {
  let
