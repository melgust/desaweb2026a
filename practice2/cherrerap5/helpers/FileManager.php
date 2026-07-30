<?php

class FileManager
{
    private string $file;

    public function __construct(string $file)
    {
        $this->file = $file;
        if (!file_exists($file)) {
            $dir = dirname($file);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            file_put_contents($file, '[]');
        }
    }

    public function read(): array
    {
        $content = file_get_contents($this->file);
        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

    public function save(array $data): void
    {
        file_put_contents($this->file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function findById(int $id): ?array
    {
        foreach ($this->read() as $person) {
            if ($person['id'] === $id) {
                return $person;
            }
        }
        return null;
    }

    public function findByEmail(string $email): ?array
    {
        foreach ($this->read() as $person) {
            if ($person['email'] === $email) {
                return $person;
            }
        }
        return null;
    }

    public function nextId(): int
    {
        $persons = $this->read();
        return empty($persons) ? 1 : max(array_column($persons, 'id')) + 1;
    }

    public function add(array $data): array
    {
        $persons = $this->read();
        $data['id'] = $this->nextId();
        $persons[] = $data;
        $this->save($persons);
        return $data;
    }

    public function updateById(int $id, array $data): ?array
    {
        $persons = $this->read();
        foreach ($persons as &$person) {
            if ($person['id'] === $id) {
                foreach ($data as $key => $value) {
                    if (in_array($key, ['name', 'birthday', 'email'])) {
                        $person[$key] = $value;
                    }
                }
                $this->save($persons);
                return $person;
            }
        }
        return null;
    }

    public function removeById(int $id): bool
    {
        $persons = $this->read();
        $count = count($persons);
        $persons = array_filter($persons, fn($p) => $p['id'] !== $id);
        
        if (count($persons) < $count) {
            $this->save(array_values($persons));
            return true;
        }
        return false;
    }
}
