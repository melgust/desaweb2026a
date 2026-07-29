<?php

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../controllers/PersonController.php';
require_once __DIR__ . '/../helpers/FileManager.php';

// Initialize the file manager with the data file path
$dataFile = __DIR__ . '/../data/persons.json';
$fileManager = new FileManager($dataFile);

// Create and route the controller
$controller = new PersonController($fileManager);
$controller->route();
?>
