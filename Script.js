import { renderLogin, renderRegister, renderMainUI, renderInformate } from './ui.js';
import { dbInit, getUserSession, logoutUser, setFooterYear } from './util.js';

// --- NAVIGATION & SESSION ---
const mainContent = document.getElementById('mainContent');
const navItems = document.getElementById('mainNavItems');
const loader = document.getElementById('loader');

// Render appropriate UI based on session
async function renderApp() {
    setFooterYear();
    loader.classList.add('d-none');
    const user = await getUserSession();
    navItems.innerHTML = '';
    if (!user) {
        navItems.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" id="navLogin">Iniciar sesión</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="navRegister">Registro</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="navInformate">Infórmate</a></li>
        `;
        renderLogin(mainContent, onLogin, onToRegister, onToInformate);
    } else {
        navItems.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="#" id="navMain">Inicio</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="navInformate">Infórmate</a></li>
            <li class="nav-item"><a class="nav-link" href="#" id="navLogout">Cerrar sesión</a></li>
        `;
        renderMainUI(mainContent, user, onLogout);
    }
    // Nav events
    navItems.querySelectorAll('a').forEach(link => {
        link.onclick = async (e) => {
            e.preventDefault();
            switch (link.id) {
                case 'navLogin': renderLogin(mainContent, onLogin, onToRegister, onToInformate); break;
                case 'navRegister': renderRegister(mainContent, onRegister, onToLogin, onToInformate); break;
                case 'navMain': { const user = await getUserSession(); renderMainUI(mainContent, user, onLogout); } break;
                case 'navInformate': renderInformate(mainContent); break;
                case 'navLogout': onLogout(); break;
            }
        };
    });
}

// --- EVENT HANDLERS FOR UI ---
async function onLogin(email, password) {
    loader.classList.remove('d-none');
    mainContent.innerHTML = '';
    try {
        // Use util.js for user validation
        const { success, user, msg } = await window.ungeLogin(email, password);
        if (success) {
            window.ungeSetSession(user);
            setTimeout(() => {
                renderApp();
            }, 800);
        } else {
            loader.classList.add('d-none');
            renderLogin(mainContent, onLogin, onToRegister, onToInformate, msg);
        }
    } catch (e) {
        loader.classList.add('d-none');
        renderLogin(mainContent, onLogin, onToRegister, onToInformate, "Error inesperado al iniciar sesión.");
    }
}

function onToRegister() {
    renderRegister(mainContent, onRegister, onToLogin, onToInformate);
}
function onToLogin() {
    renderLogin(mainContent, onLogin, onToRegister, onToInformate);
}
function onToInformate() {
    renderInformate(mainContent);
}

async function onRegister(data) {
    loader.classList.remove('d-none');
    mainContent.innerHTML = '';
    try {
        const { success, msg } = await window.ungeRegister(data);
        if (success) {
            // Go to login automatically
            setTimeout(() => {
                renderLogin(mainContent, onLogin, onToRegister, onToInformate, "Registro exitoso. Inicie sesión.");
                loader.classList.add('d-none');
            }, 900);
        } else {
            loader.classList.add('d-none');
            renderRegister(mainContent, onRegister, onToLogin, onToInformate, msg);
        }
    } catch (e) {
        loader.classList.add('d-none');
        renderRegister(mainContent, onRegister, onToLogin, onToInformate, "Error inesperado al registrar.");
    }
}

async function onLogout() {
    await logoutUser();
    renderApp();
}

// --- INIT APP ---
window.addEventListener('DOMContentLoaded', async () => {
    await dbInit();
    await renderApp();
});
