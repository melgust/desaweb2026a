<?php

declare(strict_types=1);

final class FileManager
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;

        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, '[]');
        }
    }

    public function read(): array
    {
        $content = file_get_contents($this->filePath);

        if ($content === false || trim($content) === '') {
            return [];
        }

        $data = json_decode($content, true);

        if (!is_array($data)) {
            return [];
        }

        return $data;
    }

    public function write(array $persons): bool
    {
        $json = json_encode(
            array_values($persons),
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );

        if ($json === false) {
            return false;
        }

        return file_put_contents(
            $this->filePath,
            $json,
            LOCK_EX
        ) !== false;
    }
}