/* ============================================
   1. FECHA Y HORA ACTUAL
============================================ */
function actualizarFechaHora() {
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const ahora = new Date();
    const texto = ahora.toLocaleDateString('es-ES', opciones);
    document.getElementById('fecha-hora').textContent =
        texto.charAt(0).toUpperCase() + texto.slice(1);
}
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);

/* ============================================
   2. CONTADOR DE VISITAS (localStorage)
============================================ */
let visitas = parseInt(localStorage.getItem('visitas')) || 0;
visitas++;
localStorage.setItem('visitas', visitas);
document.getElementById('contador').textContent = visitas;

/* ============================================
   3. CAMBIO DE TEMA (claro / oscuro)
============================================ */
const btnTema = document.getElementById('btn-tema');
const body = document.body;

// Recuperar preferencia guardada
if (localStorage.getItem('tema') === 'oscuro') {
    body.classList.add('tema-oscuro');
    btnTema.textContent = '☀️';
}

btnTema.addEventListener('click', () => {
    body.classList.toggle('tema-oscuro');
    if (body.classList.contains('tema-oscuro')) {
        localStorage.setItem('tema', 'oscuro');
        btnTema.textContent = '☀️';
    } else {
        localStorage.setItem('tema', 'claro');
        btnTema.textContent = '🌙';
    }
});

/* ============================================
   4. MODAL DE PROYECTOS
============================================ */
const proyectosData = {
    1: {
        titulo: 'App de Tareas',
        descripcion: 'Aplicación desarrollada con HTML, CSS y JavaScript que permite crear, editar y eliminar tareas. Utiliza localStorage para guardar la información entre sesiones. Incluye filtros por estado y prioridades.'
    },
    2: {
        titulo: 'Calculadora Científica',
        descripcion: 'Calculadora con interfaz moderna que soporta operaciones básicas y funciones científicas como seno, coseno, logaritmos y potencias. Desarrollada con JavaScript puro y CSS Grid.'
    },
    3: {
        titulo: 'Portafolio Web',
        descripcion: 'Sitio personal responsive con modo oscuro, animaciones suaves y diseño basado en Flexbox y CSS Grid. Incluye secciones de proyectos, habilidades y formulario de contacto validado.'
    }
};

const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modal-titulo');
const modalDescripcion = document.getElementById('modal-descripcion');
const cerrarModal = document.getElementById('cerrar-modal');

document.querySelectorAll('.btn-ver-mas').forEach(boton => {
    boton.addEventListener('click', () => {
        const id = boton.getAttribute('data-proyecto');
        const data = proyectosData[id];
        modalTitulo.textContent = data.titulo;
        modalDescripcion.textContent = data.descripcion;
        modal.classList.remove('oculto');
    });
});

cerrarModal.addEventListener('click', () => modal.classList.add('oculto'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('oculto');
});

/* ============================================
   5. VALIDACIÓN DEL FORMULARIO
============================================ */
const formulario = document.getElementById('form-contacto');
const mensajeExito = document.getElementById('mensaje-exito');

formulario.addEventListener('submit', (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();

    const errorNombre = document.getElementById('error-nombre');
    const errorCorreo = document.getElementById('error-correo');
    const errorMensaje = document.getElementById('error-mensaje');

    // Limpiar errores previos
    errorNombre.textContent = '';
    errorCorreo.textContent = '';
    errorMensaje.textContent = '';
    mensajeExito.classList.add('oculto');

    let valido = true;

    if (nombre === '') {
        errorNombre.textContent = '⚠️ El nombre no puede estar vacío.';
        valido = false;
    }

    const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo === '') {
        errorCorreo.textContent = '⚠️ El correo no puede estar vacío.';
        valido = false;
    } else if (!regexCorreo.test(correo)) {
        errorCorreo.textContent = '⚠️ El formato del correo no es válido.';
        valido = false;
    }

    if (mensaje === '') {
        errorMensaje.textContent = '⚠️ El mensaje no puede estar vacío.';
        valido = false;
    }

    if (valido) {
        mensajeExito.classList.remove('oculto');
        formulario.reset();
        setTimeout(() => mensajeExito.classList.add('oculto'), 4000);
    }
});