<?php

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';

class PersonController
{
    private FileManager $fileManager;

    public function __construct()
    {
        $this->fileManager = new FileManager();
    }

    /* Obtiene todas las personas */
    public function getAll(): void
    {
        $this->response(
            $this->fileManager->getAll(),
            200
        );
    }

    /* Obtiene una persona por ID */
    public function getById(int $id): void
    {
        $person = $this->fileManager->getById($id);
        if (!$person) {
            $this->response([
                'message' => 'Person not found'
            ], 404);
            return;
        }
        $this->response($person, 200);
    }

    /* Crea una persona */
    public function create(array $data): void
    {
        $validation = $this->validate($data);
        if ($validation !== null) {
            $this->response($validation, 400);
            return;
        }
        if ($this->fileManager->emailExists($data['email'])) {
            $this->response([
                'message' => 'Email already exists'
            ], 400);
            return;
        }
        $person = new PersonDTO(
            $this->fileManager->generateId(),
            trim($data['name']),
            $data['birthday'],
            strtolower(trim($data['email']))
        );
        $this->response(
            $this->fileManager->create($person),
            201
        );
    }

    /* Actualiza una persona */
    public function update(int $id, array $data): void
    {
        if (!$this->fileManager->getById($id)) {
            $this->response([
                'message' => 'Person not found'
            ], 404);
            return;
        }
        $validation = $this->validate($data);
        if ($validation !== null) {
            $this->response($validation, 400);
            return;
        }
        if ($this->fileManager->emailExists($data['email'], $id)) {
            $this->response([
                'message' => 'Email already exists'
            ], 400);
            return;
        }
        $person = new PersonDTO(
            $id,
            trim($data['name']),
            $data['birthday'],
            strtolower(trim($data['email']))
        );
        $updated = $this->fileManager->update($person);
        $this->response($updated, 200);
    }

    /* Elimina una persona */
    public function delete(int $id): void
    {
        if (!$this->fileManager->delete($id)) {
            $this->response([
                'message' => 'Person not found'
            ], 404);
            return;
        }
        $this->response([
            'message' => 'Person deleted successfully'
        ], 200);
    }

    /* Obtiene la edad de una persona */
    public function getAge(int $id): void
    {
        $person = $this->fileManager->getById($id);
        if (!$person) {
            $this->response([
                'message' => 'Person not found'
            ], 404);
            return;
        }
        $birthday = new DateTime($person['birthday']);
        $today = new DateTime();
        $age = $today->diff($birthday)->y;
        $this->response([
            'id' => $person['id'],
            'name' => $person['name'],
            'age' => $age
        ], 200);
    }

    /* Valida los datos recibidos */
    private function validate(array $data): ?array
    {
        if (
            !isset($data['name']) ||
            !isset($data['birthday']) ||
            !isset($data['email'])
        ) {
            return [
                'message' => 'All fields are required'
            ];
        }
        if (trim($data['name']) === '') {
            return [
                'message' => 'Name cannot be empty'
            ];
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return [
                'message' => 'Invalid email'
            ];
        }
        $date = DateTime::createFromFormat(
            'Y-m-d',
            $data['birthday']
        );
        if (
            !$date ||
            $date->format('Y-m-d') !== $data['birthday']
        ) {
            return [
                'message' => 'Birthday must have format YYYY-MM-DD'
            ];
        }
        if ($date > new DateTime()) {
            return [
                'message' => 'Birthday cannot be in the future'
            ];
        }
        return null;
    }

    /* Devuelve una respuesta JSON */
    private function response(array $data, int $statusCode): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode(
            $data,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
    }
}