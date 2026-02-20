import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # Temporarily set NODE_ENV to development in ecosystem
    ("SET DEV IN ECO", "sed -i \"s/NODE_ENV: 'production'/NODE_ENV: 'development'/\" /var/www/ukusiruby/deploy/ecosystem.config.js"),
    
    # Delete and restart with updated config
    ("RESTART", "pm2 delete all 2>&1; cd /var/www/ukusiruby && pm2 start deploy/ecosystem.config.js 2>&1 | tail -3"),
    
    # Wait for tables to be created
    ("WAIT", "sleep 10"),
    
    # Check tables
    ("TABLES", "sudo -u postgres psql -d ukusiruby_db -c '\\dt' 2>&1"),
    
    # Check API
    ("API TEST", "curl -s http://localhost:3000/api/settings | head -c 150"),
    
    # Check PM2 status
    ("PM2", "pm2 list 2>&1 | grep ukusi"),
    
    # Now set back to production
    ("SET PROD", "sed -i \"s/NODE_ENV: 'development'/NODE_ENV: 'production'/\" /var/www/ukusiruby/deploy/ecosystem.config.js"),
    
    # Restart in production
    ("RESTART PROD", "pm2 delete all 2>&1; cd /var/www/ukusiruby && pm2 start deploy/ecosystem.config.js 2>&1 | tail -3"),
    
    # Wait
    ("WAIT2", "sleep 5"),
    
    # Final test
    ("FINAL", "curl -s http://localhost:3000/api/settings | head -c 150"),
    
    # PM2 final
    ("PM2 FINAL", "pm2 list 2>&1 | grep ukusi"),
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    for label, cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=30)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        sys.stdout.buffer.write(f"=== {label} ===\n{out.strip()}\n".encode('utf-8', errors='replace'))
        if err.strip():
            sys.stdout.buffer.write(f"  ERR: {err.strip()[:300]}\n".encode('utf-8', errors='replace'))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
    
    client.close()
    sys.stdout.buffer.write(b"\n=== DONE ===\n")
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
