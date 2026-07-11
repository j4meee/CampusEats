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
