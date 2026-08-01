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
        $people = $this->fileManager->read();

        $this->respond($people, 200);
    }

    public function show(int $id): void
    {
        $people = $this->fileManager->read();

        foreach ($people as $person) {
            if ((int) $person['id'] === $id) {
                $this->respond($person, 200);
            }
        }

        $this->personNotFound();
    }

    public function store(array $data): void
    {
        $errors = $this->validate($data);

        if (!empty($errors)) {
            $this->respond(['errors' => $errors], 400);
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
            $this->respond([
                'message' => 'Unable to save person'
            ], 500);
        }

        $this->respond($person->toArray(), 201);
    }

    public function update(int $id, array $data): void
    {
        $people = $this->fileManager->read();
        $personIndex = $this->findPersonIndex($people, $id);

        if ($personIndex === null) {
            $this->personNotFound();
        }

        $updatedData = [
            'name' => $data['name'] ?? $people[$personIndex]['name'],
            'birthday' => $data['birthday'] ?? $people[$personIndex]['birthday'],
            'email' => $data['email'] ?? $people[$personIndex]['email']
        ];

        $errors = $this->validate($updatedData, $id);

        if (!empty($errors)) {
            $this->respond(['errors' => $errors], 400);
        }

        $person = new PersonDTO(
            $id,
            trim($updatedData['name']),
            $updatedData['birthday'],
            trim($updatedData['email'])
        );

        $people[$personIndex] = $person->toArray();

        if (!$this->fileManager->write($people)) {
            $this->respond([
                'message' => 'Unable to update person'
            ], 500);
        }

        $this->respond($person->toArray(), 200);
    }

    public function destroy(int $id): void
    {
        $people = $this->fileManager->read();
        $personIndex = $this->findPersonIndex($people, $id);

        if ($personIndex === null) {
            $this->personNotFound();
        }

        array_splice($people, $personIndex, 1);

        if (!$this->fileManager->write($people)) {
            $this->respond([
                'message' => 'Unable to delete person'
            ], 500);
        }

        $this->respond([
            'message' => 'Person deleted successfully'
        ], 200);
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
                ], 200);
            }
        }

        $this->personNotFound();
    }

    private function validate(array $data, ?int $ignoreId = null): array
    {
        $errors = [];

        $name = trim($data['name'] ?? '');
        $birthday = trim($data['birthday'] ?? '');
        $email = trim($data['email'] ?? '');

        if ($name === '') {
            $errors['name'] = 'Name is required';
        }

        if ($email === '') {
            $errors['email'] = 'Email is required';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Invalid email format';
        } elseif ($this->emailExists($email, $ignoreId)) {
            $errors['email'] = 'Email already exists';
        }

        if ($birthday === '') {
            $errors['birthday'] = 'Birthday is required';
        } elseif (!$this->isValidDate($birthday)) {
            $errors['birthday'] = 'Birthday must use YYYY-MM-DD format';
        } elseif (new DateTime($birthday) > new DateTime()) {
            $errors['birthday'] = 'Birthday cannot be a future date';
        }

        return $errors;
    }

    private function emailExists(string $email, ?int $ignoreId = null): bool
    {
        $people = $this->fileManager->read();

        foreach ($people as $person) {
            $sameEmail =
                strtolower($person['email']) === strtolower($email);

            $differentPerson =
                $ignoreId === null ||
                (int) $person['id'] !== $ignoreId;

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
            && (
                $dateErrors === false
                || (
                    $dateErrors['warning_count'] === 0
                    && $dateErrors['error_count'] === 0
                )
            )
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

        $ids = array_map(
            'intval',
            array_column($people, 'id')
        );

        return max($ids) + 1;
    }

    private function personNotFound(): void
    {
        $this->respond([
            'message' => 'Person not found'
        ], 404);
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
