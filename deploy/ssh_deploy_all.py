import paramiko
import sys
import os
import secrets

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

# Generate a secure JWT secret
jwt_secret = secrets.token_hex(32)

# Read local nginx.conf
with open('deploy/nginx.conf', 'r') as f:
    new_nginx = f.read()

commands = [
    # 1. Deploy new Nginx config
    ("DEPLOY NGINX", f"cat > /etc/nginx/sites-available/ukusiruby << 'NGINX_EOF'\n{new_nginx}\nNGINX_EOF"),
    
    # 2. Test Nginx config
    ("TEST NGINX", "nginx -t 2>&1"),
    
    # 3. Reload Nginx
    ("RELOAD NGINX", "systemctl reload nginx 2>&1"),
    
    # 4. Update JWT secret in .env
    ("UPDATE JWT SECRET", f"""cd /var/www/ukusiruby/back-end && cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=ukusi_user
DB_PASSWORD=secure_password
DB_NAME=ukusiruby_db
APP_PORT=3000
JWT_SECRET={jwt_secret}
NODE_ENV=production
EOF"""),
    
    # 5. Update ecosystem config with new JWT secret
    ("UPDATE PM2 CONFIG", f"""cat > /var/www/ukusiruby/deploy/ecosystem.config.js << 'EOF'
module.exports = {{
    apps: [
        {{
            name: 'ukusiruby-backend',
            script: 'dist/main.js',
            cwd: '/var/www/ukusiruby/back-end',
            instances: 2,
            exec_mode: 'cluster',
            autorestart: true,
            watch: false,
            max_memory_restart: '500M',
            env: {{
                NODE_ENV: 'production',
                PORT: 3000,
                DB_HOST: 'localhost',
                DB_PORT: 5432,
                DB_USERNAME: 'ukusi_user',
                DB_PASSWORD: 'secure_password',
                DB_NAME: 'ukusiruby_db',
                JWT_SECRET: '{jwt_secret}',
            }},
        }},
    ],
}};
EOF"""),
    
    # 6. Git stash and pull on server
    ("GIT PULL", "cd /var/www/ukusiruby && git checkout -- . && git pull origin main 2>&1 | tail -5"),
    
    # 7. Install deps and build backend
    ("BUILD BACKEND", "cd /var/www/ukusiruby/back-end && npm install --production=false 2>&1 | tail -3 && npm run build 2>&1 | tail -3"),
    
    # 8. Restart PM2 with new config
    ("RESTART PM2", "cd /var/www/ukusiruby && pm2 delete all 2>&1; pm2 start deploy/ecosystem.config.js 2>&1 | tail -5"),
    
    # 9. Wait and check
    ("WAIT", "sleep 3 && pm2 list 2>&1 | head -10"),
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    for label, cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=120)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        sys.stdout.buffer.write(f"=== {label} ===\n{out.strip()}\n".encode('utf-8', errors='replace'))
        if err.strip() and 'warn' not in err.lower():
            sys.stdout.buffer.write(f"  ERR: {err.strip()[:300]}\n".encode('utf-8', errors='replace'))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
    
    client.close()
    sys.stdout.buffer.write(b"\n=== DEPLOYMENT COMPLETE ===\n")
    sys.stdout.buffer.write(f"JWT Secret: {jwt_secret[:8]}... (stored on server)\n".encode())
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
