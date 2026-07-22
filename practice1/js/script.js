const projectDetails = {
	agenda: {
		title: 'Agenda Clara',
		description: 'Proyecto enfocado en organizar pendientes mediante categorías, prioridades y una vista de avance. La propuesta prioriza una lectura rápida y una interacción sin distracciones.'
	},
	ruta: {
		title: 'Ruta Local',
		description: 'Concepto de explorador urbano que reúne cafeterías, parques y espacios culturales. El reto principal fue presentar mucha información sin perder la sensación de descubrimiento.'
	},
	casa: {
		title: 'Casa Nativa',
		description: 'Catálogo para un emprendimiento de productos artesanales. El diseño busca comunicar cercanía y confianza, con una navegación sencilla desde la historia de la marca hasta el contacto.'
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
