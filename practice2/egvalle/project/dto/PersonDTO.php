<?php

class PersonDTO
{
    private ?int $id;
    private string $name;
    private string $birthday;
    private string $email;

    /* Constructor */
    public function __construct(
        ?int $id,
        string $name,
        string $birthday,
        string $email
    ) {
        $this->id = $id;
        $this->name = $name;
        $this->birthday = $birthday;
        $this->email = $email;
    }

    /* Obtiene el ID */
    public function getId(): ?int
    {
        return $this->id;
    }

    /* Asigna el ID */
    public function setId(int $id): void
    {
        $this->id = $id;
    }

    /* Obtiene el nombre */
    public function getName(): string
    {
        return $this->name;
    }

    /* Asigna el nombre */
    public function setName(string $name): void
    {
        $this->name = $name;
    }

    /* Obtiene la fecha de nacimiento */
    public function getBirthday(): string
    {
        return $this->birthday;
    }

    /* Asigna la fecha de nacimiento */
    public function setBirthday(string $birthday): void
    {
        $this->birthday = $birthday;
    }

    /* Obtiene el correo */
    public function getEmail(): string
    {
        return $this->email;
    }

    /* Asigna el correo */
    public function setEmail(string $email): void
    {
        $this->email = $email;
    }

    /* Convierte el objeto en un array */
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