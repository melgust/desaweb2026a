<?php

require_once __DIR__ . '/../Controllers/PersonController.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$scriptPath = $_SERVER['SCRIPT_NAME'] ?? '';

if ($scriptPath !== '' && strpos($uri, $scriptPath) === 0) {
    $uri = substr($uri, strlen($scriptPath));
}

$uri = rtrim($uri, '/');

if ($uri === '') {
    $uri = '/';
}

if ($method === 'POST' && $uri === '/api/persons') {
    $controller = new PersonController();
    $response = $controller->grabarPersona();

    http_response_code($response['status']);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

if ($method === 'GET' && $uri === '/api/persons') {
    $controller = new PersonController();
    $response = $controller->obtenerPersonas();

    http_response_code($response['status']);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

if ($method === 'GET' && preg_match('#^/api/persons/([^/]+)$#', $uri, $matches)) {
    $controller = new PersonController();
    $response = $controller->obtenerPersonaPorId($matches[1]);

    http_response_code($response['status']);
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

http_response_code(404);
header('Content-Type: application/json');
echo json_encode([
    'success' => false,
    'message' => 'Ruta no encontrada.',
]);
