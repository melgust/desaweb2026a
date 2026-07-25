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

// ---- Expandable project cards ----
document.querySelectorAll('.expand-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const details = btn.nextElementSibling;
    const isOpen = details.classList.toggle('open');
    btn.textContent = isOpen ? 'Ver menos' : 'Ver más';
  });
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
