<?php

require_once __DIR__ . '/../dto/PersonDTO.php';

class FileManager
{
    private string $filePath;

    public function __construct()
    {
        $this->filePath = __DIR__ . '/../data/persons.json';
        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, json_encode([]));
        }
    }

    /* Lee el archivo JSON y devuelve un arreglo. */
    private function readFile(): array
    {
        $content = file_get_contents($this->filePath);
        $persons = json_decode($content, true);
        return is_array($persons) ? $persons : [];
    }

    /* Escribe el arreglo en el archivo JSON. */
    private function writeFile(array $persons): void
    {
        file_put_contents(
            $this->filePath,
            json_encode(
                $persons,
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
            )
        );
    }

    /* Obtiene todas las personas. */
    public function getAll(): array
    {
        return $this->readFile();
    }

    /* Obtiene una persona por ID. */
    public function getById(int $id): ?array
    {
        $persons = $this->readFile();
        foreach ($persons as $person) {
            if ($person['id'] === $id) {
                return $person;
            }
        }
        return null;
    }

    /* Genera el siguiente ID disponible. */
    public function generateId(): int
    {
        $persons = $this->readFile();
        if (empty($persons)) {
            return 1;
        }
        $ids = array_column($persons, 'id');
        return max($ids) + 1;
    }

    /* Guarda una nueva persona. */
    public function create(PersonDTO $person): array
    {
        $persons = $this->readFile();
        $persons[] = $person->toArray();
        $this->writeFile($persons);
        return $person->toArray();
    }

    /* Actualiza una persona. */
    public function update(PersonDTO $person): ?array
    {
        $persons = $this->readFile();
        foreach ($persons as $index => $currentPerson) {
            if ($currentPerson['id'] === $person->getId()) {
                $persons[$index] = $person->toArray();
                $this->writeFile($persons);
                return $persons[$index];
            }
        }
        return null;
    }

    /* Elimina una persona. */
    public function delete(int $id): bool
    {
        $persons = $this->readFile();
        foreach ($persons as $index => $person) {
            if ($person['id'] === $id) {
                unset($persons[$index]);
                $persons = array_values($persons);
                $this->writeFile($persons);
                return true;
            }
        }
        return false;
    }

    /* Verifica si un correo ya existe. */
    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $persons = $this->readFile();
        foreach ($persons as $person) {
            if (
                strtolower($person['email']) === strtolower($email)
                && $person['id'] !== $excludeId
            ) {
                return true;
            }
        }
        return false;
    }
}