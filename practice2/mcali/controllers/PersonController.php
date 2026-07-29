<?php

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';

class PersonController
{
    private FileManager $fileManager;

    public function __construct(FileManager $fileManager)
    {
        $this->fileManager = $fileManager;
    }

    /**
     * Get the request method
     */
    private function getRequestMethod(): string
    {
        return $_SERVER['REQUEST_METHOD'];
    }

    /**
     * Get the request path
     */
    private function getRequestPath(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        return $path;
    }

    /**
     * Get JSON input from request body
     */
    private function getJsonInput(): array
    {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        return $data ?? [];
    }

    /**
     * Send JSON response
     */
    private function sendJsonResponse(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Validate the PersonDTO data
     */
    private function validatePersonData(array $data, bool $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data['name'] ?? '')) {
                $errors[] = 'El nombre es obligatorio y no puede estar vacío.';
            }
            if (empty($data['birthday'] ?? '')) {
                $errors[] = 'La fecha de nacimiento es obligatoria.';
            }
            if (empty($data['email'] ?? '')) {
                $errors[] = 'El correo es obligatorio.';
            }
        } else {
            // For updates, validate only if field is provided
            if (isset($data['name']) && empty($data['name'])) {
                $errors[] = 'El nombre no puede estar vacío.';
            }
            if (isset($data['birthday']) && empty($data['birthday'])) {
                $errors[] = 'La fecha de nacimiento no puede estar vacía.';
            }
            if (isset($data['email']) && empty($data['email'])) {
                $errors[] = 'El correo no puede estar vacío.';
            }
        }

        // Validate name (if provided)
        if (isset($data['name']) && strlen($data['name']) > 0 && strlen($data['name']) < 2) {
            $errors[] = 'El nombre debe tener al menos 2 caracteres.';
        }

        // Validate email format (if provided)
        if (isset($data['email']) && !empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'El formato del correo no es válido.';
            }
        }

        // Validate birthday format and not in future (if provided)
        if (isset($data['birthday']) && !empty($data['birthday'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['birthday'])) {
                $errors[] = 'La fecha de nacimiento debe tener el formato YYYY-MM-DD.';
            } else {
                try {
                    $birthDate = new DateTime($data['birthday']);
                    $now = new DateTime();
                    
                    if ($birthDate > $now) {
                        $errors[] = 'La fecha de nacimiento no puede ser una fecha futura.';
                    }
                } catch (Exception $e) {
                    $errors[] = 'La fecha de nacimiento no es válida.';
                }
            }
        }

        return $errors;
    }

    /**
     * Create a new person
     */
    private function createPerson(): void
    {
        $data = $this->getJsonInput();

        // Validate required fields
        $validationErrors = $this->validatePersonData($data);
        if (!empty($validationErrors)) {
            $this->sendJsonResponse(['errors' => $validationErrors], 400);
            return;
        }

        // Check for duplicate email
        $existingPerson = $this->fileManager->findByEmail($data['email']);
        if ($existingPerson) {
            $this->sendJsonResponse(['error' => 'El correo ya está registrado.'], 400);
            return;
        }

        // Create person
        $personData = [
            'name' => $data['name'],
            'birthday' => $data['birthday'],
            'email' => $data['email'],
        ];

        $createdPerson = $this->fileManager->create($personData);
        $this->sendJsonResponse($createdPerson, 201);
    }

    /**
     * Get all persons
     */
    private function getAllPersons(): void
    {
        $persons = $this->fileManager->read();
        $this->sendJsonResponse($persons);
    }

    /**
     * Get a person by ID
     */
    private function getPersonById(int $id): void
    {
        $person = $this->fileManager->findById($id);

        if (!$person) {
            $this->sendJsonResponse(['message' => 'Person not found'], 404);
            return;
        }

        $this->sendJsonResponse($person);
    }

    /**
     * Get the age of a person
     */
    private function getPersonAge(int $id): void
    {
        $person = $this->fileManager->findById($id);

        if (!$person) {
            $this->sendJsonResponse(['message' => 'Person not found'], 404);
            return;
        }

        try {
            $birthDate = new DateTime($person['birthday']);
            $now = new DateTime();
            $age = $now->diff($birthDate)->y;

            $response = [
                'id' => $person['id'],
                'name' => $person['name'],
                'age' => $age,
            ];

            $this->sendJsonResponse($response);
        } catch (Exception $e) {
            $this->sendJsonResponse(['error' => 'Error calculating age'], 500);
        }
    }

    /**
     * Update a person
     */
    private function updatePerson(int $id): void
    {
        $person = $this->fileManager->findById($id);

        if (!$person) {
            $this->sendJsonResponse(['message' => 'Person not found'], 404);
            return;
        }

        $data = $this->getJsonInput();

        // Validate the update data
        $validationErrors = $this->validatePersonData($data, true);
        if (!empty($validationErrors)) {
            $this->sendJsonResponse(['errors' => $validationErrors], 400);
            return;
        }

        // Check for duplicate email if email is being updated
        if (isset($data['email']) && $data['email'] !== $person['email']) {
            $existingPerson = $this->fileManager->findByEmail($data['email']);
            if ($existingPerson) {
                $this->sendJsonResponse(['error' => 'El correo ya está registrado.'], 400);
                return;
            }
        }

        // Update person
        $updatedPerson = $this->fileManager->update($id, $data);

        if (!$updatedPerson) {
            $this->sendJsonResponse(['error' => 'Error updating person'], 500);
            return;
        }

        $this->sendJsonResponse($updatedPerson);
    }

    /**
     * Delete a person
     */
    private function deletePerson(int $id): void
    {
        $person = $this->fileManager->findById($id);

        if (!$person) {
            $this->sendJsonResponse(['message' => 'Person not found'], 404);
            return;
        }

        if ($this->fileManager->delete($id)) {
            $this->sendJsonResponse(['message' => 'Person deleted successfully']);
        } else {
            $this->sendJsonResponse(['error' => 'Error deleting person'], 500);
        }
    }

    /**
     * Route the request to the appropriate method
     */
    public function route(): void
    {
        $method = $this->getRequestMethod();
        $path = $this->getRequestPath();

        // Remove the base path /api/ if present
        $basePath = '/api/persons';
        if (strpos($path, $basePath) === 0) {
            $path = substr($path, strlen($basePath));
        }

        // Remove query string if present
        if (strpos($path, '?') !== false) {
            $path = substr($path, 0, strpos($path, '?'));
        }

        // Route: GET /api/persons
        if ($method === 'GET' && ($path === '' || $path === '/')) {
            $this->getAllPersons();
            return;
        }

        // Route: POST /api/persons
        if ($method === 'POST' && ($path === '' || $path === '/')) {
            $this->createPerson();
            return;
        }

        // Extract ID from path
        if (preg_match('|^/(\d+)(/age)?/?$|', $path, $matches)) {
            $id = (int)$matches[1];
            $isAge = isset($matches[2]) && $matches[2] === '/age';

            // Route: GET /api/persons/{id}/age
            if ($method === 'GET' && $isAge) {
                $this->getPersonAge($id);
                return;
            }

            // Route: GET /api/persons/{id}
            if ($method === 'GET' && !$isAge) {
                $this->getPersonById($id);
                return;
            }

            // Route: PUT /api/persons/{id}
            if ($method === 'PUT' && !$isAge) {
                $this->updatePerson($id);
                return;
            }

            // Route: DELETE /api/persons/{id}
            if ($method === 'DELETE' && !$isAge) {
                $this->deletePerson($id);
                return;
            }
        }

        // Route not found
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Endpoint not found']);
    }
}
?>
