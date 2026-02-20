import paramiko
import sys

host = '45.94.158.17'
user = 'root'
password = 'YSZmhSr018dy89cUK9'

commands = [
    # Get city IDs
    ("CITIES", "sudo -u postgres psql -d ukusiruby_db -c 'SELECT id, name FROM cities;' 2>&1"),
    
    # Assign all categories to city_id=1 (Київ) - the main city
    ("ASSIGN CATEGORIES", "sudo -u postgres psql -d ukusiruby_db -c \"UPDATE categories SET city_id = 1 WHERE city_id IS NULL;\" 2>&1"),
    
    # Assign all products to city_id=1  
    ("ASSIGN PRODUCTS", "sudo -u postgres psql -d ukusiruby_db -c \"UPDATE products SET city_id = 1 WHERE city_id IS NULL;\" 2>&1"),
    
    # Assign all banners to city_id=1
    ("ASSIGN BANNERS", "sudo -u postgres psql -d ukusiruby_db -c \"UPDATE banners SET city_id = 1 WHERE city_id IS NULL;\" 2>&1"),
    
    # Assign all promocodes to city_id=1 (if city_id column exists)
    ("ASSIGN PROMOS", "sudo -u postgres psql -d ukusiruby_db -c \"UPDATE promocodes SET city_id = 1 WHERE city_id IS NULL;\" 2>&1"),

    # Verify
    ("VERIFY CATEGORIES", "curl -s 'http://localhost:3000/api/categories?all=true&city_id=1' | python3 -c \"import sys,json; d=json.load(sys.stdin); print(f'Categories for Kyiv: {len(d)}')\" 2>&1"),
    ("VERIFY PRODUCTS", "curl -s 'http://localhost:3000/api/products?all=true&city_id=1' | python3 -c \"import sys,json; d=json.load(sys.stdin); print(f'Products for Kyiv: {len(d)}')\" 2>&1"),
    ("VERIFY BANNERS", "curl -s 'http://localhost:3000/api/banners/all?city_id=1' | python3 -c \"import sys,json; d=json.load(sys.stdin); print(f'Banners for Kyiv: {len(d)}')\" 2>&1"),
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
    sys.stdout.buffer.write(b"\n=== DONE ===\n")
except Exception as e:
    sys.stdout.buffer.write(f"Error: {e}\n".encode('utf-8', errors='replace'))
    sys.exit(1)
