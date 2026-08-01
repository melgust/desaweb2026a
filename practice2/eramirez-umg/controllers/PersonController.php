<?php

require_once __DIR__ . "/../dto/PersonDTO.php";
require_once __DIR__ . "/../helpers/FileManager.php";

class PersonController
{
    private FileManager $fileManager;

    public function __construct()
    {
        $filePath = __DIR__ . "/../data/persons.json";
        $this->fileManager = new FileManager($filePath);
    }

    public function getAll(): void
    {
        $persons = $this->fileManager->read();

        http_response_code(200);
        echo json_encode($persons, JSON_UNESCAPED_UNICODE);
    }

    public function getById(int $id): void
    {
        $persons = $this->fileManager->read();

        foreach ($persons as $person) {
            if ((int) $person["id"] === $id) {
                http_response_code(200);
                echo json_encode($person, JSON_UNESCAPED_UNICODE);
                return;
            }
        }

        $this->response(["message" => "Person not found"], 404);
    }

    public function create(array $data): void
    {
        $validation = $this->validate($data);

        if ($validation !== true) {
            $this->response(["message" => $validation], 400);
            return;
        }

        $persons = $this->fileManager->read();

        if ($this->emailExists($persons, $data["email"])) {
            $this->response(["message" => "Email already exists"], 400);
            return;
        }

        $newId = $this->generateId($persons);

        $person = new PersonDTO(
            $newId,
            trim($data["name"]),
            $data["birthday"],
            trim($data["email"])
        );

        $persons[] = $person->toArray();

        if (!$this->fileManager->write($persons)) {
            $this->response(["message" => "Could not save person"], 500);
            return;
        }

        $this->response($person->toArray(), 201);
    }

    public function update(int $id, array $data): void
    {
        $validation = $this->validate($data);

        if ($validation !== true) {
            $this->response(["message" => $validation], 400);
            return;
        }

        $persons = $this->fileManager->read();
        $found = false;

        foreach ($persons as $index => $person) {
            if ((int) $person["id"] === $id) {
                if ($this->emailExists($persons, $data["email"], $id)) {
                    $this->response(
                        ["message" => "Email already exists"],
                        400
                    );
                    return;
                }

                $personDTO = new PersonDTO(
                    $id,
                    trim($data["name"]),
                    $data["birthday"],
                    trim($data["email"])
                );

                $persons[$index] = $personDTO->toArray();
                $found = true;
                break;
            }
        }

        if (!$found) {
            $this->response(["message" => "Person not found"], 404);
            return;
        }

        if (!$this->fileManager->write($persons)) {
            $this->response(["message" => "Could not update person"], 500);
            return;
        }

        $this->response($persons[$index], 200);
    }

    public function delete(int $id): void
    {
        $persons = $this->fileManager->read();
        $found = false;

        foreach ($persons as $index => $person) {
            if ((int) $person["id"] === $id) {
                unset($persons[$index]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            $this->response(["message" => "Person not found"], 404);
            return;
        }

        $persons = array_values($persons);

        if (!$this->fileManager->write($persons)) {
            $this->response(["message" => "Could not delete person"], 500);
            return;
        }

        $this->response(["message" => "Person deleted"], 200);
    }

    public function getAge(int $id): void
    {
        $persons = $this->fileManager->read();

        foreach ($persons as $person) {
            if ((int) $person["id"] === $id) {
                $birthday = new DateTime($person["birthday"]);
                $today = new DateTime();
                $age = $today->diff($birthday)->y;

                $this->response([
                    "id" => $person["id"],
                    "name" => $person["name"],
                    "age" => $age
                ], 200);

                return;
            }
        }

        $this->response(["message" => "Person not found"], 404);
    }

    private function validate(array $data): true|string
    {
        if (
            !isset($data["name"]) ||
            !isset($data["birthday"]) ||
            !isset($data["email"])
        ) {
            return "All fields are required";
        }

        if (trim($data["name"]) === "") {
            return "Name cannot be empty";
        }

        if (!filter_var($data["email"], FILTER_VALIDATE_EMAIL)) {
            return "Invalid email format";
        }

        if (!$this->isValidDate($data["birthday"])) {
            return "Birthday must use YYYY-MM-DD format";
        }

        $birthday = new DateTime($data["birthday"]);
        $today = new DateTime("today");

        if ($birthday > $today) {
            return "Birthday cannot be a future date";
        }

        return true;
    }

    private function isValidDate(string $date): bool
    {
        $dateObject = DateTime::createFromFormat("Y-m-d", $date);

        return $dateObject !== false &&
            $dateObject->format("Y-m-d") === $date;
    }

    private function emailExists(
        array $persons,
        string $email,
        ?int $excludedId = null
    ): bool {
        foreach ($persons as $person) {
            if (
                strtolower($person["email"]) === strtolower($email) &&
                (int) $person["id"] !== $excludedId
            ) {
                return true;
            }
        }

        return false;
    }

    private function generateId(array $persons): int
    {
        if (empty($persons)) {
            return 1;
        }

        $ids = array_column($persons, "id");

        return max($ids) + 1;
    }

    private function response(array $data, int $statusCode): void
    {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}