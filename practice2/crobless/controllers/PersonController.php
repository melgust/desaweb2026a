<?php

declare(strict_types=1);

final class PersonController
{
    private FileManager $fileManager;

    public function __construct(FileManager $fileManager)
    {
        $this->fileManager = $fileManager;
    }

    public function getAll(): void
    {
        $persons = $this->fileManager->read();

        $this->sendResponse($persons, 200);
    }

    public function getById(int $id): void
    {
        $persons = $this->fileManager->read();
        $person = $this->findPersonById($persons, $id);

        if ($person === null) {
            $this->sendResponse(
                ['message' => 'Person not found'],
                404
            );

            return;
        }

        $this->sendResponse($person, 200);
    }

    public function create(): void
    {
        $data = $this->getRequestBody();

        $errors = $this->validatePersonData($data);

        if (!empty($errors)) {
            $this->sendResponse(
                [
                    'message' => 'Validation failed',
                    'errors' => $errors,
                ],
                400
            );

            return;
        }

        $persons = $this->fileManager->read();
        $email = strtolower(trim($data['email']));

        if ($this->emailExists($persons, $email)) {
            $this->sendResponse(
                ['message' => 'Email already exists'],
                409
            );

            return;
        }

        $person = new PersonDTO(
            $this->generateNextId($persons),
            trim($data['name']),
            $data['birthday'],
            $email
        );

        $persons[] = $person->toArray();

        if (!$this->fileManager->write($persons)) {
            $this->sendResponse(
                ['message' => 'Unable to save person'],
                500
            );

            return;
        }

        $this->sendResponse($person->toArray(), 201);
    }

    public function update(int $id): void
    {
        $persons = $this->fileManager->read();
        $personIndex = $this->findPersonIndexById($persons, $id);

        if ($personIndex === null) {
            $this->sendResponse(
                ['message' => 'Person not found'],
                404
            );

            return;
        }

        $data = $this->getRequestBody();

        $updatedData = [
            'name' => $data['name'] ?? $persons[$personIndex]['name'],
            'birthday' => $data['birthday'] ?? $persons[$personIndex]['birthday'],
            'email' => $data['email'] ?? $persons[$personIndex]['email'],
        ];

        $errors = $this->validatePersonData($updatedData);

        if (!empty($errors)) {
            $this->sendResponse(
                [
                    'message' => 'Validation failed',
                    'errors' => $errors,
                ],
                400
            );

            return;
        }

        $email = strtolower(trim($updatedData['email']));

        if ($this->emailExists($persons, $email, $id)) {
            $this->sendResponse(
                ['message' => 'Email already exists'],
                409
            );

            return;
        }

        $person = new PersonDTO(
            $id,
            trim($updatedData['name']),
            $updatedData['birthday'],
            $email
        );

        $persons[$personIndex] = $person->toArray();

        if (!$this->fileManager->write($persons)) {
            $this->sendResponse(
                ['message' => 'Unable to update person'],
                500
            );

            return;
        }

        $this->sendResponse($person->toArray(), 200);
    }

    public function delete(int $id): void
    {
        $persons = $this->fileManager->read();
        $personIndex = $this->findPersonIndexById($persons, $id);

        if ($personIndex === null) {
            $this->sendResponse(
                ['message' => 'Person not found'],
                404
            );

            return;
        }

        unset($persons[$personIndex]);

        if (!$this->fileManager->write($persons)) {
            $this->sendResponse(
                ['message' => 'Unable to delete person'],
                500
            );

            return;
        }

        $this->sendResponse(
            ['message' => 'Person deleted'],
            200
        );
    }

    public function getAge(int $id): void
    {
        $persons = $this->fileManager->read();
        $person = $this->findPersonById($persons, $id);

        if ($person === null) {
            $this->sendResponse(
                ['message' => 'Person not found'],
                404
            );

            return;
        }

        $birthday = new DateTime($person['birthday']);
        $today = new DateTime();
        $age = $birthday->diff($today)->y;

        $this->sendResponse(
            [
                'id' => $person['id'],
                'name' => $person['name'],
                'age' => $age,
            ],
            200
        );
    }

    private function getRequestBody(): array
    {
        $body = file_get_contents('php://input');

        if ($body === false || trim($body) === '') {
            $this->sendResponse(
                ['message' => 'Request body is required'],
                400
            );

            exit;
        }

        $data = json_decode($body, true);

        if (!is_array($data)) {
            $this->sendResponse(
                ['message' => 'Invalid JSON body'],
                400
            );

            exit;
        }

        return $data;
    }

    private function validatePersonData(array $data): array
    {
        $errors = [];

        if (!isset($data['name'])) {
            $errors['name'] = 'Name is required.';
        } elseif (trim($data['name']) === '') {
            $errors['name'] = 'Name cannot be empty.';
        }

        if (!isset($data['birthday'])) {
            $errors['birthday'] = 'Birthday is required.';
        } elseif (!$this->isValidBirthday($data['birthday'])) {
            $errors['birthday'] =
                'Birthday must use YYYY-MM-DD and cannot be a future date.';
        }

        if (!isset($data['email'])) {
            $errors['email'] = 'Email is required.';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Email format is invalid.';
        }

        return $errors;
    }

    private function isValidBirthday(string $birthday): bool
    {
        $date = DateTime::createFromFormat('Y-m-d', $birthday);
        $dateErrors = DateTime::getLastErrors();

        if ($date === false) {
            return false;
        }

        if (
            is_array($dateErrors)
            && (
                $dateErrors['warning_count'] > 0
                || $dateErrors['error_count'] > 0
            )
        ) {
            return false;
        }

        if ($date->format('Y-m-d') !== $birthday) {
            return false;
        }

        $today = new DateTime('today');

        return $date <= $today;
    }

    private function generateNextId(array $persons): int
    {
        if (empty($persons)) {
            return 1;
        }

        $ids = array_column($persons, 'id');

        return max($ids) + 1;
    }

    private function findPersonById(array $persons, int $id): ?array
    {
        foreach ($persons as $person) {
            if ((int) $person['id'] === $id) {
                return $person;
            }
        }

        return null;
    }

    private function findPersonIndexById(array $persons, int $id): ?int
    {
        foreach ($persons as $index => $person) {
            if ((int) $person['id'] === $id) {
                return $index;
            }
        }

        return null;
    }

    private function emailExists(
        array $persons,
        string $email,
        ?int $excludedId = null
    ): bool {
        foreach ($persons as $person) {
            $sameEmail = strtolower($person['email']) === strtolower($email);
            $differentPerson =
                $excludedId === null
                || (int) $person['id'] !== $excludedId;

            if ($sameEmail && $differentPerson) {
                return true;
            }
        }

        return false;
    }

    private function sendResponse(array $data, int $statusCode): void
    {
        http_response_code($statusCode);

        echo json_encode(
            $data,
            JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
        );
    }
}