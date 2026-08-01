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