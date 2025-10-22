<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

define('DB_HOST', 'localhost');
define('DB_NAME', 'salon_coiffure');
define('DB_USER', 'root');
define('DB_PASS', ''); // À MODIFIER !
define('UPLOAD_DIR', __DIR__ . '/../public/uploads/');
define('UPLOAD_URL', '/uploads/');

error_reporting(E_ALL);
ini_set('display_errors', 1);

function sendJSON($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError($message, $status = 400) {
    sendJSON(['error' => $message], $status);
}
