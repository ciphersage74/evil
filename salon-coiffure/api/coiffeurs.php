<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM coiffeurs WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendJSON($stmt->fetch());
        } else {
            $where = "";
            $params = [];
            
            if (isset($_GET['actif'])) {
                $where = "WHERE actif = ?";
                $params[] = $_GET['actif'] === 'true' ? 1 : 0;
            }
            
            $orderBy = $_GET['orderBy'] ?? 'ordre';
            $stmt = $db->prepare("SELECT * FROM coiffeurs $where ORDER BY $orderBy");
            $stmt->execute($params);
            sendJSON($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("
            INSERT INTO coiffeurs (nom, specialite, photo_url, bio, actif, ordre)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['nom'],
            $data['specialite'],
            $data['photo_url'] ?? null,
            $data['bio'] ?? null,
            $data['actif'] ?? true,
            $data['ordre'] ?? 0
        ]);
        sendJSON(['id' => $db->lastInsertId()], 201);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        $stmt = $db->prepare("
            UPDATE coiffeurs 
            SET nom=?, specialite=?, photo_url=?, bio=?, actif=?, ordre=?
            WHERE id=?
        ");
        $stmt->execute([
            $data['nom'],
            $data['specialite'],
            $data['photo_url'],
            $data['bio'],
            $data['actif'] ?? true,
            $data['ordre'],
            $id
        ]);
        sendJSON(['message' => 'Mis à jour']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        $stmt = $db->prepare("DELETE FROM coiffeurs WHERE id=?");
        $stmt->execute([$id]);
        sendJSON(['message' => 'Supprimé']);
        break;
}
