// Mostrar proyectos

function mostrar(numero){

let texto=document.getElementById("info"+numero);

if(texto.style.display=="block"){

texto.style.display="none";

}else{

texto.style.display="block";

}

}

// Tema oscuro

const boton=document.getElementById("tema");

boton.onclick=function(){

document.body.classList.toggle("dark");

}

// Validación formulario

document.getElementById("formulario").addEventListener("submit",function(e){

e.preventDefault();

let nombre=document.getElementById("nombre").value.trim();

let correo=document.getElementById("correo").value.trim();

let mensaje=document.getElementById("mensaje").value.trim();

let error=document.getElementById("error");

let expresion=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(nombre=="" || correo=="" || mensaje==""){

error.innerHTML="Todos los campos son obligatorios.";

return;

}

if(!expresion.test(correo)){

error.innerHTML="Correo electrónico inválido.";

return;

}

error.style.color="green";

error.innerHTML="Formulario validado correctamente.";

});

// Contador visitas

let visitas=localStorage.getItem("visitas");

if(visitas==null){

visitas=1;

}else{

visitas=parseInt(visitas)+1;

}

localStorage.setItem("visitas",visitas);

document.getElementById("visitas").innerHTML="Visitas: "+visitas;

// Fecha

function actualizarFecha(){

let fecha=new Date();

document.getElementById("fecha").innerHTML=fecha.toLocaleString();

}

actualizarFecha();

setInterval(actualizarFecha,1000);