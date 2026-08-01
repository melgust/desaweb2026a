<?php

declare(strict_types=1);

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';

class PersonController
{
    private FileManager $fileManager;

    public function __construct(FileManager $fileManager)
    {
        $this->fileManager = $fileManager;
    }

    public function index(): void
    {
        $this->respond($this->fileManager->read());
    }

    public function show(int $id): void
    {
        $people = $this->fileManager->read();

        foreach ($people as $person) {
            if ((int) $person['id'] === $id) {
                $this->respond($person);
            }
        }

        $this->respond(['error' => 'Persona no encontrada'], 404);
    }

    public function store(array $data): void
    {
        $errors = $this->validate($data);

        if (!empty($errors)) {
            $this->respond(['errors' => $errors], 422);
        }

        $people = $this->fileManager->read();
        $newId = $this->getNextId($people);

        $person = new PersonDTO(
            $newId,
            trim($data['name']),
            $data['birthday'],
            trim($data['email'])
        );

        $people[] = $person->toArray();

        if (!$this->fileManager->write($people)) {
            $this->respond(['error' => 'No se pudo guardar la persona'], 500);
        }

        $this->respond($person->toArray(), 201);
    }

    public function update(int $id, array $data): void
    {
        $people = $this->fileManager->read();
        $personIndex = $this->findPersonIndex($people, $id);

        if ($personIndex === null) {
            $this->respond(['error' => 'Persona no encontrada'], 404);
        }

        $updatedData = [
            'name' => $data['name'] ?? $people[$personIndex]['name'],
            'birthday' => $data['birthday'] ?? $people[$personIndex]['birthday'],
            'email' => $data['email'] ?? $people[$personIndex]['email']
        ];

        $errors = $this->validate($updatedData, $id);

        if (!empty($errors)) {
            $this->respond(['errors' => $errors], 422);
        }

        $person = new PersonDTO(
            $id,
            trim($updatedData['name']),
            $updatedData['birthday'],
            trim($updatedData['email'])
        );

        $people[$personIndex] = $person->toArray();

        if (!$this->fileManager->write($people)) {
            $this->respond(['error' => 'No se pudo actualizar la persona'], 500);
        }

        $this->respond($person->toArray());
    }

    public function destroy(int $id): void
    {
        $people = $this->fileManager->read();
        $personIndex = $this->findPersonIndex($people, $id);

        if ($personIndex === null) {
            $this->respond(['error' => 'Persona no encontrada'], 404);
        }

        array_splice($people, $personIndex, 1);

        if (!$this->fileManager->write($people)) {
            $this->respond(['error' => 'No se pudo eliminar la persona'], 500);
        }

        $this->respond(['message' => 'Persona eliminada correctamente']);
    }

    public function age(int $id): void
    {
        $people = $this->fileManager->read();

        foreach ($people as $person) {
            if ((int) $person['id'] === $id) {
                $birthday = new DateTime($person['birthday']);
                $today = new DateTime();
                $age = $today->diff($birthday)->y;

                $this->respond([
                    'id' => $person['id'],
                    'name' => $person['name'],
                    'age' => $age
                ]);
            }
        }

        $this->respond(['error' => 'Persona no encontrada'], 404);
    }

    private function validate(array $data, ?int $ignoreId = null): array
    {
        $errors = [];

        $name = trim($data['name'] ?? '');
        $birthday = $data['birthday'] ?? '';
        $email = trim($data['email'] ?? '');

        if ($name === '') {
            $errors['name'] = 'El nombre es obligatorio';
        }

        if ($email === '') {
            $errors['email'] = 'El correo electrónico es obligatorio';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'El correo electrónico no es válido';
        } elseif ($this->emailExists($email, $ignoreId)) {
            $errors['email'] = 'El correo electrónico ya está registrado';
        }

        if ($birthday === '') {
            $errors['birthday'] = 'La fecha de nacimiento es obligatoria';
        } elseif (!$this->isValidDate($birthday)) {
            $errors['birthday'] = 'La fecha debe tener el formato YYYY-MM-DD';
        } elseif (new DateTime($birthday) > new DateTime()) {
            $errors['birthday'] = 'La fecha de nacimiento no puede ser futura';
        }

        return $errors;
    }

    private function emailExists(string $email, ?int $ignoreId = null): bool
    {
        $people = $this->fileManager->read();

        foreach ($people as $person) {
            $sameEmail = strtolower($person['email']) === strtolower($email);
            $differentPerson = $ignoreId === null || (int) $person['id'] !== $ignoreId;

            if ($sameEmail && $differentPerson) {
                return true;
            }
        }

        return false;
    }

    private function isValidDate(string $date): bool
    {
        $dateObject = DateTime::createFromFormat('!Y-m-d', $date);
        $dateErrors = DateTime::getLastErrors();

        return $dateObject !== false
            && ($dateErrors === false || (
                $dateErrors['warning_count'] === 0
                && $dateErrors['error_count'] === 0
            ))
            && $dateObject->format('Y-m-d') === $date;
    }

    private function findPersonIndex(array $people, int $id): ?int
    {
        foreach ($people as $index => $person) {
            if ((int) $person['id'] === $id) {
                return $index;
            }
        }

        return null;
    }

    private function getNextId(array $people): int
    {
        if (empty($people)) {
            return 1;
        }

        $ids = array_column($people, 'id');

        return max($ids) + 1;
    }

    private function respond(array $data, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        echo json_encode(
            $data,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );
        exit;
    }
}
