CREATE DATABASE IF NOT EXISTS salon_coiffure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE salon_coiffure;

CREATE TABLE prestations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    duree INT NOT NULL DEFAULT 30,
    prix DECIMAL(10,2) NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    image_url TEXT,
    populaire BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE coiffeurs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    specialite VARCHAR(255) NOT NULL,
    photo_url TEXT,
    bio TEXT,
    actif BOOLEAN DEFAULT TRUE,
    ordre INT DEFAULT 0,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE rendezvous (
    id INT AUTO_INCREMENT PRIMARY KEY,
    client_nom VARCHAR(255) NOT NULL,
    client_prenom VARCHAR(255) NOT NULL,
    client_tel VARCHAR(50) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    heure TIME NOT NULL,
    prestation_id INT NOT NULL,
    prestation_nom VARCHAR(255) NOT NULL,
    coiffeur_id INT,
    coiffeur_nom VARCHAR(255),
    statut ENUM('en_attente', 'confirme', 'termine', 'annule') DEFAULT 'en_attente',
    commentaire TEXT,
    prix DECIMAL(10,2),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_coiffeur (coiffeur_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE avis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    note INT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire TEXT NOT NULL,
    valide BOOLEAN DEFAULT FALSE,
    date_avis DATE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE galerie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    categorie VARCHAR(100) NOT NULL,
    description TEXT,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE horaires (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jour ENUM('Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche') NOT NULL UNIQUE,
    heure_ouverture TIME,
    heure_fermeture TIME,
    ferme BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE configuration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cle VARCHAR(100) NOT NULL UNIQUE,
    valeur TEXT,
    categorie VARCHAR(50),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role ENUM('admin', 'user') DEFAULT 'user',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Données initiales
INSERT INTO horaires (jour, heure_ouverture, heure_fermeture, ferme) VALUES
('Lundi', '09:00', '19:00', FALSE),
('Mardi', '09:00', '19:00', FALSE),
('Mercredi', '09:00', '19:00', FALSE),
('Jeudi', '09:00', '19:00', FALSE),
('Vendredi', '09:00', '19:00', FALSE),
('Samedi', '09:00', '18:00', FALSE),
('Dimanche', NULL, NULL, TRUE);

INSERT INTO configuration (cle, valeur, categorie) VALUES
('salon_nom', 'Le Salon Chic', 'general'),
('salon_slogan', 'L''art de la coiffure', 'general'),
('telephone', '01 23 45 67 89', 'contact'),
('email', 'contact@lesalon.fr', 'contact'),
('adresse', '123 Rue de la Beauté, 75001 Paris', 'contact'),
('couleur_primaire', '#b45309', 'style'),
('couleur_secondaire', '#d97706', 'style'),
('couleur_accent', '#f59e0b', 'style'),
('temps_espacement', '15', 'general');

-- Admin par défaut (mot de passe: admin123)
INSERT INTO users (email, password, full_name, role) VALUES
('admin@lesalon.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur', 'admin');

-- Données d'exemple
INSERT INTO prestations (nom, description, duree, prix, categorie, populaire) VALUES
('Coupe Homme', 'Coupe classique avec shampoing', 30, 25.00, 'Homme', TRUE),
('Coupe Femme', 'Coupe avec shampoing et brushing', 45, 45.00, 'Femme', TRUE),
('Coloration', 'Coloration complète avec soin', 90, 80.00, 'Couleur', TRUE),
('Brushing', 'Brushing professionnel', 40, 30.00, 'Femme', FALSE),
('Barbe', 'Taille et soin de la barbe', 20, 20.00, 'Barbe', TRUE),
('Coupe Enfant', 'Coupe pour les moins de 12 ans', 20, 15.00, 'Enfant', FALSE);

INSERT INTO coiffeurs (nom, specialite, actif, ordre, bio) VALUES
('Sophie Martin', 'Coupes Femmes & Couleur', TRUE, 1, 'Experte en coloration avec 10 ans d''expérience'),
('Benoît Dubois', 'Coupes Hommes & Barbe', TRUE, 2, 'Spécialiste des coupes modernes et traditionnelles'),
('Marie Laurent', 'Spécialiste Coloration', TRUE, 3, 'Formée aux dernières techniques de coloration');
