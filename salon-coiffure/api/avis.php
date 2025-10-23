<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $where = "";
        $params = [];
        
        if (isset($_GET['valide'])) {
            $where = "WHERE valide = ?";
            $params[] = $_GET['valide'] === 'true' ? 1 : 0;
        }
        
        $stmt = $db->prepare("SELECT * FROM avis $where ORDER BY created_date DESC");
        $stmt->execute($params);
        sendJSON($stmt->fetchAll());
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("
            INSERT INTO avis (nom, note, commentaire, valide, date_avis)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['nom'],
            $data['note'],
            $data['commentaire'],
            $data['valide'] ?? false,
            $data['date_avis'] ?? date('Y-m-d')
        ]);
        sendJSON(['id' => $db->lastInsertId()], 201);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        $stmt = $db->prepare("UPDATE avis SET valide=? WHERE id=?");
        $stmt->execute([$data['valide'] ?? false, $id]);
        sendJSON(['message' => 'Mis à jour']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        $stmt = $db->prepare("DELETE FROM avis WHERE id=?");
        $stmt->execute([$id]);
        sendJSON(['message' => 'Supprimé']);
        break;
}
