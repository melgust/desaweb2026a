// ===== FUNCIONALIDADES BASE =====

// 1. Fecha y hora actual
function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    document.getElementById('fechaHora').textContent = ahora.toLocaleDateString('es-ES', opciones);
}

// Actualizar cada segundo
actualizarFechaHora();
setInterval(actualizarFechaHora, 1000);

// 2. Contador de visitas (localStorage)
function contadorVisitas() {
    let visitas = localStorage.getItem('visitas');
    if (visitas === null) {
        visitas = 1;
    } else {
        visitas = parseInt(visitas) + 1;
    }
    localStorage.setItem('visitas', visitas);
    
    // Crear elemento para mostrar visitas si no existe
    let contadorElement = document.getElementById('contadorVisitas');
    if (!contadorElement) {
        contadorElement = document.createElement('div');
        contadorElement.id = 'contadorVisitas';
        contadorElement.style.marginTop = '10px';
        contadorElement.style.fontSize = '0.9rem';
        contadorElement.style.color = '#666';
        document.querySelector('.header-info').appendChild(contadorElement);
    }
    contadorElement.textContent = `Visitas: ${visitas}`;
}

contadorVisitas();

// 3. Cambio de tema
document.getElementById('temaBtn').addEventListener('click', function() {
    document.body.classList.toggle('dark-mode');
    this.textContent = document.body.classList.contains('dark-mode') ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
});

// 4. Validación de formulario
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();
    
    let errores = [];
    
    // Validar nombre
    if (nombre === '') {
        errores.push('El nombre es obligatorio');
    }
    
    // Validar email
    if (email === '') {
        errores.push('El correo electrónico es obligatorio');
    } else if (!validarEmail(email)) {
        errores.push('El correo electrónico no es válido');
    }
    
    // Validar mensaje
    if (mensaje === '') {
        errores.push('El mensaje es obligatorio');
    }
    
    if (errores.length > 0) {
        alert('❌ Errores:\n' + errores.join('\n'));
    } else {
        alert('✅ Mensaje enviado exitosamente (simulación)');
        this.reset();
    }
});

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}