<?php

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';

class PersonController {
    private $fileManager;

    public function __construct() {
        $this->fileManager = new FileManager(__DIR__ . '/../data/persons.json');
    }

    public function handleRequest($method, $uri, $body = null) {
        $path = explode('/', trim($uri, '/'));
        
        // GET /api/persons
        if ($method === 'GET' && count($path) === 2 && $path[1] === 'persons') {
            return $this->getAll();
        }
        
        // GET /api/persons/{id}
        if ($method === 'GET' && count($path) === 3 && $path[1] === 'persons') {
            return $this->getById($path[2]);
        }
        
        // GET /api/persons/{id}/age
        if ($method === 'GET' && count($path) === 4 && $path[1] === 'persons' && $path[3] === 'age') {
            return $this->getAge($path[2]);
        }
        
        // POST /api/persons
        if ($method === 'POST' && count($path) === 2 && $path[1] === 'persons') {
            return $this->create($body);
        }
        
        // PUT /api/persons/{id}
        if ($method === 'PUT' && count($path) === 3 && $path[1] === 'persons') {
            return $this->update($path[2], $body);
        }
        
        // DELETE /api/persons/{id}
        if ($method === 'DELETE' && count($path) === 3 && $path[1] === 'persons') {
            return $this->delete($path[2]);
        }
        
        return $this->errorResponse('Endpoint no encontrado', 404);
    }

    private function getAll() {
        $persons = $this->fileManager->readAll();
        return $this->successResponse($persons);
    }

    private function getById($id) {
        $person = $this->fileManager->findById($id);
        if (!$person) {
            return $this->errorResponse('Person not found', 404);
        }
        return $this->successResponse($person);
    }

    private function getAge($id) {
        $person = $this->fileManager->findById($id);
        if (!$person) {
            return $this->errorResponse('Person not found', 404);
        }
        
        $birthday = new DateTime($person['birthday']);
        $today = new DateTime();
        $age = $today->diff($birthday)->y;
        
        return $this->successResponse([
            'id' => $person['id'],
            'name' => $person['name'],
            'age' => $age
        ]);
    }

    private function create($body) {
        $validation = $this->validatePersonData($body);
        if ($validation !== true) {
            return $this->errorResponse($validation, 400);
        }
        
        // Verificar email duplicado
        $persons = $this->fileManager->readAll();
        foreach ($persons as $person) {
            if ($person['email'] === $body['email']) {
                return $this->errorResponse('Email already exists', 400);
            }
        }
        
        $personDTO = PersonDTO::fromArray([
            'id' => $this->generateId(),
            'name' => $body['name'],
            'birthday' => $body['birthday'],
            'email' => $body['email']
        ]);
        
        $saved = $this->fileManager->save($personDTO->toArray());
        return $this->successResponse($saved, 201);
    }

    private function update($id, $body) {
        $validation = $this->validatePersonData($body);
        if ($validation !== true) {
            return $this->errorResponse($validation, 400);
        }
        
        // Verificar email duplicado (excluyendo el mismo ID)
        $persons = $this->fileManager->readAll();
        foreach ($persons as $person) {
            if ($person['email'] === $body['email'] && $person['id'] != $id) {
                return $this->errorResponse('Email already exists', 400);
            }
        }
        
        $updated = $this->fileManager->update($id, [
            'name' => $body['name'],
            'birthday' => $body['birthday'],
            'email' => $body['email']
        ]);
        
        if (!$updated) {
            return $this->errorResponse('Person not found', 404);
        }
        
        return $this->successResponse($updated);
    }

    private function delete($id) {
        $deleted = $this->fileManager->delete($id);
        if (!$deleted) {
            return $this->errorResponse('Person not found', 404);
        }
        return $this->successResponse(['message' => 'Person deleted successfully']);
    }

    private function validatePersonData($data) {
        if (!isset($data['name']) || empty(trim($data['name']))) {
            return 'Name is required and cannot be empty';
        }
        
        if (!isset($data['email']) || empty(trim($data['email']))) {
            return 'Email is required';
        }
        
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return 'Invalid email format';
        }
        
        if (!isset($data['birthday']) || empty(trim($data['birthday']))) {
            return 'Birthday is required';
        }
        
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['birthday'])) {
            return 'Birthday must be in format YYYY-MM-DD';
        }
        
        $birthday = DateTime::createFromFormat('Y-m-d', $data['birthday']);
        $today = new DateTime();
        if ($birthday > $today) {
            return 'Birthday cannot be a future date';
        }
        
        return true;
    }

    private function generateId() {
        $persons = $this->fileManager->readAll();
        if (empty($persons)) {
            return 1;
        }
        $maxId = max(array_column($persons, 'id'));
        return $maxId + 1;
    }

    private function successResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        return json_encode($data);
    }

    private function errorResponse($message, $statusCode = 400) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        return json_encode(['message' => $message]);
    }
}