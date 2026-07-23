const projectDetails = {
	GEC: {
		title: 'Gestion electronica de la carga',
		description: 'Aplicacion aduanera para la modificacion de documentos de transporte para la importacion y la exportacion aduanera reduciendo el tiempo de procesamiento de 24 horas a 30 minutos y ayudando a reducir el consumo de papel, impulsando la transparencia gracias a la utilizacion bolsones generales.'
	},
 Isnpec: {
		title: 'Inspecciones conjuntas',
		description: 'Sistema para la coordinación de inspecciones aduaneras entre diferentes autoridades y facilitando la cooperacion entre instituciones.'
	},
	Carga: {
		title: 'Despacho aduanero',
		description: 'Simplificación del proceso de despacho aduanero para mejorar la eficiencia en el tratamiento de mercancías impusando el comercio interno y externo.'
	}
};

const detailsPanel = document.querySelector('#project-details');
const detailsTitle = document.querySelector('#details-title');
const detailsDescription = document.querySelector('#details-description');

document.querySelectorAll('[data-project]').forEach((button) => {
	button.addEventListener('click', () => {
		const project = projectDetails[button.dataset.project];
		detailsTitle.textContent = project.title;
		detailsDescription.textContent = project.description;
		detailsPanel.hidden = false;
		detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
	});
});

document.querySelector('.close-details').addEventListener('click', () => {
	detailsPanel.hidden = true;
});

document.querySelector('#contact-form').addEventListener('submit', (event) => {
	event.preventDefault();
	document.querySelector('#form-status').textContent = 'Gracias por escribir. Tu mensaje está listo para ser enviado.';
	event.currentTarget.reset();
});


/*
Contador de visitas
*/ 	
let visitas = localStorage.getItem("visitas");

if (visitas === null) {
    visitas = 1;
} else {
    visitas = parseInt(visitas) + 1;
}

localStorage.setItem("visitas", visitas);
document.getElementById("contador").textContent = visitas;


/*
hora en tiempo real
*/	
function actualizarHora() {
	const fechaActual = new Date();
	const hora = fechaActual.toLocaleTimeString();
	document.getElementById("hora").textContent = hora;
}
setInterval(actualizarHora, 1000);
actualizarHora();

/*
boton para cambio de tema (claro/oscuro)
*/

const boton = document.getElementById("theme-toggle");

// Cargar el tema guardado
if(localStorage.getItem("tema") === "oscuro"){
    document.body.classList.add("dark-mode");
    boton.textContent = "☀️";
}

// Cambiar tema
boton.addEventListener("click", ()=>{

    document.body.classList.toggle("dark-mode");

    if(document.body.classList.contains("dark-mode")){
        localStorage.setItem("tema","oscuro");
        boton.textContent = "☀️";
    }else{
        localStorage.setItem("tema","claro");
        boton.textContent = "🌙";
    }

});
