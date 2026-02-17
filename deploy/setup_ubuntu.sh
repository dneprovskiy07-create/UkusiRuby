#!/bin/bash

# Update and Upgrade
apt update && apt upgrade -y

# Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx
apt install -y nginx

# Install PM2 globally
npm install -g pm2

# Install Certbot for SSL
apt install -y certbot python3-certbot-nginx

# Create project directory
mkdir -p /var/www/ukusiruby/backend
mkdir -p /var/www/ukusiruby/admin
mkdir -p /var/www/ukusiruby/uploads

# Set permissions
chown -R www-data:www-data /var/www/ukusiruby
chmod -R 775 /var/www/ukusiruby

echo "Server setup complete! Node.js $(node -v) installed."
