import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # Check DNS resolution first
    ("DNS CHECK", "dig +short ukusiruby.com 2>&1"),
    ("DNS CHECK WWW", "dig +short www.ukusiruby.com 2>&1"),
    
    # Install certbot if not installed
    ("INSTALL CERTBOT", "apt-get install -y certbot python3-certbot-nginx 2>&1 | tail -3"),
    
    # Get SSL certificate
    ("SSL CERT", "certbot --nginx -d ukusiruby.com --non-interactive --agree-tos --email support@ukusiruby.com --redirect 2>&1"),
    
    # Verify SSL
    ("VERIFY SSL", "curl -sI https://ukusiruby.com 2>&1 | head -10"),
    
    # Check nginx status
    ("NGINX STATUS", "nginx -t 2>&1"),
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
    for label, cmd in commands:
        stdin, stdout, stderr = client.exec_command(cmd, timeout=60)
        out = stdout.read().decode('utf-8', errors='ignore')
        err = stderr.read().decode('utf-8', errors='ignore')
        sys.stdout.buffer.write(f"=== {label} ===\n{out.strip()}\n".encode('utf-8', errors='replace'))
        if err.strip():
            sys.stdout.buffer.write(f"  {err.strip()[:500]}\n".encode('utf-8', errors='replace'))
        sys.stdout.buffer.write(b"\n")
        sys.stdout.buffer.flush()
    
    client.close()
    sys.stdout.buffer.write(b"\n=== DONE ===\n")
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
