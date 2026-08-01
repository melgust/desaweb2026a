<?php

declare(strict_types=1);

class PersonDTO
{
    private int $id;
    private string $name;
    private string $birthday;
    private string $email;

    public function __construct(
        int $id,
        string $name,
        string $birthday,
        string $email
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->birthday = $birthday;
        $this->email = $email;
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getBirthday(): string
    {
        return $this->birthday;
    }

    public function getEmail(): string
    {
        return $this->email;
    }

    public function setName(string $name): void
    {
        $this->name = $name;
    }

    public function setBirthday(string $birthday): void
    {
        $this->birthday = $birthday;
    }

    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'birthday' => $this->birthday,
            'email' => $this->email
        ];
    }
}
