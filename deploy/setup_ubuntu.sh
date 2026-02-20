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
mkdir -p /var/www/ukusiruby/client
mkdir -p /var/www/ukusiruby/uploads

# Get current directory (repo root)
REPO_DIR=$(pwd)

# --- Backend Setup ---
echo "Deploying Backend..."
cp -r $REPO_DIR/back-end/* /var/www/ukusiruby/backend/
cp $REPO_DIR/deploy/ecosystem.config.js /var/www/ukusiruby/backend/

cd /var/www/ukusiruby/backend
npm install
npm run build

# --- Admin Panel Setup ---
echo "Building and Deploying Admin Panel..."
cd $REPO_DIR/admin-panel
npm install
npm run build
cp -r dist/* /var/www/ukusiruby/admin/

# --- Mobile App (Main Client) Setup ---
echo "Building and Deploying Mobile App..."
cd $REPO_DIR/mobile-app
npm install
npm run build
cp -r dist/* /var/www/ukusiruby/client/

# Configure Nginx
cp $REPO_DIR/deploy/nginx.conf /etc/nginx/sites-available/ukusiruby
ln -s /etc/nginx/sites-available/ukusiruby /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx

# Start Backend with PM2
cd /var/www/ukusiruby/backend
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Set permissions
chown -R www-data:www-data /var/www/ukusiruby
chmod -R 775 /var/www/ukusiruby

echo "Server setup complete! Node.js $(node -v) installed."

