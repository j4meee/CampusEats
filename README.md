# CampusEats

Full-stack campus food pre-order app with a React frontend, Express API, and Sequelize database setup.

## Project Structure

```txt
controllers/        API business logic
db/                 Sequelize database connection
model/              Sequelize models
routes/             Express route definitions
src/                React frontend
.env                Local backend configuration
server.js           Express server entry point
```

## Running

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Start the backend:

```bash
npm run server
```

Open Swagger API documentation after the backend starts:

```txt
http://localhost:5000/api-docs
```

Use `POST /api/auth/login` to get a JWT token, then click **Authorize** and enter:

```txt
Bearer YOUR_TOKEN
```

Or start both the frontend and backend in one terminal:

```bash
npm run dev:all
```

## Database

The backend uses MySQL through Sequelize. Create a local database that matches your `.env` file:

```sql
CREATE DATABASE campuseats_db;
```

Then create/update the tables and insert seed data:

```bash
npm run db:seed
```

Grant database management privileges to a dedicated MySQL user:

```bash
npm run db:grant-manager
```

The grant script uses these `.env` values:

```txt
DB_ADMIN_USER=root
DB_ADMIN_PASSWORD=
DB_MANAGER_USER=campuseats_manager
DB_MANAGER_PASSWORD=change-this-manager-password
DB_MANAGER_HOST=localhost
```

It runs the equivalent of:

```sql
CREATE USER IF NOT EXISTS 'campuseats_manager'@'localhost' IDENTIFIED BY 'change-this-manager-password';
GRANT ALL PRIVILEGES ON campuseats_db.* TO 'campuseats_manager'@'localhost';
FLUSH PRIVILEGES;
```

Create a database backup using the same `mysqldump` flow shown in the backup/recovery notebook:

```bash
npm run db:backup
```

By default, backups are saved in `db/backups/` using the database name and timestamp. You can choose the file path:

```bash
npm run db:backup -- --file=db/backups/campuseats_db_backup.sql
```

Recover the database from a backup using the same `mysql` restore flow. If the database was dropped, the restore script creates it again before importing the SQL file:

```bash
npm run db:restore -- --file=db/backups/campuseats_db_backup.sql
```

You can also use the Python backup/recovery menu that follows the class notebook style:

```bash
python db/database_backup_recovery.py
```

Generate 1 million big-data sample records for database testing:

```bash
npm run db:generate-1m
```

This creates and fills a separate table named `campus_eats_activity_records`, so the normal app tables are not damaged. The script follows the class example style, but uses `100` rounds x `10,000` records by default to avoid filling small database storage.

Core tables:

```txt
users          students, admins, and vendor staff accounts
vendor_counters vendor stall/counter details
categories     menu categories
menu_items     food/drink items sold by vendors
orders         student orders and pickup status
order_items    line items for each order
payments       QR/e-wallet payment records
feedback       post-pickup ratings
```

`vendor_counters` stores counters/stalls, while vendor cashier and chef accounts are stored in `users`. `users.vendor_counter_id`, `menu_items.vendor_counter_id`, and `orders.vendor_counter_id` connect staff, menu items, and orders to the correct counter. `menu_items.stock_quantity` stores how many portions are available. `order_items.quantity` stores how many portions the student ordered.

The seed creates a 50-item menu catalog and assigns items by category:

```txt
Mains    -> Main Food Counter
Snacks   -> Snack Counter
Drinks   -> Drinks Counter
Desserts -> Dessert Counter
```

Catalog items are hidden by default until admin or cashier selects them for the weekly menu.

Seed accounts:

```txt
Student: student@campuseats.test / student123
Admin:   admin@campuseats.test / admin123
Vendor:  vendor@campuseats.test / vendor123
Chef:    chef@campuseats.test / chef123
```

## User Access Control

CampusEats uses role-based access control with privileges. Vendor users are also divided by staff type:

```txt
student  can view menu, place orders, and view their own order/payment history
vendor   can view the vendor dashboard for their assigned counter
cashier  vendor staff type that accepts/rejects pending orders and manages weekly menu
chef     vendor staff type that prepares accepted orders and marks them ready
admin    has all privileges, including user/access-control management
```

The role and privilege matrix is defined in `config/accessControl.js`.
Admins can view it through:

```txt
GET /api/users/access-control
```
