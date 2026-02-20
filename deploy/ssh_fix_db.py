import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

jwt_secret = '17ae664b43a6d757c80c58c1aaf39bc8df64530ca40d90a36aeafcc4ac7ef706'

commands = [
    # Switch to production
    ("SET PROD ECO", "sed -i \"s/NODE_ENV: 'development'/NODE_ENV: 'production'/\" /var/www/ukusiruby/deploy/ecosystem.config.js"),
    ("SET PROD ENV", f"""cat > /var/www/ukusiruby/back-end/.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=ukusi_user
DB_PASSWORD=UkusiSecure2026!
DB_NAME=ukusiruby_db
APP_PORT=3000
JWT_SECRET={jwt_secret}
NODE_ENV=production
EOF"""),
    
    # Restart in production
    ("RESTART", "pm2 restart ukusiruby-backend --update-env 2>&1 | tail -3"),
    ("WAIT", "sleep 8"),
    
    # === SECURITY VERIFICATION ===
    ("SEC: .env blocked", "curl -s -o /dev/null -w '%{http_code}' http://localhost/.env"),
    ("SEC: .git blocked", "curl -s -o /dev/null -w '%{http_code}' http://localhost/.git/config"),
    ("SEC: headers", "curl -sI http://localhost/ | grep -i 'x-frame\\|x-content\\|x-xss\\|referrer'"),
    
    # === FUNCTIONALITY VERIFICATION ===
    ("API: settings", "curl -s http://localhost/api/settings | head -c 200"),
    ("API: catalog", "curl -s http://localhost/api/catalog/categories | head -c 200"),
    ("ADMIN: panel", "curl -s -o /dev/null -w '%{http_code}' http://localhost/admin/"),
    ("CLIENT: app", "curl -s -o /dev/null -w '%{http_code}' http://localhost/"),
    
    # === INFRASTRUCTURE ===
    ("PM2: status", "pm2 list 2>&1 | grep ukusi"),
    ("PM2: restarts", "pm2 jlist 2>&1 | python3 -c \"import json,sys;d=json.load(sys.stdin);print(f'Restarts: {d[0][\\\"pm2_env\\\"][\\\"restart_time\\\"]}, Status: {d[0][\\\"pm2_env\\\"][\\\"status\\\"]}, Uptime: {d[0][\\\"pm2_env\\\"][\\\"pm_uptime\\\"]}')\" 2>&1"),
    ("PORT: 3000", "ss -tlnp | grep 3000"),
    
    # Verify ecosystem in prod mode
    ("ECO CHECK", "grep NODE_ENV /var/www/ukusiruby/deploy/ecosystem.config.js"),
    ("ENV CHECK", "grep NODE_ENV /var/www/ukusiruby/back-end/.env"),
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    print("=" * 60)
    print("FINAL SECURITY VERIFICATION REPORT")
    print("=" * 60)
    
    for label, cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=15)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        sys.stdout.buffer.write(f"=== {label} ===\n{out.strip()}\n".encode('utf-8', errors='replace'))
        if err.strip():
            sys.stdout.buffer.write(f"  ERR: {err.strip()[:300]}\n".encode('utf-8', errors='replace'))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
    
    client.close()
    sys.stdout.buffer.write(b"\n=== VERIFICATION COMPLETE ===\n")
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
