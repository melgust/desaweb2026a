<?php

declare(strict_types=1);

class FileManager
{
    private string $filePath;

    public function __construct(string $filePath)
    {
        $this->filePath = $filePath;
        $this->prepareFile();
    }

    private function prepareFile(): void
    {
        $directory = dirname($this->filePath);

        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, '[]');
        }
    }

    public function read(): array
    {
        $file = fopen($this->filePath, 'r');

        if ($file === false) {
            return [];
        }

        flock($file, LOCK_SH);
        $content = stream_get_contents($file);
        flock($file, LOCK_UN);
        fclose($file);

        $data = json_decode($content ?: '[]', true);

        return is_array($data) ? $data : [];
    }

    public function write(array $data): bool
    {
        $file = fopen($this->filePath, 'c+');

        if ($file === false) {
            return false;
        }

        flock($file, LOCK_EX);
        ftruncate($file, 0);
        rewind($file);

        $json = json_encode(
            $data,
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
        );

        $result = fwrite($file, $json ?: '[]');

        fflush($file);
        flock($file, LOCK_UN);
        fclose($file);

        return $result !== false;
    }
}
