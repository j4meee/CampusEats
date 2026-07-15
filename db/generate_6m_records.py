import os
import random
import string
from datetime import datetime, timedelta

import mysql.connector


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


load_env()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "3306"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "campuseats_db")
DB_SSL = os.getenv("DB_SSL", "false").lower() == "true"

TABLE_NAME = os.getenv("BIG_RECORD_TABLE", "campus_eats_activity_records")
INSERTION_AMOUNT = int(os.getenv("BIG_RECORD_ROUNDS", "100"))
RECORDS_PER_ROUND = int(os.getenv("BIG_RECORDS_PER_ROUND", "10000"))
COMMIT_BATCH_SIZE = int(os.getenv("BIG_RECORD_COMMIT_BATCH_SIZE", "500"))
MAX_RETRIES = int(os.getenv("BIG_RECORD_MAX_RETRIES", "5"))


def random_code(length=8):
    return "".join(random.choice(string.ascii_uppercase + string.digits) for _ in range(length))


def generate_data(record_number):
    menu_items = [
        ("Chicken Rice Bowl", "Mains", 3.50),
        ("Beef Lok Lak", "Mains", 4.25),
        ("Pork Basil Rice", "Mains", 3.75),
        ("Vegetable Fried Rice", "Mains", 3.00),
        ("Fish Amok Rice", "Mains", 4.50),
        ("Spring Rolls", "Snacks", 1.75),
        ("French Fries", "Snacks", 1.50),
        ("Chicken Nuggets", "Snacks", 2.25),
        ("Iced Lemon Tea", "Drinks", 1.25),
        ("Milk Tea", "Drinks", 1.75),
        ("Iced Coffee", "Drinks", 1.50),
        ("Thai Tea", "Drinks", 1.85),
        ("Mango Sticky Rice", "Desserts", 2.50),
        ("Chocolate Brownie", "Desserts", 1.75),
    ]
    vendors = [
        "Main Food Counter",
        "Snack Counter",
        "Drinks Counter",
        "Dessert Counter",
    ]
    statuses = ["pending", "preparing", "ready", "picked_up", "cancelled"]
    payment_methods = ["qr", "ewallet"]

    menu_item, category, unit_price = random.choice(menu_items)
    quantity = random.randint(1, 4)
    total_price = round(unit_price * quantity, 2)
    student_number = random.randint(1, 999999)
    order_date = datetime.now() - timedelta(
        days=random.randint(0, 365),
        minutes=random.randint(0, 1440),
    )

    student_name = f"Student {random_code(6)}"
    student_email = f"student{student_number:06d}_{record_number}@campuseats.test"
    order_number = f"CE-BIG-{record_number:08d}-{random_code(4)}"

    return (
        order_number,
        student_name,
        student_email,
        menu_item,
        category,
        random.choice(vendors),
        quantity,
        unit_price,
        total_price,
        random.choice(statuses),
        random.choice(payment_methods),
        order_date.strftime("%Y-%m-%d %H:%M:%S"),
    )


def connect_database():
    connection_config = {
        "host": DB_HOST,
        "port": DB_PORT,
        "user": DB_USER,
        "password": DB_PASSWORD,
        "database": DB_NAME,
        "connection_timeout": 30,
    }

    if DB_SSL:
        connection_config["ssl_disabled"] = False

    return mysql.connector.connect(**connection_config)


def reconnect_database(old_connection=None):
    if old_connection:
        try:
            old_connection.close()
        except mysql.connector.Error:
            pass

    return connect_database()


def insert_batch_with_retry(connection, cursor, insert_query, batch):
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            cursor.executemany(insert_query, batch)
            connection.commit()
            return connection, cursor
        except mysql.connector.Error as err:
            print(f"Batch insert failed on attempt {attempt}/{MAX_RETRIES}: {err}")

            try:
                connection.rollback()
            except mysql.connector.Error:
                pass

            if attempt == MAX_RETRIES:
                raise

            connection = reconnect_database(connection)
            cursor = connection.cursor()

    return connection, cursor


try:
    connection = connect_database()
    cursor = connection.cursor()
except mysql.connector.Error as err:
    print("Error connecting to database:", err)
    raise SystemExit(1)


create_table_query = f"""
CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  student_name VARCHAR(255) NOT NULL,
  student_email VARCHAR(255) NOT NULL,
  menu_item_name VARCHAR(255) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  order_status VARCHAR(30) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  ordered_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_big_records_ordered_at (ordered_at),
  INDEX idx_big_records_vendor_status (vendor_name, order_status),
  INDEX idx_big_records_category (category_name),
  INDEX idx_big_records_payment_method (payment_method)
)
"""

cursor.execute(create_table_query)
connection.commit()

insert_query = f"""
INSERT IGNORE INTO {TABLE_NAME} (
  order_number,
  student_name,
  student_email,
  menu_item_name,
  category_name,
  vendor_name,
  quantity,
  unit_price,
  total_price,
  order_status,
  payment_method,
  ordered_at
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

print("Start inserting ...")
print(f"Target table: {TABLE_NAME}")
print(f"Rounds: {INSERTION_AMOUNT}")
print(f"Records per round: {RECORDS_PER_ROUND}")
print(f"Total records: {INSERTION_AMOUNT * RECORDS_PER_ROUND}")

record_number = 0
for round_number in range(1, INSERTION_AMOUNT + 1):
    inserted_this_round = 0

    while inserted_this_round < RECORDS_PER_ROUND:
        current_batch_size = min(COMMIT_BATCH_SIZE, RECORDS_PER_ROUND - inserted_this_round)
        batch = []

        for _ in range(current_batch_size):
            record_number += 1
            batch.append(generate_data(record_number))

        connection, cursor = insert_batch_with_retry(connection, cursor, insert_query, batch)
        inserted_this_round += current_batch_size

    print("Insertion round", round_number, RECORDS_PER_ROUND, "records.")

print(f"Successfully inserted {record_number} records into {TABLE_NAME}.")

cursor.close()
connection.close()

print("Finished inserting!!!")
