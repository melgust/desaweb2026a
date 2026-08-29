<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../controllers/PersonController.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function sendResponse(array $data, int $statusCode = 200): void
{
    http_response_code($statusCode);

    echo json_encode(
        $data,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    );

    exit;
}

function readJsonBody(): array
{
    $content = file_get_contents('php://input');

    if ($content === false || trim($content) === '') {
        return [];
    }

    $data = json_decode($content, true);

    if (!is_array($data)) {
        sendResponse(['error' => 'El contenido JSON no es válido'], 400);
    }

    return $data;
}

$fileManager = new FileManager(__DIR__ . '/../data/persons.json');
$controller = new PersonController($fileManager);

$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url(
    $_SERVER['REQUEST_URI'],
    PHP_URL_PATH
);

$path = rtrim($path, '/');

if ($path === '/api/persons') {
    if ($method === 'GET') {
        $controller->index();
    }

    if ($method === 'POST') {
        $controller->store(readJsonBody());
    }

    sendResponse(['error' => 'Método no permitido'], 405);
}

if (preg_match('#^/api/persons/(\d+)/age$#', $path, $matches)) {
    if ($method === 'GET') {
        $controller->age((int) $matches[1]);
    }

    sendResponse(['error' => 'Método no permitido'], 405);
}

if (preg_match('#^/api/persons/(\d+)$#', $path, $matches)) {
    $id = (int) $matches[1];

    if ($method === 'GET') {
        $controller->show($id);
    }

    if ($method === 'PUT') {
        $controller->update($id, readJsonBody());
    }

    if ($method === 'DELETE') {
        $controller->destroy($id);
    }

    sendResponse(['error' => 'Método no permitido'], 405);
}

sendResponse(['error' => 'Ruta no encontrada'], 404);
