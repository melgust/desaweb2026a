<?php

class oersibaDTO
{
    private int $id;
    private string $name;
    private string $lastName;
    private int $age;
    private string $email;
    private string $birthday;


    public function __construct(
        int $id = 0,
        string $name = '',
        string $lastName = '',
        int $age = 0,
        string $email = '',
        string $birthday = ''
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->lastName = $lastName;
        $this->age = $age;
        $this->email = $email;
        $this->birthday = $birthday;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function getLastName(): string
    {
        return $this->lastName;
    }

    public function setLastName(string $lastName): void
    {
        $this->lastName = $lastName;
    }

    public function getAge(): int
    {
        return $this->age;
    }

    public function setAge(int $age): void
    {
        $this->age = $age;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function getBirthday(): string
    {
        return $this->birthday;
    }

    public function setBirthday(string $birthday): void
    {
        $this->birthday = $birthday;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'lastName' => $this->lastName,
            'age' => $this->age,
            'email' => $this->email,
            'birthday' => $this->birthday,
        ];
    }
    public static function fromArray(array $data): self
    {
        return new self(
            $data['id'] ?? 0,
            $data['name'] ?? '',
            $data['lastName'] ?? '',
            $data['age'] ?? 0,
            $data['email'] ?? '',
            $data['birthday'] ?? ''
        );
    }

}