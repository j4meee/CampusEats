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

Then create/update the tables and insert demo data:

```bash
npm run db:seed
```

Core tables:

```txt
users          students, vendors, and admins
vendors        vendor stall/profile details
categories     menu categories
menu_items     food/drink items sold by vendors
orders         student orders and pickup status
order_items    line items for each order
payments       QR/e-wallet payment records
feedback       post-pickup ratings
```

Demo accounts:

```txt
Student: student@campuseats.test / student123
Admin:   admin@campuseats.test / admin123
Vendor:  vendor@campuseats.test / vendor123
```
