# 🚗 AutoCare — Vehicle Service Booking System

> A full-stack web application for online vehicle service booking and workshop management built with **AngularJS (v1.8)**, **Node.js (Express)**, and **MySQL 8.0**.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Default Login Credentials](#-default-login-credentials)
- [Quick Start Guide](#-quick-start-guide)
- [Project Structure](#-project-structure)
- [System Architecture & Workflow](#-system-architecture--workflow)
- [Database Schema](#-database-schema)
- [REST API Endpoints](#-rest-api-endpoints)
- [Application Screenshots](#-application-screenshots)
- [Troubleshooting & FAQs](#-troubleshooting--faqs)

---

## 📌 Project Overview

**AutoCare** provides a digital solution for automobile service centers and vehicle owners. It replaces manual paper logbooks and phone scheduling with an automated, transparent web portal:
* **Customers** can manage their vehicles, browse standardized service pricing, book appointments with custom time slots, and monitor repair status in real time.
* **Workshop Admins** can oversee incoming bookings, assign specialized mechanics, manage workflow states (*Pending &rarr; In Progress &rarr; Completed*), and track workshop counters.

---

## ✨ Key Features

### 👤 Customer Features
* **User Authentication**: Secure signup and login with hashed passwords (`bcryptjs`) and session tokens (`JWT`).
* **Digital Garage**: Add, view, and manage multiple vehicles (Cars, Bikes, Scooters) with registration numbers.
* **Service Catalog**: Browse fixed-price services with duration and transparent descriptions.
* **Easy Appointment Booking**: Schedule appointments with automatic validation (no past dates allowed).
* **Live Booking Status**: Track real-time service status (*Pending*, *In Progress*, *Completed*) managed and updated by the workshop admin.

### 🛠️ Admin Features
* **Management Console**: Dedicated dashboard showing live counters (Total, Pending, In Progress, Completed).
* **Booking Control**: View all customer service requests across the workshop.
* **Mechanic Allocation**: Assign specialized mechanics (Engine, Brakes, Two-Wheeler) to specific bookings.
* **Workflow Status Updates**: Instantly transition booking status and update payment records.

---

## 💻 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | **AngularJS (1.8.3)**, HTML5, Vanilla CSS3 | Single Page Application (SPA), two-way data binding (`ng-model`), responsive layout |
| **Backend** | **Node.js**, **Express.js (v4.21)** | RESTful API server, token authentication, business logic |
| **Database** | **MySQL 8.0** | Relational storage, foreign keys, cascade rules, index optimization |
| **Security** | **JWT (jsonwebtoken)** & **bcryptjs** | Stateless Bearer token authorization and cryptographic password hashing |
| **Database Driver** | **mysql2/promise** | Connection pooling and parameterized prepared queries |

---

## 🔑 Login Credentials & Access Control

Access is strictly role-separated. Customers only see customer features, and administrative options are exclusively available via the Admin Login portal:

| Portal | Email / Username | Password | Access Privileges |
|---|---|---|---|
| **Admin Login** | `admin@autocare.com` | `admin123` | Exclusive access to Admin Management Console, workshop counters, mechanic allocation, and status management |
| **Customer Sign In** | `vivekpunde6@gmail.com` *(or create any new account)* | *(Your registration password)* | Personal digital garage, service booking, and appointment status tracking |

> **Note**: Regular users and registered customers **never** see or have access to administrative options. Administrative control is only granted upon authenticating through the **Admin Login** portal with authorized administrator credentials.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v16.x or newer)
* [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0 or compatible)

---

### 2. Database Setup
1. Make sure your MySQL service is running (e.g. `MySQL80`).
2. Run the database setup script in MySQL Workbench or terminal:
   ```bash
   mysql -u root -p < schema.sql
   ```
   *This creates `vehicle_service_db`, creates all 5 tables, and seeds initial services, mechanics, and admin credentials.*

---

### 3. Environment Configuration (`.env`)
Verify the `.env` file in the project root directory:
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Vivek
DB_NAME=vehicle_service_db
JWT_SECRET=super_secret_vehicle_service_booking_system_jwt_key_2026
```
*(Update `DB_PASSWORD` if your local MySQL root password is different).*

---

### 4. Install Dependencies & Run
Open terminal in the project directory:

```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the application
npm start
```

For development mode with automatic restarts on code changes:
```bash
npm run dev
```

---

### 5. Access the Web App
Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📂 Project Structure

```text
vehicle-service-booking-system/
├── public/                       # Frontend Single Page Application (SPA)
│   ├── app.js                   # AngularJS controller, API service calls, session management
│   ├── index.html               # Main HTML markup with navigation tabs & modals
│   └── styles.css               # Clean modern CSS (variables, grid, dark accent theme)
├── screenshots/                 # Application demonstration screenshots
│   ├── 01-customer-dashboard.png
│   ├── 02-booking-management.png
│   ├── 03-admin-dashboard.png
│   └── 04-system-architecture.png
├── .env                         # Local environment settings (DB config & JWT secret)
├── .env.example                 # Environment variables template
├── package.json                 # Node dependencies and execution scripts
├── README.md                    # Project documentation
├── schema.sql                   # MySQL database schema & seed data
├── server.js                    # Express REST API, auth middleware & DB queries
└── PROJECT_REPORT.txt           # Academic project report & submission text export
```

---

## 🔄 System Architecture & Workflow

```text
+-------------------------------------------------------------+
|                      Client Browser                         |
|   AngularJS 1.8 SPA (HTML5 + Vanilla CSS3 + $http Client)   |
+------------------------------+------------------------------+
                               |
                   HTTP / REST API (JSON)
                   Authorization: Bearer <JWT>
                               |
                               v
+-------------------------------------------------------------+
|                    Node.js & Express API                    |
|  - CORS & JSON Body Parser                                   |
|  - JWT Auth & Role-Based Middleware (Customer / Admin)      |
|  - Prepared Statements (mysql2/promise)                      |
+------------------------------+------------------------------+
                               |
                      Connection Pool (10)
                               |
                               v
+-------------------------------------------------------------+
|                       MySQL Database                        |
|  - users        - vehicles       - services                 |
|  - mechanics    - bookings                                  |
+-------------------------------------------------------------+
```

### Typical Workflow:
1. **Customer** registers & logs in &rarr; receives JWT token saved in `localStorage`.
2. Customer adds their vehicle in **My Vehicles** (Make, Model, Registration Number).
3. Customer navigates to **Book Service** &rarr; selects service, vehicle, date, and time.
4. Booking is stored in MySQL with status `Pending`.
5. **Admin** logs in with `admin@autocare.com` &rarr; opens **Admin** tab &rarr; assigns a mechanic &rarr; updates status to `In Progress` or `Completed`.

---

## 🗄️ Database Schema

The database uses 5 interconnected tables with foreign key constraints:

| Table | Description | Key Relationships |
|---|---|---|
| **`users`** | Stores customer and admin accounts, contact info, hashed passwords | Primary entity (`id`) |
| **`vehicles`** | Vehicles registered to customer accounts (Make, Model, Reg No.) | Foreign key to `users.id` (`ON DELETE CASCADE`) |
| **`services`** | Catalog of repair/maintenance offerings, prices, and durations | Primary entity (`id`) |
| **`mechanics`** | Workshop technicians, phone numbers, and specializations | Primary entity (`id`) |
| **`bookings`** | Appointment records with dates, status, notes, and payment info | Links `users`, `vehicles`, `services`, and `mechanics` |

---

## 📡 REST API Endpoints

All endpoints are hosted at `http://localhost:3000/api`.

### 🔓 Public Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health check |
| `POST` | `/api/auth/register` | Register a new customer account |
| `POST` | `/api/auth/login` | Authenticate user and return JWT token |
| `GET` | `/api/services` | Retrieve list of all available service packages |

### 🔒 Customer / Protected Endpoints (Requires `Bearer <token>`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/vehicles` | Get all vehicles belonging to the logged-in user |
| `POST` | `/api/vehicles` | Add a new vehicle to the user's garage |
| `DELETE`| `/api/vehicles/:id` | Remove a vehicle from the garage |
| `GET` | `/api/bookings` | View user's bookings (or all bookings if admin) |
| `POST` | `/api/bookings` | Submit a new appointment booking |
| `PATCH`| `/api/bookings/:id/cancel` | Cancel an eligible pending booking |

### 🛡️ Admin Only Endpoints (Requires `role === 'admin'`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/summary` | Get workshop stats (Total, Pending, In Progress, Completed) |
| `GET` | `/api/mechanics` | List all active workshop mechanics |
| `PATCH`| `/api/bookings/:id/status` | Assign mechanic and update booking/payment status |

---

## 🖼️ Application Screenshots

| Customer Overview | Booking & Appointments |
|:---:|:---:|
| ![Customer Dashboard](screenshots/01-customer-dashboard.png) | ![Booking Management](screenshots/02-booking-management.png) |

| Admin Management Console | System Architecture |
|:---:|:---:|
| ![Admin Dashboard](screenshots/03-admin-dashboard.png) | ![System Architecture](screenshots/04-system-architecture.png) |

---

## 🛠️ Troubleshooting & FAQs

### 1. Port 3000 already in use (`EADDRINUSE`)
If port 3000 is occupied by a previous process, stop it using PowerShell:
```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### 2. MySQL Connection Refused (`ECONNREFUSED`)
* Verify MySQL service is running in Windows Services (`services.msc`) or via PowerShell:
  ```powershell
  Get-Service -Name *mysql*
  ```
* Make sure `DB_PASSWORD` in `.env` matches your MySQL root user password.

### 3. How to check API health in browser
Visit: [http://localhost:3000/api/health](http://localhost:3000/api/health)  
Expected response:
```json
{"status":"ok","message":"Vehicle Service API is running"}
```

---

## 📜 License
This project is developed for educational and academic demonstration purposes. Free to use and customize.
#   A u t o C a r e - V e h i c l e - S e r v i c e - B o o k i n g - S y s t e m  
 