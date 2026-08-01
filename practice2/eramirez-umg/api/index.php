<?php

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../controllers/PersonController.php";

$controller = new PersonController();

$method = $_SERVER["REQUEST_METHOD"];

$uri = parse_url($_SERVER["REQUEST_URI"], PHP_URL_PATH);
$uri = trim($uri, "/");

$segments = explode("/", $uri);

if (
    !isset($segments[0]) ||
    !isset($segments[1]) ||
    $segments[0] !== "api" ||
    $segments[1] !== "persons"
) {
    http_response_code(404);
    echo json_encode(["message" => "Endpoint not found"]);
    exit;
}

$id = isset($segments[2]) && is_numeric($segments[2])
    ? (int) $segments[2]
    : null;

$isAgeEndpoint = isset($segments[3]) && $segments[3] === "age";

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    $data = [];
}

switch ($method) {
    case "GET":
        if ($id !== null && $isAgeEndpoint) {
            $controller->getAge($id);
        } elseif ($id !== null) {
            $controller->getById($id);
        } else {
            $controller->getAll();
        }
        break;

    case "POST":
        if ($id !== null) {
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            break;
        }

        $controller->create($data);
        break;

    case "PUT":
        if ($id === null) {
            http_response_code(400);
            echo json_encode(["message" => "Person ID is required"]);
            break;
        }

        $controller->update($id, $data);
        break;

    case "DELETE":
        if ($id === null) {
            http_response_code(400);
            echo json_encode(["message" => "Person ID is required"]);
            break;
        }

        $controller->delete($id);
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed"]);
}