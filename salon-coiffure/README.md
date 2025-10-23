# 🎨 Salon de Coiffure - Application Complète

## 📦 Installation sur Ubuntu

### 1. Prérequis
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install apache2 mysql-server php php-mysql php-mbstring php-json php-curl unzip -y
```

### 2. Configuration MySQL

```bash
sudo mysql -u root -p
```

Dans MySQL:

```sql
CREATE DATABASE salon_coiffure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'salon_user'@'localhost' IDENTIFIED BY 'VotreMotDePasseSecurise';
GRANT ALL PRIVILEGES ON salon_coiffure.* TO 'salon_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Importer la base:

```bash
mysql -u salon_user -p salon_coiffure < database/schema.sql
```

### 3. Configuration Apache

```bash
sudo cp -r salon-coiffure /var/www/
sudo chown -R www-data:www-data /var/www/salon-coiffure
sudo chmod -R 755 /var/www/salon-coiffure
sudo chmod -R 777 /var/www/salon-coiffure/public/uploads

sudo nano /etc/apache2/sites-available/salon.conf
```

Contenu du fichier:

```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    DocumentRoot /var/www/salon-coiffure
    
    <Directory /var/www/salon-coiffure>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/salon_error.log
    CustomLog ${APACHE_LOG_DIR}/salon_access.log combined
</VirtualHost>
```

Activer:

```bash
sudo a2enmod rewrite
sudo a2ensite salon.conf
sudo systemctl restart apache2
```

### 4. Configuration PHP

Éditez `api/config.php` et mettez vos identifiants MySQL:

```php
define('DB_USER', 'salon_user');
define('DB_PASS', 'VotreMotDePasseSecurise');
```

### 5. SSL (HTTPS)

```bash
sudo apt install certbot python3-certbot-apache -y
sudo certbot --apache -d votre-domaine.com
```

## 🔐 Accès Admin

- URL: `http://votre-domaine.com/admin`
- Email: `admin@lesalon.fr`
- Mot de passe: `admin123`
- ⚠️ CHANGEZ-LE IMMÉDIATEMENT !

## 📁 Structure

```
salon-coiffure/
├── api/              # API PHP
├── database/         # SQL
├── public/uploads/   # Fichiers uploadés
└── frontend/         # React (à ajouter)
```

## ✅ Tests

- API Prestations: `http://votre-domaine.com/api/prestations`
- API Coiffeurs: `http://votre-domaine.com/api/coiffeurs`
- Upload: Testez via formulaire

## 🆘 Support

En cas de problème, vérifiez:

- Les logs Apache: `sudo tail -f /var/log/apache2/error.log`
- Les permissions: `ls -la /var/www/salon-coiffure`
- La connexion MySQL: `mysql -u salon_user -p`
