<?php

class PersonDTO
{
    private int $id;
    private string $name;
    private string $birthday;
    private string $email;

    public function __construct(
        ?int $id = null,
        string $name = '',
        string $birthday = '',
        string $email = ''
    ) {
        $this->id = $id ?? 0;
        $this->name = $name;
        $this->birthday = $birthday;
        $this->email = $email;
    }

    /**
     * Get the ID
     */
    public function getId(): int
    {
        return $this->id;
    }

    /**
     * Set the ID
     */
    public function setId(int $id): self
    {
        $this->id = $id;
        return $this;
    }

    /**
     * Get the name
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * Set the name
     */
    public function setName(string $name): self
    {
        $this->name = $name;
        return $this;
    }

    /**
     * Get the birthday
     */
    public function getBirthday(): string
    {
        return $this->birthday;
    }

    /**
     * Set the birthday
     */
    public function setBirthday(string $birthday): self
    {
        $this->birthday = $birthday;
        return $this;
    }

    /**
     * Get the email
     */
    public function getEmail(): string
    {
        return $this->email;
    }

    /**
     * Set the email
     */
    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }

    /**
     * Convert the DTO to an associative array
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'birthday' => $this->birthday,
            'email' => $this->email,
        ];
    }
}
?>
