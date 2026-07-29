<?php

class FileManager
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
        
        // Create the file if it doesn't exist
        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, json_encode([]));
        }
    }

    /**
     * Read all persons from the JSON file
     */
    public function read(): array
    {
        $content = file_get_contents($this->filePath);
        $data = json_decode($content, true);
        
        return $data === null ? [] : $data;
    }

    /**
     * Write persons to the JSON file
     */
    public function write(array $data): bool
    {
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return file_put_contents($this->filePath, $json) !== false;
    }

    /**
     * Find a person by ID
     */
    public function findById(int $id): ?array
    {
        $persons = $this->read();
        
        foreach ($persons as $person) {
            if ($person['id'] === $id) {
                return $person;
            }
        }
        
        return null;
    }

    /**
     * Find a person by email
     */
    public function findByEmail(string $email): ?array
    {
        $persons = $this->read();
        
        foreach ($persons as $person) {
            if ($person['email'] === $email) {
                return $person;
            }
        }
        
        return null;
    }

    /**
     * Get the next ID for a new person
     */
    public function getNextId(): int
    {
        $persons = $this->read();
        
        if (empty($persons)) {
            return 1;
        }
        
        $maxId = max(array_column($persons, 'id'));
        return $maxId + 1;
    }

    /**
     * Add a new person
     */
    public function create(array $personData): array
    {
        $persons = $this->read();
        $personData['id'] = $this->getNextId();
        $persons[] = $personData;
        
        $this->write($persons);
        return $personData;
    }

    /**
     * Update a person by ID
     */
    public function update(int $id, array $updateData): ?array
    {
        $persons = $this->read();
        
        foreach ($persons as &$person) {
            if ($person['id'] === $id) {
                // Update only the allowed fields
                if (isset($updateData['name'])) {
                    $person['name'] = $updateData['name'];
                }
                if (isset($updateData['birthday'])) {
                    $person['birthday'] = $updateData['birthday'];
                }
                if (isset($updateData['email'])) {
                    $person['email'] = $updateData['email'];
                }
                
                $this->write($persons);
                return $person;
            }
        }
        
        return null;
    }

    /**
     * Delete a person by ID
     */
    public function delete(int $id): bool
    {
        $persons = $this->read();
        $personsFiltered = array_filter($persons, function ($person) use ($id) {
            return $person['id'] !== $id;
        });
        
        // Re-index the array
        $personsFiltered = array_values($personsFiltered);
        
        if (count($personsFiltered) < count($persons)) {
            $this->write($personsFiltered);
            return true;
        }
        
        return false;
    }
}
?>
