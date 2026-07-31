<?php
declare(strict_types=1);

require_once __DIR__ . '/../dto/PersonDTO.php';
require_once __DIR__ . '/../helpers/FileManager.php';

class PersonService
{
    private FileManager $fileManager;
    private array $persons;

    public function __construct(string $filePath)
    {
        $this->fileManager = new FileManager($filePath);
        $this->persons = $this->fileManager->readData();
    }

    public function createPerson(array $data): array
    {
        $this->validatePayload($data);
        $this->validateEmailDuplicate($data['email']);

        $id = $this->nextId();
        $person = new PersonDTO(
            $id,
            trim($data['name']),
            $data['birthday'],
            strtolower(trim($data['email']))
        );

        $this->persons[] = $person->toArray();
        $this->save();

        return $person->toArray();
    }

    public function getAllPersons(): array
    {
        return $this->persons;
    }

    public function getPerson(int $id): ?array
    {
        foreach ($this->persons as $person) {
            if ((int) $person['id'] === $id) {
                return $person;
            }
        }

        return null;
    }

    public function updatePerson(int $id, array $data): array
    {
        $this->validatePayload($data);
        $this->validateEmailDuplicate($data['email'], $id);

        $index = $this->findIndex($id);
        if ($index === null) {
            throw new RuntimeException('Person not found');
        }

        $this->persons[$index]['name'] = trim($data['name']);
        $this->persons[$index]['birthday'] = $data['birthday'];
        $this->persons[$index]['email'] = strtolower(trim($data['email']));

        $this->save();

        return $this->persons[$index];
    }

    public function deletePerson(int $id): void
    {
        $index = $this->findIndex($id);
        if ($index === null) {
            throw new RuntimeException('Person not found');
        }

        array_splice($this->persons, $index, 1);
        $this->save();
    }

    public function getPersonAge(int $id): array
    {
        $person = $this->getPerson($id);
        if ($person === null) {
            throw new RuntimeException('Person not found');
        }

        $birthday = DateTime::createFromFormat('Y-m-d', $person['birthday']);
        if ($birthday === false) {
            throw new RuntimeException('Invalid birthday format stored');
        }

        $today = new DateTime();
        $age = $today->diff($birthday)->y;

        return [
            'id' => $person['id'],
            'name' => $person['name'],
            'age' => $age,
        ];
    }

    private function validatePayload(array $data): void
    {
        $requiredKeys = ['name', 'birthday', 'email'];
        foreach ($requiredKeys as $key) {
            if (!array_key_exists($key, $data) || trim((string) $data[$key]) === '') {
                throw new InvalidArgumentException('All fields are required and cannot be empty');
            }
        }

        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }

        $birthdayText = trim((string) $data['birthday']);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthdayText)) {
            throw new InvalidArgumentException('Birthday must use the YYYY-MM-DD format');
        }

        $birthday = DateTime::createFromFormat('!Y-m-d', $birthdayText);
        if ($birthday === false || $birthday->format('Y-m-d') !== $birthdayText) {
            throw new InvalidArgumentException('Birthday must use the YYYY-MM-DD format');
        }

        $today = new DateTime();
        if ($birthday > $today) {
            throw new InvalidArgumentException('Birthday cannot be a future date');
        }
    }

    private function validateEmailDuplicate(string $email, ?int $excludeId = null): void
    {
        foreach ($this->persons as $person) {
            if (strtolower($person['email']) === strtolower(trim($email))) {
                if ($excludeId === null || (int) $person['id'] !== $excludeId) {
                    throw new InvalidArgumentException('Email already exists');
                }
            }
        }
    }

    private function nextId(): int
    {
        if (empty($this->persons)) {
            return 1;
        }

        $ids = array_map(static fn (array $person): int => (int) $person['id'], $this->persons);
        return max($ids) + 1;
    }

    private function findIndex(int $id): ?int
    {
        foreach ($this->persons as $index => $person) {
            if ((int) $person['id'] === $id) {
                return $index;
            }
        }

        return null;
    }

    private function save(): void
    {
        $this->fileManager->writeData($this->persons);
    }
}
