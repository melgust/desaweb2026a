// =============================
// FECHA Y HORA
// =============================

function actualizarFechaHora() {

    const ahora = new Date();

    document.getElementById("fechaHora").innerHTML =
        ahora.toLocaleString();

}

setInterval(actualizarFechaHora, 1000);

actualizarFechaHora();


// =============================
// CONTADOR DE VISITAS
// =============================

let visitas = localStorage.getItem("visitas");

if (visitas == null) {

    visitas = 1;

} else {

    visitas = parseInt(visitas) + 1;

}

localStorage.setItem("visitas", visitas);

document.getElementById("contadorVisitas").innerHTML =
    "Visitas en este navegador: " + visitas;


// =============================
// CAMBIO DE TEMA
// =============================

const botonTema = document.getElementById("btnTema");

if (localStorage.getItem("tema") === "oscuro") {

    document.body.classList.add("dark");

}

botonTema.addEventListener("click", function () {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {

        localStorage.setItem("tema", "oscuro");

    } else {

        localStorage.setItem("tema", "claro");

    }

});


// =============================
// VER MAS
// =============================

function mostrarProyecto(opcion) {

    if (opcion == 1) {

        alert("Sistema desarrollado en Java para administrar parqueos privados utilizando archivos y estructuras de datos.");

    }

    if (opcion == 2) {

        alert("Aplicación desarrollada en Python para representar municipios de Guatemala mediante grafos.");

    }

    if (opcion == 3) {

        alert("Sistema para gestionar marcajes biométricos y asistencia del personal.");

    }

}


// =============================
// VALIDACION DEL FORMULARIO
// =============================

const formulario = document.getElementById("formulario");

formulario.addEventListener("submit", function (e) {

    e.preventDefault();

    let nombre = document.getElementById("nombre").value.trim();

    let correo = document.getElementById("correo").value.trim();

    let mensaje = document.getElementById("mensaje").value.trim();

    if (nombre === "") {

        alert("Debe ingresar su nombre.");

        return;

    }

    if (correo === "") {

        alert("Debe ingresar un correo.");

        return;

    }

    const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!expresion.test(correo)) {

        alert("Ingrese un correo válido.");

        return;

    }

    if (mensaje === "") {

        alert("Debe escribir un mensaje.");

        return;

    }

    alert("Formulario enviado correctamente.");

    formulario.reset();

});