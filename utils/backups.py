import mysql.connector
import os
import subprocess
from datetime import datetime
from dotenv import load_dotenv
import time
import logging

config = load_dotenv(".env")
db_host = os.getenv("DB_HOST")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_name = os.getenv("DB_NAME")

DIRECTORIES ={
    "full": "./backups/full",
    "users": "./backups/users",
    "orders": "./backups/orders",
    "payments": "./backups/payments",
}

for folders in DIRECTORIES.values():
    if not os.path.exists(folders):
        os.makedirs(folders)
        print(f"Created directory: {folders}")

def run_dump(tables: list, backup_type: str):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = DIRECTORIES[backup_type]
    backup_file = os.path.join(backup_dir, f"{backup_type}_backup_{timestamp}.sql")

    tables_str = " ".join(tables)
    command = [
        r"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
        f"-h={db_host}",
        f"-u={db_user}",
        f"-p{db_password}",
        db_name,
        *tables
    ]
    print(command)

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(result)
    if result.returncode == 0:
        with open(backup_file, "wb") as f:
            f.write(result.stdout)
        print(f"Backup successful: {backup_file}")
    else:
        print(f"Backup failed: {result.stderr.decode()}")

