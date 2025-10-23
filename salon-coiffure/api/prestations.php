<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM prestations WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $result = $stmt->fetch();
            sendJSON($result ?: ['error' => 'Non trouvé'], $result ? 200 : 404);
        } else {
            $where = "";
            $params = [];
            
            if (isset($_GET['populaire'])) {
                $where = "WHERE populaire = ?";
                $params[] = $_GET['populaire'] === 'true' ? 1 : 0;
            }
            
            $orderBy = $_GET['orderBy'] ?? 'nom';
            $stmt = $db->prepare("SELECT * FROM prestations $where ORDER BY $orderBy");
            $stmt->execute($params);
            sendJSON($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $stmt = $db->prepare("
            INSERT INTO prestations (nom, description, duree, prix, categorie, image_url, populaire)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['nom'],
            $data['description'] ?? null,
            $data['duree'],
            $data['prix'],
            $data['categorie'],
            $data['image_url'] ?? null,
            $data['populaire'] ?? false
        ]);
        sendJSON(['id' => $db->lastInsertId()], 201);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        if (!$id) sendError('ID manquant');
        
        $stmt = $db->prepare("
            UPDATE prestations 
            SET nom=?, description=?, duree=?, prix=?, categorie=?, image_url=?, populaire=?
            WHERE id=?
        ");
        $stmt->execute([
            $data['nom'],
            $data['description'],
            $data['duree'],
            $data['prix'],
            $data['categorie'],
            $data['image_url'],
            $data['populaire'] ?? false,
            $id
        ]);
        sendJSON(['message' => 'Mis à jour']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID manquant');
        
        $stmt = $db->prepare("DELETE FROM prestations WHERE id=?");
        $stmt->execute([$id]);
        sendJSON(['message' => 'Supprimé']);
        break;
}
