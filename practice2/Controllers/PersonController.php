<?php

class PersonController
{
    private $dataFile;

    public function __construct()
    {
        $this->dataFile = __DIR__ . "/../data/persons.json";
    }
    //Graba persona 
    public function grabarPersona()
    {
        $body = file_get_contents('php://input');

        if (trim($body) === '' && defined('STDIN')) {
            $body = stream_get_contents(STDIN);
        }

        if (trim($body) === '') {
            return [
                'success' => false,
                'message' => 'El body está vacío.',
                'errors' => ['body' => 'El cuerpo de la solicitud es obligatorio.'],
                'status' => 400,

            ];
        }
        $decodedBody = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedBody)) {
            return [
                'success' => false,
                'message' => 'El body debe ser un JSON válido.',
                'errors' => ['json' => 'El formato del JSON es inválido.'],
                'status' => 400,
            ];
        }
        $id = trim($decodedBody['id'] ?? '');
        $nombre = trim($decodedBody['nombre'] ?? '');
        $correo = trim($decodedBody['correo'] ?? '');
        $fechaNacimiento = trim($decodedBody['fecha_nacimiento'] ?? $decodedBody['fechaNacimiento'] ?? '');

        $errors = [];
        if ($id === '') {
            $errors['id'] = 'El campo id es obligatorio.';
        }

        if ($nombre === '') {
            $errors['nombre'] = 'El nombre no puede estar vacío.';
        }

        if (!isset($decodedBody['correo']) || !array_key_exists('correo', $decodedBody) || $correo === '') {
            $errors['correo'] = 'El campo correo es obligatorio.';
        } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $errors['correo'] = 'El correo debe tener un formato válido.';
        }
        if (!isset($decodedBody['fecha_nacimiento']) && !isset($decodedBody['fechaNacimiento'])) {
            $errors['fecha_nacimiento'] = 'El campo fecha de nacimiento es obligatorio.';
        } elseif ($fechaNacimiento === '') {
            $errors['fecha_nacimiento'] = 'El campo fecha de nacimiento es obligatorio.';
        } elseif (!$this->validarFechaNacimiento($fechaNacimiento)) {
            $errors['fecha_nacimiento'] = 'La fecha de nacimiento debe tener el formato YYYY-MM-DD y no puede ser una fecha futura.';
        }
        $persons = [];
        $dataDir = dirname($this->dataFile);
        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0777, true);
        }

        if (file_exists($this->dataFile) && filesize($this->dataFile) > 0) {
            $existingContent = file_get_contents($this->dataFile);
            $existingPersons = json_decode($existingContent, true);

            if (is_array($existingPersons)) {
                $persons = $existingPersons;
            }
        }
        foreach ($persons as $person) {
            if (is_array($person)) {
                if (isset($person['id']) && $person['id'] === $id) {
                    $errors['id'] = 'No se permiten IDs duplicados.';
                }

                if (isset($person['correo']) && strtolower(trim($person['correo'])) === strtolower($correo)) {
                    $errors['correo'] = 'No se permiten correos duplicados.';
                }
            }

            if (!empty($errors)) {
                break;
            }
        }
        if (!empty($errors)) {
            return [
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $errors,
                'status' => 422,
            ];
        }

        $dataToSave = [
            'id' => $id,
            'nombre' => $nombre,
            'correo' => $correo,
            'fecha_nacimiento' => $fechaNacimiento,
        ];

        $persons[] = $dataToSave;

        $saved = file_put_contents(
            $this->dataFile,
            json_encode($persons, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            LOCK_EX
        );

        if ($saved === false) {
            return [
                'success' => false,
                'message' => 'No se pudo guardar la persona.',
                'errors' => ['file' => 'No se pudo escribir en el archivo de datos.'],
                'status' => 500,
            ];
        }

        return [
            'success' => true,
            'message' => 'Persona guardada correctamente.',
            'data' => $dataToSave,
            'status' => 201,
        ];
        //Método para obtener datos 
    }
    public function obtenerPersonas()
    {
        $persons = $this->cargarPersonas();

        return [
            'success' => true,
            'data' => $persons,
            'status' => 200,
        ];
    }

    public function obtenerPersonaPorId($id)
    {
        $id = trim((string) $id);

        if ($id === '') {
            return [
                'success' => false,
                'message' => 'El id es obligatorio.',
                'status' => 400,
            ];
        }

        $persons = $this->cargarPersonas();

        foreach ($persons as $person) {
            if (is_array($person) && isset($person['id']) && (string) $person['id'] === $id) {
                return [
                    'success' => true,
                    'data' => $person,
                    'status' => 200,
                ];
            }
        }

        return [
            'success' => false,
            'message' => 'Persona no encontrada.',
            'status' => 404,
        ];
    }

    private function cargarPersonas()
    {
        $persons = [];
        $dataDir = dirname($this->dataFile);

        if (!is_dir($dataDir)) {
            mkdir($dataDir, 0777, true);
        }

        if (file_exists($this->dataFile) && filesize($this->dataFile) > 0) {
            $existingContent = file_get_contents($this->dataFile);
            $existingPersons = json_decode($existingContent, true);

            if (is_array($existingPersons)) {
                $persons = $existingPersons;
            }
        }

        return $persons;
    }
    public function actualizarPersona($id)
    {
        $body = file_get_contents('php://input');

        if (trim($body) === '') {
            return [
                'success' => false,
                'message' => 'El body está vacío.',
                'errors' => ['body' => 'El cuerpo de la solicitud es obligatorio.'],
                'status' => 400,
            ];
        }

        $decodedBody = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decodedBody)) {
            return [
                'success' => false,
                'message' => 'El body debe ser un JSON válido.',
                'errors' => ['json' => 'El formato del JSON es inválido.'],
                'status' => 400,
            ];
        }

        $bodyId = trim($decodedBody['id'] ?? '');
        if ($bodyId !== '' && (string) $bodyId !== (string) $id) {
            return [
                'success' => false,
                'message' => 'El id del body debe coincidir con el id de la URL.',
                'errors' => ['id' => 'El id enviado en el body no coincide con el id de la ruta.'],
                'status' => 400,
            ];
        }

        $nombre = trim($decodedBody['nombre'] ?? '');
        $correo = trim($decodedBody['correo'] ?? '');
        $fechaNacimiento = trim($decodedBody['fecha_nacimiento'] ?? $decodedBody['fechaNacimiento'] ?? '');

        $errors = [];

        if ($nombre === '') {
            $errors['nombre'] = 'El nombre no puede estar vacío.';
        }

        if (!isset($decodedBody['correo']) || !array_key_exists('correo', $decodedBody) || $correo === '') {
            $errors['correo'] = 'El campo correo es obligatorio.';
        } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
            $errors['correo'] = 'El correo debe tener un formato válido.';
        }

        if (!isset($decodedBody['fecha_nacimiento']) && !isset($decodedBody['fechaNacimiento'])) {
            $errors['fecha_nacimiento'] = 'El campo fecha de nacimiento es obligatorio.';
        } elseif ($fechaNacimiento === '') {
            $errors['fecha_nacimiento'] = 'El campo fecha de nacimiento es obligatorio.';
        } elseif (!$this->validarFechaNacimiento($fechaNacimiento)) {
            $errors['fecha_nacimiento'] = 'La fecha de nacimiento debe tener el formato YYYY-MM-DD y no puede ser una fecha futura.';
        }

        $persons = [];
        if (file_exists($this->dataFile) && filesize($this->dataFile) > 0) {
            $existingContent = file_get_contents($this->dataFile);
            $existingPersons = json_decode($existingContent, true);

            if (is_array($existingPersons)) {
                $persons = $existingPersons;
            }
        }

        $found = false;
        foreach ($persons as $person) {
            if (is_array($person) && isset($person['id']) && (string) $person['id'] === (string) $id) {
                $found = true;
                break;
            }
        }

        if (!$found) {
            return [
                'success' => false,
                'message' => 'Persona no encontrada.',
                'status' => 404,
            ];
        }

        foreach ($persons as $person) {
            if (is_array($person) && isset($person['id']) && (string) $person['id'] !== (string) $id) {
                if (isset($person['correo']) && strtolower(trim($person['correo'])) === strtolower($correo)) {
                    $errors['correo'] = 'No se permiten correos duplicados.';
                    break;
                }
            }
        }

        if (!empty($errors)) {
            return [
                'success' => false,
                'message' => 'Datos inválidos.',
                'errors' => $errors,
                'status' => 422,
            ];
        }

        $updatedPerson = [
            'id' => $id,
            'nombre' => $nombre,
            'correo' => $correo,
            'fecha_nacimiento' => $fechaNacimiento,
        ];

        foreach ($persons as $index => $person) {
            if (is_array($person) && isset($person['id']) && (string) $person['id'] === (string) $id) {
                $persons[$index] = $updatedPerson;
                break;
            }
        }

        $saved = file_put_contents($this->dataFile, json_encode($persons, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if ($saved === false) {
            return [
                'success' => false,
                'message' => 'No se pudo actualizar la persona.',
                'errors' => ['file' => 'No se pudo escribir en el archivo de datos.'],
                'status' => 500,
            ];
        }

        return [
            'success' => true,
            'message' => 'Persona actualizada correctamente.',
            'data' => $updatedPerson,
            'status' => 200,
        ];
    }
    public function eliminarPersona($id)
    {
        $persons = [];
        if (file_exists($this->dataFile) && filesize($this->dataFile) > 0) {
            $existingContent = file_get_contents($this->dataFile);
            $existingPersons = json_decode($existingContent, true);

            if (is_array($existingPersons)) {
                $persons = $existingPersons;
            }
        }

        $foundIndex = -1;
        foreach ($persons as $index => $person) {
            if (is_array($person) && isset($person['id']) && (string)$person['id'] === (string)$id) {
                $foundIndex = $index;
                break;
            }
        }

        if ($foundIndex === -1) {
            return [
                'success' => false,
                'message' => 'Persona no encontrada.',
                'status' => 404,
            ];
        }

        unset($persons[$foundIndex]);
        $persons = array_values($persons);

        $saved = file_put_contents($this->dataFile, json_encode($persons, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        if ($saved === false) {
            return [
                'success' => false,
                'message' => 'No se pudo eliminar la persona.',
                'errors' => ['file' => 'No se pudo escribir en el archivo de datos.'],
                'status' => 500,
            ];
        }

        return [
            'success' => true,
            'message' => 'Persona eliminada correctamente.',
            'status' => 200,
        ];
    }

    private function validarFechaNacimiento($fecha)
    {
        $date = DateTime::createFromFormat('Y-m-d', $fecha);
        if ($date === false) {
            return false;
        }

        $date->setTime(0, 0, 0);
        $today = new DateTime('today');

        if ($date > $today) {
            return false;
        }

        return $date->format('Y-m-d') === $fecha;
    }
}