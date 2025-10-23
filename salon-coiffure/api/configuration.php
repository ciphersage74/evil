<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $db->query("SELECT * FROM configuration");
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("
            INSERT INTO configuration (cle, valeur, categorie)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE valeur=VALUES(valeur), categorie=VALUES(categorie)
        ");
        $stmt->execute([
            $data['cle'],
            $data['valeur'],
            $data['categorie'] ?? 'general'
        ]);
        sendJSON(['message' => 'Enregistré'], 201);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        $stmt = $db->prepare("UPDATE configuration SET valeur=? WHERE id=?");
        $stmt->execute([$data['valeur'], $id]);
        sendJSON(['message' => 'Mis à jour']);
        break;
}
