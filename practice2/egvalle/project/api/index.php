<?php

header('Content-Type: application/json');

require_once __DIR__ . '/../controllers/PersonController.php';

$controller = new PersonController();

$method = $_SERVER['REQUEST_METHOD'];

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

$uri = trim($uri, '/');

$segments = explode('/', $uri);

if (count($segments) < 2 || $segments[0] !== 'api' || $segments[1] !== 'persons') {
    http_response_code(404);
    echo json_encode([
        'message' => 'Endpoint not found'
    ]);
    exit;
}

$id = null;

if (isset($segments[2]) && is_numeric($segments[2])) {
    $id = (int)$segments[2];
}

switch ($method) {
    case 'GET':
        if ($id === null) {
            $controller->getAll();
            break;
        }
        if (
            isset($segments[3]) &&
            $segments[3] === 'age'
        ) {
            $controller->getAge($id);
            break;
        }
        $controller->getById($id);
        break;
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $controller->create($data ?? []);
        break;
    case 'PUT':
        if ($id === null) {
            http_response_code(400);
            echo json_encode([
                'message' => 'Person ID is required'
            ]);
            break;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $controller->update($id, $data ?? []);
        break;
    case 'DELETE':
        if ($id === null) {
            http_response_code(400);
            echo json_encode([
                'message' => 'Person ID is required'
            ]);
            break;
        }
        $controller->delete($id);
        break;
    default:
        http_response_code(405);
        echo json_encode([
            'message' => 'Method not allowed'
        ]);
}