// ---- Light/Dark mode toggle ----
const themeToggleBtn = document.getElementById('theme-toggle');
const rootEl = document.documentElement;

function applyTheme(theme) {
  rootEl.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

const savedTheme = localStorage.getItem('theme') || 'dark';
applyTheme(savedTheme);

themeToggleBtn.addEventListener('click', () => {
  const current = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(current);
});

// ---- Current date/time display ----
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  };
  document.getElementById('datetime').textContent =
    now.toLocaleDateString('es-GT', options);
}
updateDateTime();
setInterval(updateDateTime, 1000);

// ---- Visit counter using localStorage ----
const visitCounterEl = document.getElementById('visit-counter');
let visits = parseInt(localStorage.getItem('visitCount') || '0', 10);
visits += 1;
localStorage.setItem('visitCount', visits);
visitCounterEl.textContent = visits;

// ---- Project modal (shared by all project cards) ----
const projectModal = document.getElementById('project-modal');
const projectModalClose = document.getElementById('project-modal-close');
const projectModalFile = document.getElementById('project-modal-file');
const projectModalTitle = document.getElementById('project-modal-title');
const projectModalDesc = document.getElementById('project-modal-desc');
const projectModalLink = document.getElementById('project-modal-link');

let lastProjectTrigger = null;

function openProjectModal(trigger) {
  projectModalFile.textContent = trigger.dataset.file || '';
  projectModalTitle.textContent = trigger.dataset.title || '';
  projectModalDesc.textContent = trigger.dataset.desc || '';

  if (trigger.dataset.link) {
    projectModalLink.href = trigger.dataset.link;
    projectModalLink.textContent = trigger.dataset.linkText || '$ ver más';
    projectModalLink.hidden = false;
  } else {
    projectModalLink.hidden = true;
  }

  lastProjectTrigger = trigger;
  projectModal.hidden = false;
  document.body.style.overflow = 'hidden';
  projectModalClose.focus();
}

function closeProjectModal() {
  projectModal.hidden = true;
  document.body.style.overflow = '';
  if (lastProjectTrigger) lastProjectTrigger.focus();
}

document.querySelectorAll('.project-link-btn').forEach(btn => {
  btn.addEventListener('click', () => openProjectModal(btn));
});

projectModalClose.addEventListener('click', closeProjectModal);

projectModal.addEventListener('click', (event) => {
  if (event.target === projectModal) closeProjectModal();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !projectModal.hidden) closeProjectModal();
});

// ---- Contact form validation ----
const form = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');

function setError(inputId, message) {
  const input = document.getElementById(inputId);
  const errorEl = document.getElementById(`${inputId}-error`);
  input.classList.toggle('invalid', Boolean(message));
  errorEl.textContent = message;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  successMsg.textContent = '';

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  let valid = true;

  if (!name) {
    setError('name', 'El nombre es obligatorio.');
    valid = false;
  } else {
    setError('name', '');
  }

  if (!email) {
    setError('email', 'El correo es obligatorio.');
    valid = false;
  } else if (!isValidEmail(email)) {
    setError('email', 'Ingresa un correo válido.');
    valid = false;
  } else {
    setError('email', '');
  }

  if (!message) {
    setError('message', 'El mensaje es obligatorio.');
    valid = false;
  } else {
    setError('message', '');
  }

  if (valid) {
    successMsg.textContent = '¡Mensaje enviado correctamente!';
    form.reset();
  }
});
