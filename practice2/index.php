<?php

/**
 * index.php
 *
 * Punto de entrada único de la API. Interpreta el método HTTP y la
 * ruta solicitada, y delega la solicitud al método correspondiente
 * del PersonController.
 *
 * Funciona tanto con el servidor embebido de PHP:
 *   php -S 0.0.0.0:8000 index.php
 * como sirviendo detrás de Apache/Nginx apuntando el document root
 * a esta carpeta.
 */

require_once __DIR__ . '/controllers/PersonController.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rtrim($uri, '/');

// Normaliza la ruta por si la app corre bajo una subcarpeta.
$uri = preg_replace('#^.*(/api/persons.*)$#', '$1', $uri);

$controller = new PersonController();

if ($method === 'GET' && preg_match('#^/api/persons/([^/]+)/age$#', $uri, $m)) {
    $controller->getAge($m[1]);
    exit;
}

if (preg_match('#^/api/persons/([^/]+)$#', $uri, $m)) {
    $id = $m[1];

    switch ($method) {
        case 'GET':
            $controller->getById($id);
            break;
        case 'PUT':
            $controller->update($id);
            break;
        case 'DELETE':
            $controller->delete($id);
            break;
        default:
            http_response_code(405);
            echo json_encode(['message' => 'Método no permitido']);
    }
    exit;
}

if ($uri === '/api/persons') {
    switch ($method) {
        case 'GET':
            $controller->getAll();
            break;
        case 'POST':
            $controller->create();
            break;
        default:
            http_response_code(405);
            echo json_encode(['message' => 'Método no permitido']);
    }
    exit;
}

http_response_code(404);
echo json_encode(['message' => 'Endpoint not found']);
