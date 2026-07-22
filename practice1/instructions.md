# Práctica 1 — Perfil Profesional Interactivo

**Curso:** Desarrollo Web  
**Duración estimada:** 2 horas  
**Modalidad:** Individual

---

# Objetivo

Desarrollar una página web utilizando **HTML5**, **CSS3**, **JavaScript** y **Git**, aplicando buenas prácticas de organización del proyecto y control de versiones.

---

# Repositorio

Todo el grupo trabajará sobre un único repositorio remoto.

Cada integrante utilizará su propia rama con el siguiente formato:

```text
usuario-umg
```

Ejemplo:

```text
mcalic1
```

No realice cambios directamente sobre la rama `main`.

Al finalizar la práctica, publique su rama en el repositorio remoto.

---

# Descripción

Construya un sitio web de una sola página denominado `index.html` que represente un **Perfil Profesional Interactivo**.

El diseño es libre, siempre que cumpla con los requisitos descritos a continuación.

---

# Requisitos

## 1. Encabezado

Incluya:

- Fotografía.
- Nombre completo.
- Carrera.
- Universidad.
- Una frase personal.

---

## 2. Sobre mí

Redacte un breve texto donde describa:

- intereses;
- habilidades;
- objetivos profesionales.

---

## 3. Habilidades

Muestre al menos **cinco habilidades** utilizando alguno de los siguientes elementos:

- tarjetas;
- etiquetas;
- barras de progreso;
- lista personalizada.

---

## 4. Proyectos

Agregue tres tarjetas que contengan:

- nombre del proyecto;
- descripción breve;
- botón **Ver más**.

Al hacer clic en el botón deberá mostrarse información adicional mediante JavaScript.

Puede utilizar un cuadro modal, un panel desplegable o cualquier otra solución similar.

---

## 5. Contacto

Incluya un formulario con los siguientes campos:

- Nombre
- Correo electrónico
- Mensaje

El formulario no necesita enviar información a un servidor.

---

# Funcionalidades con JavaScript

Implemente las siguientes funcionalidades utilizando únicamente JavaScript nativo.

## Cambio de tema

Incorpore un botón para alternar entre modo claro y modo oscuro.

---

## Validación del formulario

Antes de permitir el envío:

- ningún campo puede estar vacío;
- el correo electrónico debe tener un formato válido.

Los mensajes de error deben ser claros para el usuario.

---

## Contador de visitas

Muestre un contador indicando cuántas veces se ha abierto la página en ese navegador.

La información debe mantenerse entre recargas.

---

## Fecha y hora

Muestre la fecha y hora actuales en el encabezado de la página.

---

# Estilos

Utilice una hoja de estilos externa.

El diseño deberá incluir como mínimo:

- Flexbox o CSS Grid.
- Diseño adaptable a dispositivos móviles.
- Tarjetas con bordes redondeados.
- Sombras.
- Botones personalizados.
- Efectos `hover`.
- Transiciones.

---

# Organización del proyecto

La estructura mínima esperada es:

```text
/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── img/
```

Puede agregar directorios adicionales si los considera necesarios.

---

# Control de versiones

Durante el desarrollo:

- cree una rama con el formato indicado;
- realice al menos **dos commits** con mensajes descriptivos;
- publique la rama en el repositorio remoto.

Ejemplos de mensajes de commit:

```text
Creación de la estructura HTML

Implementación del formulario

Agregar cambio de tema

Diseño responsive
```

---

# Restricciones

No está permitido utilizar:

- React;
- Vue;
- Angular;
- plantillas completas descargadas de Internet;
- Copia

Sí puede consultar la documentación oficial de HTML, CSS, JavaScript y Git.

---

# Criterios de evaluación

| Criterio | Puntos |
|----------|-------:|
| HTML semántico | 20 |
| Organización y estilos CSS | 20 |
| Funcionalidad JavaScript | 25 |
| Diseño responsive | 10 |
| Organización del proyecto | 10 |
| Uso de Git (rama y commits) | 15 |
| **Total** | **100** |

---

# Entrega

Se evaluará únicamente la rama correspondiente

El proyecto debe encontrarse completo, organizado y funcional.

No se revisarán cambios realizados directamente sobre la rama `main`. El hacerlo anula su entrega