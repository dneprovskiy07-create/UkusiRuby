import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # 1. Test .env blocked
    ("SECURITY: .env blocked?", "curl -s -o /dev/null -w '%{http_code}' http://localhost/.env"),
    
    # 2. Test .git blocked
    ("SECURITY: .git blocked?", "curl -s -o /dev/null -w '%{http_code}' http://localhost/.git/config"),
    
    # 3. Check security headers
    ("SECURITY HEADERS", "curl -sI http://localhost/ | grep -i 'x-frame\\|x-content\\|x-xss\\|referrer'"),
    
    # 4. Test API still works
    ("API /settings", "curl -s http://localhost/api/settings | head -c 100"),
    
    # 5. Test /admin/ still works
    ("ADMIN PANEL", "curl -s -o /dev/null -w '%{http_code}' http://localhost/admin/"),
    
    # 6. Test client app
    ("CLIENT APP", "curl -s -o /dev/null -w '%{http_code}' http://localhost/"),
    
    # 7. Check rate limiting works (in headers)
    ("RATE LIMIT HEADERS", "curl -sI http://localhost/api/settings | head -20"),
    
    # 8. Check PM2 cluster
    ("PM2 STATUS", "pm2 list 2>&1 | grep -E 'id|──|ukusi'"),
    
    # 9. Verify new JWT secret
    ("JWT SECRET CHECK", "grep 'JWT_SECRET' /var/www/ukusiruby/back-end/.env | cut -c1-20"),
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    for label, cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=10)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        sys.stdout.buffer.write(f"=== {label} ===\n{out.strip()}\n".encode('utf-8', errors='replace'))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
    
    client.close()
    sys.stdout.buffer.write(b"\n=== VERIFICATION COMPLETE ===\n")
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
