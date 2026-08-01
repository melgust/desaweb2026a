<?php

class FileManager
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
    }

    public function read(): array
    {
        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, json_encode([]));
            return [];
        }

        $content = file_get_contents($this->filePath);

        if ($content === false || trim($content) === "") {
            return [];
        }

        $data = json_decode($content, true);

        return is_array($data) ? $data : [];
    }

    public function write(array $data): bool
    {
        $json = json_encode(
            $data,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );

        return file_put_contents($this->filePath, $json) !== false;
    }
}