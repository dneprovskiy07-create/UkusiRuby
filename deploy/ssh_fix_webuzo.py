import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # 1. Check what's on port 443
    ("CHECK PORT 443", "ss -tlnp | grep ':443 ' || echo 'Port 443 is free'"),

    # 2. Kill anything on 443 that isn't nginx
    ("KILL NON-NGINX ON 443", "fuser -k 443/tcp 2>&1; echo 'Done'"),

    # 3. Wait
    ("WAIT", "sleep 1 && echo 'waited'"),

    # 4. Restart nginx cleanly
    ("RESTART NGINX", "systemctl restart nginx 2>&1; echo 'exit: '$?"),

    # 5. Check both ports
    ("CHECK PORTS", "ss -tlnp | grep -E ':80 |:443 '"),

    # 6. Test HTTPS
    ("HTTPS TEST", "curl -sk -o /dev/null -w 'HTTP %{http_code}' https://localhost/ 2>&1"),

    # 7. Test HTTPS API
    ("HTTPS API TEST", "curl -sk -o /dev/null -w 'HTTP %{http_code}' https://localhost/api/settings/cities 2>&1"),

    # 8. Test HTTP (should redirect)
    ("HTTP TEST", "curl -s -o /dev/null -w 'HTTP %{http_code}' http://localhost/ 2>&1"),

    # 9. Check nginx status
    ("NGINX STATUS", "systemctl status nginx 2>&1 | head -10"),
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
