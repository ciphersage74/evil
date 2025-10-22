<?php
require_once 'database.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            $stmt = $db->prepare("SELECT * FROM rendezvous WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            sendJSON($stmt->fetch());
        } else {
            $stmt = $db->query("SELECT * FROM rendezvous ORDER BY date DESC, heure DESC");
            sendJSON($stmt->fetchAll());
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Vérifier disponibilité
        $stmt = $db->prepare("
            SELECT COUNT(*) as count FROM rendezvous 
            WHERE date = ? AND heure = ? AND coiffeur_id = ? AND statut != 'annule'
        ");
        $stmt->execute([
            $data['date'],
            $data['heure'],
            $data['coiffeur_id'] ?? ''
        ]);
        
        if ($stmt->fetch()['count'] > 0 && !empty($data['coiffeur_id'])) {
            sendError('Créneau déjà réservé', 409);
        }
        
        $stmt = $db->prepare("
            INSERT INTO rendezvous 
            (client_nom, client_prenom, client_tel, client_email, date, heure, 
             prestation_id, prestation_nom, coiffeur_id, coiffeur_nom, statut, commentaire, prix)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['client_nom'],
            $data['client_prenom'],
            $data['client_tel'],
            $data['client_email'],
            $data['date'],
            $data['heure'],
            $data['prestation_id'],
            $data['prestation_nom'],
            $data['coiffeur_id'] ?? null,
            $data['coiffeur_nom'] ?? null,
            $data['statut'] ?? 'en_attente',
            $data['commentaire'] ?? null,
            $data['prix']
        ]);
        
        // Email de confirmation
        $to = $data['client_email'];
        $subject = "Confirmation de rendez-vous - Le Salon Chic";
        $message = "Bonjour {$data['client_prenom']} {$data['client_nom']},\n\n";
        $message .= "Votre rendez-vous a été confirmé :\n\n";
        $message .= "Date : {$data['date']}\n";
        $message .= "Heure : {$data['heure']}\n";
        $message .= "Prestation : {$data['prestation_nom']}\n";
        $message .= "Prix : {$data['prix']}€\n\n";
        $message .= "À bientôt !\nL'équipe du Salon Chic";
        
        $headers = "From: noreply@lesalon.fr\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        mail($to, $subject, $message, $headers);
        
        sendJSON(['id' => $db->lastInsertId(), 'message' => 'Rendez-vous créé'], 201);
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $_GET['id'] ?? null;
        
        $stmt = $db->prepare("UPDATE rendezvous SET statut=? WHERE id=?");
        $stmt->execute([$data['statut'], $id]);
        sendJSON(['message' => 'Mis à jour']);
        break;

    case 'DELETE':
        $id = $_GET['id'] ?? null;
        $stmt = $db->prepare("DELETE FROM rendezvous WHERE id=?");
        $stmt->execute([$id]);
        sendJSON(['message' => 'Supprimé']);
        break;
}
