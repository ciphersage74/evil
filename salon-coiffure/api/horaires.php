<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $db->query("
            SELECT * FROM horaires ORDER BY 
            FIELD(jour, 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche')
        ");
        sendJSON($stmt->fetchAll());
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        $stmt = $db->prepare("
            UPDATE horaires 
            SET heure_ouverture=?, heure_fermeture=?, ferme=?
            WHERE id=?
        ");
        $stmt->execute([
            $data['heure_ouverture'],
            $data['heure_fermeture'],
            $data['ferme'] ?? false,
            $id
        ]);
        sendJSON(['message' => 'Mis à jour']);
        break;
}
