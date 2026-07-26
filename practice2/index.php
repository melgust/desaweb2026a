<?php

// Indica que la respuesta será en formato JSON
header("Content-Type: application/json");

// Simulación de una base de datos con un arreglo
$productos = [
    [
        "id" => 1,
        "nombre" => "Laptop",
        "precio" => 6500
    ],
    [
        "id" => 2,
        "nombre" => "Mouse",
        "precio" => 150
    ],
    [
        "id" => 3,
        "nombre" => "Teclado",
        "precio" => 300
    ]
];

// Obtiene la ruta solicitada
$ruta = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);

// Obtiene el método HTTP (GET, POST, PUT, DELETE)
$metodo = $_SERVER["REQUEST_METHOD"];

// ===============================
// GET /productos
// ===============================
if ($ruta == "/productos" && $metodo == "GET") {

    http_response_code(200);

    echo json_encode($productos, JSON_PRETTY_PRINT);

// ===============================
// GET /productos/{id}
// ===============================
} elseif (preg_match("#^/productos/(\d+)$#", $ruta, $coincidencias) && $metodo == "GET") {

    $id = (int)$coincidencias[1];

    $productoEncontrado = null;

    foreach ($productos as $producto) {

        if ($producto["id"] == $id) {
            $productoEncontrado = $producto;
            break;
        }

    }

    if ($productoEncontrado) {

        http_response_code(200);

        echo json_encode($productoEncontrado, JSON_PRETTY_PRINT);

    } else {

        http_response_code(404);

        echo json_encode([
            "mensaje" => "Producto no encontrado"
        ], JSON_PRETTY_PRINT);

    }

// ===============================
// Endpoint no encontrado
// ===============================
} else {

    http_response_code(404);

    echo json_encode([
        "mensaje" => "Endpoint no encontrado"
    ], JSON_PRETTY_PRINT);

}