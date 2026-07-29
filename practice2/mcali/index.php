<?php

header("Content-Type: application/json");

$users = [
    ["id" => 1, "name" => "Alice", "email" => "alice@example.com"],
    ["id" => 2, "name" => "Bob", "email" => "bob@example.com"]
];

$method = $_SERVER["REQUEST_METHOD"];

switch ($method) {

    // GET /index.php
    case "GET":

        if (isset($_GET["id"])) {
            $id = (int) $_GET["id"];

            foreach ($users as $user) {
                if ($user["id"] === $id) {
                    echo json_encode($user);
                    exit;
                }
            }

            http_response_code(404);
            echo json_encode(["message" => "User not found"]);

        } else {
            echo json_encode($users);
        }

        break;

    // POST /index.php
    case "POST":

        $data = json_decode(file_get_contents("php://input"), true);

        $newUser = [
            "id" => count($users) + 1,
            "name" => $data["name"] ?? "",
            "email" => $data["email"] ?? ""
        ];

        http_response_code(201);
        echo json_encode([
            "message" => "User created",
            "user" => $newUser
        ]);

        break;

    // PUT /index.php
    case "PUT":

        $data = json_decode(file_get_contents("php://input"), true);

        echo json_encode([
            "message" => "User updated",
            "user" => $data
        ]);

        break;

    // DELETE /index.php
    case "DELETE":

        $data = json_decode(file_get_contents("php://input"), true);

        echo json_encode([
            "message" => "User deleted",
            "id" => $data["id"] ?? null
        ]);

        break;

    default:

        http_response_code(405);
        echo json_encode([
            "message" => "Method not allowed"
        ]);
}