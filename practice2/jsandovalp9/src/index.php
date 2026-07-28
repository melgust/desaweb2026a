<?php

header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = array_values(array_filter(explode('/', $uri)));

$tasks = [
    1 => ['id' => 1, 'title' => 'Tarea de ejemplo', 'completed' => false],
    2 => ['id' => 2, 'title' => 'Otra tarea', 'completed' => true],
];

function sendJson($data, $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getRequestBody()
{
    $body = file_get_contents('php://input');
    return json_decode($body, true) ?? [];
}

if ($uri === '/api' || $uri === '/api/') {
    if ($method === 'GET') {
        sendJson(['message' => 'API REST PHP contenedorizada']);
    }
    sendJson(['error' => 'Método no permitido'], 405);
}

if (count($segments) >= 2 && $segments[0] === 'api' && $segments[1] === 'tasks') {
    if (count($segments) === 2) {
        switch ($method) {
            case 'GET':
                sendJson(array_values($tasks));
                break;
            case 'POST':
                $body = getRequestBody();
                $newTask = [
                    'id' => max(array_keys($tasks)) + 1,
                    'title' => $body['title'] ?? 'Tarea sin título',
                    'completed' => $body['completed'] ?? false,
                ];
                sendJson(['message' => 'Tarea creada', 'task' => $newTask], 201);
                break;
            default:
                sendJson(['error' => 'Método no permitido'], 405);
        }
    }

    if (count($segments) === 3) {
        $id = (int) $segments[2];

        if (!isset($tasks[$id])) {
            sendJson(['error' => 'Tarea no encontrada'], 404);
        }

        switch ($method) {
            case 'GET':
                sendJson($tasks[$id]);
                break;
            case 'PUT':
                $body = getRequestBody();
                $updatedTask = array_merge($tasks[$id], [
                    'title' => $body['title'] ?? $tasks[$id]['title'],
                    'completed' => $body['completed'] ?? $tasks[$id]['completed'],
                ]);
                sendJson(['message' => 'Tarea actualizada', 'task' => $updatedTask]);
                break;
            case 'DELETE':
                sendJson(['message' => 'Tarea eliminada', 'id' => $id]);
                break;
            default:
                sendJson(['error' => 'Método no permitido'], 405);
        }
    }
}

sendJson(['error' => 'Ruta no encontrada'], 404);
