<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../controllers/PersonController.php';

$controller = new PersonController(__DIR__ . '/../data/persons.json');

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME'];
$basePath = rtrim(str_replace('\\', '/', dirname($scriptName)), '/');
$path = $basePath !== '' && strpos($requestUri, $basePath) === 0
    ? substr($requestUri, strlen($basePath))
    : $requestUri;
$path = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);

$input = null;
if (in_array($method, ['POST', 'PUT'], true)) {
    $rawBody = file_get_contents('php://input');
    $input = json_decode($rawBody, true);
    if (!is_array($input)) {
        sendResponse(400, ['message' => 'Request body must be valid JSON']);
    }
}

try {
    $routes = [
        ['GET', 'persons', static function () use ($controller): void {
            sendResponse(200, $controller->getAllPersons());
        }],
        ['POST', 'persons', static function () use ($controller, $input): void {
            sendResponse(201, $controller->createPerson($input));
        }],
        ['GET', 'persons/{id}', static function (array $params) use ($controller): void {
            $id = $params['id'];
            $person = $controller->getPerson($id);
            if ($person === null) {
                sendResponse(404, ['message' => 'Person not found']);
            }
            sendResponse(200, $person);
        }],
        ['PUT', 'persons/{id}', static function (array $params) use ($controller, $input): void {
            $updatedPerson = $controller->updatePerson($params['id'], $input);
            sendResponse(200, $updatedPerson);
        }],
        ['DELETE', 'persons/{id}', static function (array $params) use ($controller): void {
            $controller->deletePerson($params['id']);
            sendResponse(200, ['message' => 'Person deleted successfully']);
        }],
        ['GET', 'persons/{id}/age', static function (array $params) use ($controller): void {
            sendResponse(200, $controller->getPersonAge($params['id']));
        }],
    ];

    $resolvedRoute = resolveRoute($method, $segments, $routes);
    if ($resolvedRoute === null) {
        sendResponse(404, ['message' => 'Endpoint not found']);
    }

    $resolvedRoute($controller);
} catch (InvalidArgumentException $exception) {
    sendResponse(400, ['message' => $exception->getMessage()]);
} catch (RuntimeException $exception) {
    sendResponse(404, ['message' => $exception->getMessage()]);
} catch (Throwable $exception) {
    sendResponse(500, ['message' => 'Internal server error']);
}

function resolveRoute(string $method, array $segments, array $routes): ?callable
{
    foreach ($routes as $route) {
        [$routeMethod, $routePattern, $handler] = $route;

        if ($routeMethod !== $method) {
            continue;
        }

        $routeSegments = explode('/', $routePattern);
        if (count($routeSegments) !== count($segments)) {
            continue;
        }

        $params = [];
        $matched = true;

        foreach ($routeSegments as $index => $routeSegment) {
            $segment = $segments[$index];

            if (preg_match('/^\{[a-zA-Z0-9_]+\}$/', $routeSegment) === 1) {
                $paramName = trim($routeSegment, '{}');

                if (!is_numeric($segment)) {
                    $matched = false;
                    break;
                }

                $params[$paramName] = (int) $segment;
                continue;
            }

            if ($routeSegment !== $segment) {
                $matched = false;
                break;
            }
        }

        if ($matched) {
            return static fn () => $handler($params);
        }
    }

    return null;
}

function sendResponse(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
