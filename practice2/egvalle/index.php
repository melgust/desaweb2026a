<?php

header("Content-Type: application/json; charset=UTF-8");

/* Datos simulados */
$usuarios = [
    [
        "id" => 1,
        "nombre" => "Alice",
        "correo" => "alice@example.com"
    ],
    [
        "id" => 2,
        "nombre" => "Bob",
        "correo" => "bob@example.com"
    ]
];

$metodo = $_SERVER["REQUEST_METHOD"];

/* Endpoints */
switch ($metodo) {
    /* Obtener todos los usuarios
        GET /index.php
        Obtener un usuario
        GET /index.php?id=1
    */

    case "GET":

        if (isset($_GET["id"])) {
            $id = (int) $_GET["id"];
            foreach ($usuarios as $usuario) {
                if ($usuario["id"] === $id) {
                    http_response_code(200);
                    echo json_encode($usuario);
                    exit;
                }
            }
            http_response_code(404);
            echo json_encode([
                "mensaje" => "Usuario no encontrado."
            ]);
        } else {
            http_response_code(200);
            echo json_encode($usuarios);
        }

        break;

    /* Crear usuario
        POST /index.php
    */

    case "POST":

        $datos = json_decode(file_get_contents("php://input"), true);

        $nuevoUsuario = [
            "id"      => count($usuarios) + 1,
            "nombre"  => $datos["nombre"] ?? "",
            "correo"  => $datos["correo"] ?? ""
        ];

        http_response_code(201);

        echo json_encode([
            "mensaje" => "Usuario creado correctamente.",
            "usuario" => $nuevoUsuario
        ]);

        break;

    /* Actualizar usuario
        PUT /index.php
    */

    case "PUT":

        $datos = json_decode(file_get_contents("php://input"), true);

        http_response_code(200);

        echo json_encode([
            "mensaje" => "Usuario actualizado correctamente.",
            "usuario" => $datos
        ]);

        break;

    /* Eliminar usuario
        DELETE /index.php
    */

    case "DELETE":

        $datos = json_decode(file_get_contents("php://input"), true);

        http_response_code(200);

        echo json_encode([
            "mensaje" => "Usuario eliminado correctamente.",
            "id" => $datos["id"] ?? null
        ]);

        break;

    /* Método no permitido */
    default:

        http_response_code(405);

        echo json_encode([
            "mensaje" => "Método HTTP no permitido."
        ]);

        break;

}