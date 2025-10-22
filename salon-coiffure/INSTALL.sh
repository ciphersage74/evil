#!/bin/bash

set -e

echo "🚀 Installation du Salon de Coiffure"
echo "===================================="

if [ "$EUID" -ne 0 ]; then
    echo "❌ Ce script doit être exécuté en tant que root"
    echo "Utilisez: sudo bash INSTALL.sh"
    exit 1
fi

echo "📦 Installation des dépendances..."
apt update
apt install -y apache2 mysql-server php php-mysql php-mbstring php-json php-curl

echo "🗄️ Configuration MySQL..."
read -p "Entrez le mot de passe MySQL pour 'salon_user': " mysql_pass

mysql -u root -p <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS salon_coiffure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'salon_user'@'localhost' IDENTIFIED BY '$mysql_pass';
GRANT ALL PRIVILEGES ON salon_coiffure.* TO 'salon_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo "📂 Copie des fichiers..."
cp -r . /var/www/salon-coiffure
cd /var/www/salon-coiffure

echo "🔧 Configuration..."
sed -i "s/define('DB_PASS', '');/define('DB_PASS', '$mysql_pass');/" api/config.php

echo "🗄️ Import de la base de données..."
mysql -u salon_user -p"$mysql_pass" salon_coiffure < database/schema.sql

echo "🔑 Configuration des permissions..."
chown -R www-data:www-data /var/www/salon-coiffure
chmod -R 755 /var/www/salon-coiffure
chmod -R 777 /var/www/salon-coiffure/public/uploads

echo "🌐 Configuration Apache..."
a2enmod rewrite

cat <<'APACHE_CONF' > /etc/apache2/sites-available/salon.conf
<VirtualHost *:80>
    ServerName localhost
    DocumentRoot /var/www/salon-coiffure

    <Directory /var/www/salon-coiffure>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/salon_error.log
    CustomLog \${APACHE_LOG_DIR}/salon_access.log combined
</VirtualHost>
APACHE_CONF

a2dissite 000-default.conf
a2ensite salon.conf
systemctl restart apache2

echo ""
echo "✅ Installation terminée !"
echo "=========================="
echo "🌐 Accédez à: http://localhost"
echo "🔐 Admin: admin@lesalon.fr / admin123"
echo "📖 Lisez README.md pour plus d'infos"
echo ""
