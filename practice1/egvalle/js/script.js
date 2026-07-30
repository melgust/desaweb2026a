/* CONSTANTES */
const body = document.body;

const themeButton = document.getElementById("theme-toggle");

const currentDate = document.getElementById("current-date");
const currentTime = document.getElementById("current-time");

const visitCounter = document.getElementById("visit-counter");

const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const closeModal = document.getElementById("close-modal");

const projectButtons = document.querySelectorAll(".project-button");

const contactForm = document.getElementById("contact-form");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");

/* CAMBIO DE TEMA */
function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        body.classList.add("dark-mode");
            themeButton.innerHTML = `
            <i class="fa-solid fa-sun"></i>
            <span>Modo claro</span>
        `;
    } else {
        themeButton.innerHTML = `
            <i class="fa-solid fa-moon"></i>
            <span>Modo oscuro</span>
        `;
    }
}
function toggleTheme() {
    body.classList.toggle("dark-mode");
    const darkMode = body.classList.contains("dark-mode");
    localStorage.setItem(
        "theme",
        darkMode ? "dark" : "light"
    );
    themeButton.innerHTML = darkMode ? `
        <i class="fa-solid fa-sun"></i>
        <span>Modo claro</span>
    ` : `
        <i class="fa-solid fa-moon"></i>
        <span>Modo oscuro</span>
    `;
}
themeButton.addEventListener(
    "click",
    toggleTheme
);

/* FECHA Y HORA */
function updateDateTime() {
    const now = new Date();
    currentDate.textContent =
        now.toLocaleDateString(
            "es-GT",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
    currentTime.textContent =
        now.toLocaleTimeString(
            "es-GT"
        );
}
setInterval(
    updateDateTime,
    1000
);

/* CONTADOR DE VISITAS */
function loadVisits() {
    let visits =
        Number(localStorage.getItem("visits")) || 0;
    visits++;
    localStorage.setItem("visits", visits);
    visitCounter.textContent = visits;
}

/* MODAL DE PROYECTOS */
function openModal(event) {
    const button = event.currentTarget;
    modalTitle.textContent =
        button.dataset.title;
    modalDescription.textContent =
        button.dataset.description;
    modal.classList.add("active");
}
function closeProjectModal() {
    modal.classList.remove("active");
}
projectButtons.forEach(button => {
    button.addEventListener("click", openModal);
});
closeModal.addEventListener("click", closeProjectModal);
modal.addEventListener(
    "click",
    function (event) {
        if (event.target === modal) {
            closeProjectModal();
        }
    }
);
document.addEventListener(
    "keydown",
    function (event) {
        if (
            event.key === "Escape" &&
            modal.classList.contains("active")
        ) {
            closeProjectModal();
        }
    }
);

/* VALIDACIÓN DEL FORMULARIO */
function showError(input, message) {
    const error = input.parentElement.querySelector(
        ".error-message"
    );
    error.textContent = message;
}
function clearError(input) {
    const error = input.parentElement.querySelector(
        ".error-message"
    );
    error.textContent = "";
}
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}
contactForm.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        let valid = true;
        clearError(nameInput);
        clearError(emailInput);
        clearError(messageInput);
        if (nameInput.value.trim() === "") {
            showError(
                nameInput,
                "Ingrese su nombre."
            );
            valid = false;
        }
        if (emailInput.value.trim() === "") {
            showError(
                emailInput,
                "Ingrese su correo electrónico."
            );
            valid = false;
        } else if (!validateEmail(emailInput.value.trim())) {
            showError(
                emailInput,
                "Ingrese un correo válido."
            );
            valid = false;
        }
        if (messageInput.value.trim() === "") {
            showError(
                messageInput,
                "Ingrese un mensaje."
            );
            valid = false;
        }
        if (valid) {
            alert(
                "Mensaje enviado correctamente."
            );
            contactForm.reset();
        }
    }
);

/* INICIALIZACIÓN */
loadTheme();
loadVisits();
updateDateTime();