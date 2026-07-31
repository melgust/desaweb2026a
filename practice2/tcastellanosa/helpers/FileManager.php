<?php

class FileManager {
    private $filePath;

    public function __construct($filePath) {
        $this->filePath = $filePath;
        $this->initializeFile();
    }

    private function initializeFile() {
        if (!file_exists($this->filePath)) {
            file_put_contents($this->filePath, json_encode([]));
        }
    }

    public function readAll() {
        $content = file_get_contents($this->filePath);
        return json_decode($content, true) ?? [];
    }

    public function writeAll($data) {
        file_put_contents($this->filePath, json_encode($data, JSON_PRETTY_PRINT));
    }

    public function findById($id) {
        $data = $this->readAll();
        foreach ($data as $person) {
            if ($person['id'] == $id) {
                return $person;
            }
        }
        return null;
    }

    public function save($personData) {
        $data = $this->readAll();
        $data[] = $personData;
        $this->writeAll($data);
        return $personData;
    }

    public function update($id, $updatedData) {
        $data = $this->readAll();
        foreach ($data as $key => $person) {
            if ($person['id'] == $id) {
                $data[$key] = array_merge($person, $updatedData);
                $this->writeAll($data);
                return $data[$key];
            }
        }
        return null;
    }

    public function delete($id) {
        $data = $this->readAll();
        foreach ($data as $key => $person) {
            if ($person['id'] == $id) {
                unset($data[$key]);
                $this->writeAll(array_values($data));
                return true;
            }
        }
        return false;
    }
}