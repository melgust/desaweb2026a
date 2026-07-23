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

// 5. Información adicional de proyectos
const infoProyectos = {
    1: {
        titulo: "Banco CCI - Automatización Cypress",
        descripcion: "Proyecto de automatización para el cotizador de productos financieros del Banco CCI (Honduras)",
        detalles: [
            "Automatización end-to-end con Cypress",
            "Validación de cotizaciones de préstamos",
            "Pruebas de tasas de interés y plazos",
            "Reportes automatizados de ejecución",
            "Integración continua con GitHub Actions"
        ],
        tecnologias: ["Cypress", "JavaScript", "Node.js", "GitHub Actions"]
    },
    2: {
        titulo: "JTeller by Byte - Pruebas Integrales",
        descripcion: "Sistema de gestión bancaria JTeller con enfoque en calidad de software",
        detalles: [
            "Pruebas de APIs con Postman y automatización",
            "Pruebas manuales funcionales y de regresión",
            "Automatización con Selenium WebDriver + Mocha",
            "Validación de historias de usuario por cliente bancario",
            "Pruebas de base de datos (SQL queries)"
        ],
        tecnologias: ["Selenium", "Mocha", "Postman", "JavaScript", "SQL"]
    },
    3: {
        titulo: "Banco Agrícola - Pruebas de Sistema",
        descripcion: "Pruebas integrales para el sistema bancario del Banco Agrícola",
        detalles: [
            "Pruebas funcionales de módulos bancarios",
            "Validación de APIs de servicios financieros",
            "Pruebas de base de datos y consultas SQL",
            "Pruebas de regresión post-implementación",
            "Documentación de casos de prueba y reportes"
        ],
        tecnologias: ["Postman", "SQL", "Manual Testing", "API Testing", "Base de Datos"]
    }
};

// Crear modales para cada proyecto
document.querySelectorAll('.btn-ver-mas').forEach(btn => {
    btn.addEventListener('click', function() {
        const projectId = this.getAttribute('data-project');
        const proyecto = infoProyectos[projectId];
        
        if (proyecto) {
            mostrarModal(proyecto);
        }
    });
});

function mostrarModal(proyecto) {
    // Eliminar modal existente si hay
    const modalExistente = document.querySelector('.modal');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    // Crear contenido del modal
    let detallesHTML = proyecto.detalles.map(detalle => `<li>${detalle}</li>`).join('');
    let tecnologiasHTML = proyecto.tecnologias.map(tech => `<span class="tag">${tech}</span>`).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2>${proyecto.titulo}</h2>
            <p>${proyecto.descripcion}</p>
            <h3>Detalles del proyecto:</h3>
            <ul>${detallesHTML}</ul>
            <div class="tecnologias">
                <strong>Tecnologías utilizadas:</strong> ${tecnologiasHTML}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar modal
    modal.querySelector('.close-modal').addEventListener('click', function() {
        modal.remove();
    });
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Agregar estilos CSS para el modal
const modalStyles = document.createElement('style');
modalStyles.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        animation: fadeIn 0.3s;
    }
    
    .modal-content {
        background-color: white;
        padding: 30px;
        border-radius: 15px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        animation: slideDown 0.3s;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    }
    
    .modal-content h2 {
        color: #007bff;
        margin-bottom: 15px;
    }
    
    .modal-content h3 {
        color: #333;
        margin: 15px 0 10px 0;
        font-size: 1.1rem;
    }
    
    .modal-content ul {
        margin: 10px 0;
        padding-left: 20px;
    }
    
    .modal-content ul li {
        margin: 8px 0;
        color: #555;
        line-height: 1.5;
    }
    
    .close-modal {
        position: absolute;
        top: 10px;
        right: 20px;
        font-size: 2rem;
        cursor: pointer;
        color: #999;
        transition: color 0.3s;
    }
    
    .close-modal:hover {
        color: #333;
    }
    
    .tag {
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 5px 12px;
        border-radius: 20px;
        margin: 5px 5px 0 0;
        font-size: 0.9rem;
    }
    
    .tecnologias {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }
    
    body.dark-mode .modal-content {
        background-color: #1a1a2e;
        color: #eee;
    }
    
    body.dark-mode .modal-content ul li {
        color: #ccc;
    }
    
    body.dark-mode .modal-content h3 {
        color: #eee;
    }
    
    body.dark-mode .close-modal {
        color: #ccc;
    }
    
    body.dark-mode .close-modal:hover {
        color: #fff;
    }
    
    body.dark-mode .tecnologias {
        border-top-color: #333;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideDown {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
document.head.appendChild(modalStyles);