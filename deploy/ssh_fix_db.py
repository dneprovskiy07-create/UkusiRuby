import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # Check PM2 current status - is it running or crashing?
    ("PM2 LIST", "pm2 list 2>&1"),
    
    # Error log tail
    ("PM2 ERROR LOG", "pm2 logs ukusiruby-backend --nostream --err --lines 15 2>&1"),
    
    # Test DB connection directly
    ("TEST DB CONN", "PGPASSWORD='UkusiSecure2026!' psql -U ukusi_user -h localhost -d ukusiruby_db -c 'SELECT 1;' 2>&1"),
    
    # Check .env content
    ("ENV CONTENT", "cat /var/www/ukusiruby/back-end/.env"),
    
    # Check what port the app is trying to use
    ("PORT CHECK", "pm2 logs ukusiruby-backend --nostream --lines 5 2>&1"),
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
        if err.strip():
            sys.stdout.buffer.write(f"  ERR: {err.strip()[:300]}\n".encode('utf-8', errors='replace'))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
    
    client.close()
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
