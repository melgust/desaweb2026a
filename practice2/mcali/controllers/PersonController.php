<?php

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';

class PersonController
{
    private FileManager $db;

    public function __construct(FileManager $db)
    {
        $this->db = $db;
    }

    private function input(): array
    {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }

    private function json($data, $code = 200): void
    {
        http_response_code($code);
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    private function validate($data, $isUpdate = false): array
    {
        $errors = [];

        if (!$isUpdate) {
            if (empty($data['name'] ?? '')) $errors[] = 'El nombre es obligatorio';
            if (empty($data['birthday'] ?? '')) $errors[] = 'La fecha de nacimiento es obligatoria';
            if (empty($data['email'] ?? '')) $errors[] = 'El correo es obligatorio';
        }

        if (isset($data['name']) && empty($data['name'])) {
            $errors[] = 'El nombre no puede estar vacío';
        }
        
        if (isset($data['name']) && strlen($data['name']) < 2) {
            $errors[] = 'El nombre debe tener al menos 2 caracteres';
        }

        if (isset($data['email']) && !empty($data['email'])) {
            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'El correo no es válido';
            }
        }

        if (isset($data['birthday']) && !empty($data['birthday'])) {
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['birthday'])) {
                $errors[] = 'Formato de fecha debe ser YYYY-MM-DD';
            } else {
                try {
                    $birth = new DateTime($data['birthday']);
                    if ($birth > new DateTime()) {
                        $errors[] = 'La fecha no puede ser futura';
                    }
                } catch (Exception $e) {
                    $errors[] = 'Fecha inválida';
                }
            }
        }

        return $errors;
    }

    private function getPath(): string
    {
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $path = substr($path, strpos($path, '/api/persons'));
        $path = strlen($path) > 13 ? substr($path, 13) : '';
        return strtok($path ?: '/', '?');
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = $this->getPath();

        if ($method === 'POST' && $path === '') {
            $this->store();
            return;
        }

        if ($method === 'GET' && $path === '') {
            $this->list();
            return;
        }

        if (preg_match('|^/(\d+)(?:/age)?$|', $path, $m)) {
            $id = (int)$m[1];

            if ($method === 'GET' && str_contains($path, '/age')) {
                $this->age($id);
                return;
            }

            if ($method === 'GET') {
                $this->show($id);
                return;
            }

            if ($method === 'PUT') {
                $this->update($id);
                return;
            }

            if ($method === 'DELETE') {
                $this->destroy($id);
                return;
            }
        }

        $this->json(['error' => 'Not found'], 404);
    }

    private function store(): void
    {
        $data = $this->input();
        $errors = $this->validate($data);

        if ($errors) {
            $this->json(['errors' => $errors], 400);
            return;
        }

        if ($this->db->findByEmail($data['email'])) {
            $this->json(['error' => 'Correo ya registrado'], 400);
            return;
        }

        $person = $this->db->add([
            'name' => $data['name'],
            'birthday' => $data['birthday'],
            'email' => $data['email']
        ]);

        $this->json($person, 201);
    }

    private function list(): void
    {
        $this->json($this->db->read());
    }

    private function show(int $id): void
    {
        $person = $this->db->findById($id);
        if (!$person) {
            $this->json(['message' => 'Person not found'], 404);
            return;
        }
        $this->json($person);
    }

    private function age(int $id): void
    {
        $person = $this->db->findById($id);
        if (!$person) {
            $this->json(['message' => 'Person not found'], 404);
            return;
        }

        $birth = new DateTime($person['birthday']);
        $now = new DateTime();
        $age = $now->diff($birth)->y;

        $this->json([
            'id' => $person['id'],
            'name' => $person['name'],
            'age' => $age
        ]);
    }

    private function update(int $id): void
    {
        $person = $this->db->findById($id);
        if (!$person) {
            $this->json(['message' => 'Person not found'], 404);
            return;
        }

        $data = $this->input();
        $errors = $this->validate($data, true);

        if ($errors) {
            $this->json(['errors' => $errors], 400);
            return;
        }

        if (isset($data['email']) && $data['email'] !== $person['email']) {
            if ($this->db->findByEmail($data['email'])) {
                $this->json(['error' => 'Correo ya registrado'], 400);
                return;
            }
        }

        $updated = $this->db->updateById($id, $data);
        $this->json($updated);
    }

    private function destroy(int $id): void
    {
        $person = $this->db->findById($id);
        if (!$person) {
            $this->json(['message' => 'Person not found'], 404);
            return;
        }

        $this->db->removeById($id);
        $this->json(['message' => 'Deleted']);
    }
}
