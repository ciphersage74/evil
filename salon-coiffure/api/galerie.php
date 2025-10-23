<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM galerie ORDER BY created_date DESC");
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("
            INSERT INTO galerie (titre, image_url, categorie, description)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['titre'],
            $data['image_url'],
            $data['categorie'],
            $data['description'] ?? null
        ]);
        sendJSON(['id' => $db->lastInsertId()], 201);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        $stmt = $db->prepare("DELETE FROM galerie WHERE id=?");
        $stmt->execute([$id]);
        sendJSON(['message' => 'Supprimé']);
        break;
}
