<?php
declare(strict_types=1);

require_once __DIR__ . '/../services/PersonService.php';

class PersonController
{
    private PersonService $service;

    public function __construct(string $filePath)
    {
        $this->service = new PersonService($filePath);
    }

    public function createPerson(array $data): array
    {
        return $this->service->createPerson($data);
    }

    public function getAllPersons(): array
    {
        return $this->service->getAllPersons();
    }

    public function getPerson(int $id): ?array
    {
        return $this->service->getPerson($id);
    }

    public function updatePerson(int $id, array $data): array
    {
        return $this->service->updatePerson($id, $data);
    }

    public function deletePerson(int $id): void
    {
        $this->service->deletePerson($id);
    }

    public function getPersonAge(int $id): array
    {
        return $this->service->getPersonAge($id);
    }
}
