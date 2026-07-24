function actualizarFechaHora() {
    const ahora = new Date();

    const fechaHora = ahora.toLocaleString("es-GT", {
        dateStyle: "full",
        timeStyle: "medium"
    });

    document.getElementById("fecha-hora").textContent = fechaHora;
}

actualizarFechaHora();

setInterval(actualizarFechaHora, 1000);