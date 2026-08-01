<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';
require_once __DIR__ . '/../controllers/PersonController.php';

$fileManager = new FileManager(
    __DIR__ . '/../data/persons.json'
);

$controller = new PersonController($fileManager);

$method = $_SERVER['REQUEST_METHOD'];

$path = parse_url(
    $_SERVER['REQUEST_URI'],
    PHP_URL_PATH
);

$path = rtrim($path ?? '', '/');

if ($path === '') {
    $path = '/';
}

/*
|--------------------------------------------------------------------------
| GET /api/persons
| POST /api/persons
|--------------------------------------------------------------------------
*/
if ($path === '/api/persons') {
    if ($method === 'GET') {
        $controller->getAll();
        exit;
    }

    if ($method === 'POST') {
        $controller->create();
        exit;
    }

    sendMethodNotAllowed(['GET', 'POST']);
}

/*
|--------------------------------------------------------------------------
| GET /api/persons/{id}
| PUT /api/persons/{id}
| DELETE /api/persons/{id}
|--------------------------------------------------------------------------
*/
if (
    preg_match(
        '#^/api/persons/(\d+)$#',
        $path,
        $matches
    ) === 1
) {
    $id = (int) $matches[1];

    if ($method === 'GET') {
        $controller->getById($id);
        exit;
    }

    if ($method === 'PUT') {
        $controller->update($id);
        exit;
    }

    if ($method === 'DELETE') {
        $controller->delete($id);
        exit;
    }

    sendMethodNotAllowed(['GET', 'PUT', 'DELETE']);
}

/*
|--------------------------------------------------------------------------
| GET /api/persons/{id}/age
|--------------------------------------------------------------------------
*/
if (
    preg_match(
        '#^/api/persons/(\d+)/age$#',
        $path,
        $matches
    ) === 1
) {
    $id = (int) $matches[1];

    if ($method === 'GET') {
        $controller->getAge($id);
        exit;
    }

    sendMethodNotAllowed(['GET']);
}

/*
|--------------------------------------------------------------------------
| Endpoint no encontrado
|--------------------------------------------------------------------------
*/
http_response_code(404);

echo json_encode(
    ['message' => 'Endpoint not found'],
    JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
);

function sendMethodNotAllowed(array $allowedMethods): never
{
    header(
        'Allow: ' . implode(', ', $allowedMethods)
    );

    http_response_code(405);

    echo json_encode(
        ['message' => 'Method not allowed'],
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );

    exit;
}