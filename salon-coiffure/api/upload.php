<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Méthode non autorisée', 405);
}

if (!isset($_FILES['file'])) {
    sendError('Aucun fichier');
}

$file = $_FILES['file'];
$allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowed)) {
    sendError('Type non autorisé');
}

if ($file['size'] > 5 * 1024 * 1024) {
    sendError('Fichier trop volumineux');
}

if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0777, true);
}

$filename = uniqid() . '_' . time() . '.' . $ext;
$filepath = UPLOAD_DIR . $filename;

if (move_uploaded_file($file['tmp_name'], $filepath)) {
    sendJSON(['file_url' => UPLOAD_URL . $filename]);
} else {
    sendError('Erreur upload', 500);
}
