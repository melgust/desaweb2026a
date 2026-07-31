<?php

require_once __DIR__ . '/../controllers/PersonController.php';

// Configurar CORS para desarrollo
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener el método y la URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];

// Extraer la parte de la API de la URI
$scriptName = $_SERVER['SCRIPT_NAME'];
$uri = str_replace($scriptName, '', $uri);
$uri = strtok($uri, '?');

// Obtener el body para métodos que lo requieren
$body = null;
if ($method === 'POST' || $method === 'PUT') {
    $input = file_get_contents('php://input');
    $body = json_decode($input, true);
}

// Crear el controller y manejar la solicitud
$controller = new PersonController();
$response = $controller->handleRequest($method, $uri, $body);

echo $response;