import os
import subprocess
from datetime import datetime
from pathlib import Path


def load_env(path=".env"):
    if not os.path.exists(path):
        return

    with open(path, "r", encoding="utf-8") as env_file:
        for line in env_file:
            line = line.strip()

            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            os.environ.setdefault(key, value.strip().strip('"').strip("'"))


def get_required_env(name):
    value = os.getenv(name)

    if not value:
        raise RuntimeError(f"{name} is required")

    return value


def build_mysql_command(base_command, host, port, user, password):
    command = [
        base_command,
        f"--host={host}",
        f"--port={port}",
        f"--user={user}",
    ]

    if password:
        command.append(f"--password={password}")

    if os.getenv("DB_SSL", "false").lower() == "true":
        command.append("--ssl-mode=REQUIRED")

    return command


def backup_database(host, port, user, password, db_name, output_file):
    output_path = Path(output_file)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    command = build_mysql_command("mysqldump", host, port, user, password)
    command.extend([
        "--single-transaction",
        "--routines",
        "--triggers",
        db_name,
        f"--result-file={output_path}",
    ])

    print(command)

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print(result)

    if result.returncode == 0:
        print(f"Backup successful. File saved as {output_path}.")
    else:
        print(f"Error: {result.stderr.decode('utf-8')}")


def create_database_if_missing(host, port, user, password, db_name):
    command = build_mysql_command("mysql", host, port, user, password)
    command.append(
        "--execute="
        f"CREATE DATABASE IF NOT EXISTS `{db_name}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    )

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    if result.returncode != 0:
        raise RuntimeError(result.stderr.decode("utf-8"))


def restore_database(host, port, user, password, db_name, input_file):
    input_path = Path(input_file)

    if not input_path.exists():
        print(f"Error: backup file not found: {input_path}")
        return

    create_database_if_missing(host, port, user, password, db_name)

    command = build_mysql_command("mysql", host, port, user, password)
    command.append(db_name)

    print(command)

    with open(input_path, "r", encoding="utf-8") as infile:
        result = subprocess.run(command, stdin=infile, stdout=subprocess.PIPE, stderr=subprocess.PIPE)

    print(result)

    if result.returncode == 0:
        print(f"Restore successful from {input_path}.")
    else:
        print(f"Error: {result.stderr.decode('utf-8')}")


if __name__ == "__main__":
    load_env()

    host = os.getenv("DB_HOST", "localhost")
    port = os.getenv("DB_PORT", "3306")
    user = get_required_env("DB_USER")
    password = os.getenv("DB_PASSWORD", "")
    db_name = get_required_env("DB_NAME")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    default_backup_file = f"db/backups/{db_name}_backup_{timestamp}.sql"

    print("CampusEats Database Backup and Recovery")
    print("1. Backup database")
    print("2. Restore database")

    choice = input("Choose option (1/2): ").strip()

    if choice == "1":
        output_file = input(f"Backup output file [{default_backup_file}]: ").strip() or default_backup_file
        backup_database(host, port, user, password, db_name, output_file)
    elif choice == "2":
        input_file = input("Backup SQL file to restore: ").strip()
        restore_database(host, port, user, password, db_name, input_file)
    else:
        print("Invalid option.")
