<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../helpers/FileManager.php';

$db = new FileManager(__DIR__ . '/../data/persons.json');
$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = substr($uri, strpos($uri, '/api/persons') + 12);
$uri = explode('/', trim($uri, '/'));

$response = null;
$code = 200;

try {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    if ($method === 'GET') {
        if (empty($uri[0])) {
            $response = $db->read();
        } else {
            $id = (int)$uri[0];
            if (isset($uri[1]) && $uri[1] === 'age') {
                $person = $db->findById($id);
                if (!$person) {
                    $code = 404;
                    $response = ['message' => 'Person not found'];
                } else {
                    $birth = new DateTime($person['birthday']);
                    $age = (new DateTime())->diff($birth)->y;
                    $response = ['id' => $id, 'name' => $person['name'], 'age' => $age];
                }
            } else {
                $person = $db->findById($id);
                if (!$person) {
                    $code = 404;
                    $response = ['message' => 'Person not found'];
                } else {
                    $response = $person;
                }
            }
        }
    } elseif ($method === 'POST') {
        $errors = validate($input);
        if ($errors) {
            $code = 400;
            $response = ['errors' => $errors];
        } elseif ($db->findByEmail($input['email'])) {
            $code = 400;
            $response = ['error' => 'Correo ya existe'];
        } else {
            $response = $db->add([
                'name' => $input['name'],
                'birthday' => $input['birthday'],
                'email' => $input['email']
            ]);
            $code = 201;
        }
    } elseif ($method === 'PUT') {
        $id = (int)($uri[0] ?? 0);
        $person = $db->findById($id);
        if (!$person) {
            $code = 404;
            $response = ['message' => 'Person not found'];
        } else {
            $errors = validate($input, true);
            if ($errors) {
                $code = 400;
                $response = ['errors' => $errors];
            } elseif (isset($input['email']) && $input['email'] !== $person['email'] && $db->findByEmail($input['email'])) {
                $code = 400;
                $response = ['error' => 'Correo ya existe'];
            } else {
                $response = $db->updateById($id, $input);
            }
        }
    } elseif ($method === 'DELETE') {
        $id = (int)($uri[0] ?? 0);
        $person = $db->findById($id);
        if (!$person) {
            $code = 404;
            $response = ['message' => 'Person not found'];
        } else {
            $db->removeById($id);
            $response = ['message' => 'Deleted'];
        }
    } else {
        $code = 405;
        $response = ['error' => 'Method not allowed'];
    }
} catch (Exception $e) {
    $code = 500;
    $response = ['error' => 'Server error'];
}

function validate($data, $partial = false): array
{
    $err = [];
    if (!$partial) {
        if (empty($data['name'] ?? '')) $err[] = 'Nombre requerido';
        if (empty($data['birthday'] ?? '')) $err[] = 'Fecha de nacimiento requerida';
        if (empty($data['email'] ?? '')) $err[] = 'Email requerido';
    }
    if (isset($data['name']) && strlen($data['name'] ?? '') < 2) $err[] = 'Nombre muy corto';
    if (isset($data['email']) && $data['email'] && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $err[] = 'Email inválido';
    if (isset($data['birthday']) && $data['birthday']) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['birthday'])) {
            $err[] = 'Formato YYYY-MM-DD';
        } else {
            $birth = new DateTime($data['birthday']);
            if ($birth > new DateTime()) $err[] = 'Fecha no puede ser futura';
        }
    }
    return $err;
}

http_response_code($code);
echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
