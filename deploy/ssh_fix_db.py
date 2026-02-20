import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # Check banner table columns
    ("BANNER COLS", "sudo -u postgres psql -d ukusiruby_db -c '\\d banners' 2>&1"),
    
    # Insert banners with correct columns
    ("INSERT BANNERS", """sudo -u postgres psql -d ukusiruby_db -c "
INSERT INTO banners (image_url, sort_order, is_active) VALUES
('https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=300&fit=crop', 1, true),
('https://images.unsplash.com/photo-1563612116625-3012372fccce?w=800&h=300&fit=crop', 2, true),
('https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=800&h=300&fit=crop', 3, true);
" 2>&1"""),

    # Verify
    ("VERIFY BANNERS", "sudo -u postgres psql -d ukusiruby_db -c 'SELECT id, sort_order, is_active FROM banners;' 2>&1"),
    
    # Final API test
    ("API: banners", "curl -s http://localhost:3000/api/banners | head -c 300"),
]

try:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=password, timeout=10)
    
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
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
