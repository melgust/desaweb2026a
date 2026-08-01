const themeToggle = document.getElementById('themeToggle');
const body = document.body;
const visitCounter = document.getElementById('visitCounter');
const dateTime = document.getElementById('dateTime');
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const messageError = document.getElementById('messageError');


const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
    body.classList.add('dark')
    themeToggle.textContent = '☀️ Modo claro';
}

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark');
    const darkMode = body.classList.contains('dark')
    themeToggle.textContent = darkMode ? '☀️ Modo claro' : '🌙 Modo oscuro';
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
});

const visitsKey = 'cvVisit';
let visits = Number(localStorage.getItem(visitsKey) || 0) + 1;
localStorage.setItem(visitsKey, visits);
visitCounter.textContent = `Visitas: ${visits}`;

function updateDateTime() {
    const now = new Date();
    dateTime.textContent = `${now.toLocaleDateString('es-GT')} · ${now.toLocaleTimeString('es-GT')}`;
}

updateDateTime();
setInterval(updateDateTime, 1000);

function showError(element, message) {
    element.textContent = message;
}

function clearErrors() {
    showError(nameError, '');
    showError(emailError, '');
    showError(messageError, '');
    formMessage.textContent = '';
    formMessage.className = 'form-message';
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  let isValid = true;

  if (!name) {
    showError(nameError, 'Por favor ingresa tu nombre.');
    isValid = false;
  }

  if (!email) {
    showError(emailError, 'Por favor ingresa tu correo electrónico.');
    isValid = false;
  } else if (!validateEmail(email)) {
    showError(emailError, 'Ingresa un correo electrónico válido.');
    isValid = false;
  }

  if (!message) {
    showError(messageError, 'Por favor escribe un mensaje.');
    isValid = false;
  }

  if (!isValid) {
    formMessage.textContent = 'Corrige los campos marcados para continuar.';
    formMessage.className = 'form-message error';
    return;
  }

  formMessage.textContent = '¡Gracias por contactarme! Tu mensaje fue enviado correctamente.';
  formMessage.className = 'form-message success';
  contactForm.reset();
});

const projectDetails = [
    {
        title: 'Portafolio web',
        text: 'Este proyecto combina diseño limpio, jerarquía visual y una estructura sencilla para presentar información personal de forma atractiva.'
    },
    {
        title: 'Aplicaciónes móvil',
        text: 'Creación y despliegue de una aplicaciones para el monitoreo de camiones y registro de quejas por condominos'
    },
    {
        title: 'Modulos de integración',
        text: 'Desarrollo de modulos en CRM'
    }
]; 
