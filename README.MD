# 🗑️ Smart Waste Management Platform ♻️

The Smart Waste Management Platform is a sophisticated, real-time application designed for municipalities, businesses, or universities to efficiently manage and monitor smart waste containers. It leverages sensor data and a user-friendly interface to optimize waste collection routes, improve operational efficiency, and enhance citizen engagement.

**Please Note:** This platform is currently operating in **Demo Mode**.

## Table of Contents

- [🎯 Project Concept](#-project-concept)
- [✨ Key Features](#-key-features)
  - [Real-Time Container Monitoring & Simulation](#real-time-container-monitoring--simulation)
  - [User Experience & Accessibility](#user-experience--accessibility)
  - [Internationalization & Communication](#internationalization--communication)
  - [Citizen Engagement & Reporting](#citizen-engagement--reporting)
  - [Advanced Container Search & Filtering](#advanced-container-search--filtering)
  - [Administrator Panel](#administrator-panel)
  - [Operator Panel](#operator-panel)
  - [User Registration & Management](#user-registration--management)
- [🤖 Demo Mode & Data Simulation](#-demo-mode--data-simulation)
- [🌱 Seed Data & Demo Users](#-seed-data--demo-users)
  - [Pre-loaded Data](#pre-loaded-data)
  - [Demo Login Credentials](#demo-login-credentials)
- [🛠️ Tech Stack](#️-tech-stack)
- [📂 Project Structure](#-project-structure)
- [📋 Prerequisites](#-prerequisites)
- [🚀 Getting Started](#-getting-started)
  - [⚙️ Backend Setup](#️-backend-setup)
    - [Option 1: Manual PostgreSQL Setup 🐘](#option-1-manual-postgresql-setup-)
    - [Option 2: PostgreSQL with Docker Compose 🐳](#option-2-postgresql-with-docker-compose-)
  - [🖥️ Frontend Setup](#️-frontend-setup)
- [🔑 Environment Variables](#-environment-variables)
- [▶️ Available Scripts](#️-available-scripts)
- [📖 API Documentation](#-api-documentation)
- [📜 License](#-license)

## 🎯 Project Concept

This platform provides a comprehensive solution for managing intelligent waste containers equipped with sensors. The core idea is to:

-   **Enable real-time monitoring:** Track container fill levels and status (e.g., damaged) via simulated sensor updates, visualized on an interactive map.
-   **Optimize operations:** Allow administrators and operators to efficiently manage container fleets, assign tasks, and respond to incidents.
-   **Foster citizen participation:** Empower citizens to report issues and easily locate containers.
-   **Enhance user experience:** Offer a modern, accessible, and engaging interface with multilingual support.

The system is designed for organizations like city councils, universities, or large businesses aiming to implement smart waste management solutions.

## ✨ Key Features

### Real-Time Container Monitoring & Simulation
-   **Live Map View:** Users are greeted with a real-time map displaying all smart containers and their current status (fill level, damaged, etc.) via WebSocket connections.
-   **(Demo) Simulated Sensor Data:** Due to the absence of physical sensors in this demo, a cron job simulates:
    -   Random container fill level increase every 30 minutes.
    -   Random container damage report every 2 hours.
    -   Random resolution (emptying/fixing) of a full/damaged container every 4 hours.

### User Experience & Accessibility
-   **User-Friendly Interface:** Modern, intuitive design adaptable to mobile devices.
-   **Accessibility Focus:** Built with accessibility best practices in mind.
-   **Light/Dark Mode:** Enhances user comfort and preference.
-   **Comedic Gags:** Small, humorous elements integrated throughout the platform to create a more enjoyable and engaging user experience.

### Internationalization & Communication
-   **Multilingual Support:** Full internationalization (i18n) for both frontend and backend, currently supporting **English (en)** and **Spanish (es)**. Easily extensible to other languages (e.g., Finnish, German, French).
-   **Newsletter Subscription:** Users can subscribe to a newsletter via a footer form. A cron job (Mondays at 9 AM) sends out newsletters in the language the user selected at the time of subscription.

### Citizen Engagement & Reporting
-   **Incident Reporting:** Citizens can report issues like damaged or overflowing containers.
    -   Allows selection of containers from a list or via query parameters (e.g., from QR codes).
    -   Helps operators identify issues not caught by (simulated) sensors.

### Advanced Container Search & Filtering
-   **Intuitive Container Search:** Users can find containers based on:
    -   Proximity to a specified location (or current device location).
    -   Container type (waste type).
    -   Container status (fill level, damaged).
    -   Distance.
-   **Dual View Results:** Search results displayed both in a list and on an interactive map.
-   **Direct Report Link:** Each container in the search result has a direct link to the incident reporting page, pre-filling the container ID via query parameters.

### Administrator Panel
-   **Real-Time Dashboard:** Overview of system status, including live statistics and a real-time container map.
-   **Container Management (CRUD):**
    -   Create, read, update, and delete smart containers.
    -   Assign operators to specific containers.
    -   **PDF & QR Code Generation:**
        -   Download a PDF report of all containers and their current status.
        -   Generate a PDF with unique QR codes for each container. These QR codes link directly to the incident reporting page for that specific container, designed for printing and physical placement on containers.
-   **Operator Management (CRUD):**
    -   Create, read, update, and delete operator accounts.
    -   Assign containers to operators.
    -   **Operator Account Creation Flow:** When an admin creates an operator (name, email), the system sends an email to the operator with a unique link to set their password and validate their email, thereby activating their account.

### Operator Panel
-   **Incident Dashboard:** Operators see a real-time, filtered list of containers assigned to them that require attention (e.g., full or damaged).
-   **Real-Time Updates:** The list updates live via WebSockets if new incidents occur during their session.
-   **Issue Resolution:** Operators can mark incidents as resolved after addressing them (e.g., emptying or repairing a container).
-   **PDF Incident Report:** Download a PDF summary of their assigned incidents.

### User Registration & Management
-   **Public User (Citizen) Registration:** Citizens can register for an account. The flow involves form submission followed by an email with a link to set their password and validate their email.
    -   *(Demo Note: Currently, registered public users have limited additional functionality beyond basic access, serving as a demo of the public registration process.)*
-   **Password Recovery:** All user types can recover their passwords via an email-based reset process.

## 🤖 Demo Mode & Data Simulation

This platform operates in a **Demo Mode** to showcase its full capabilities without requiring physical smart containers and sensors. Key aspects of the demo mode include:

-   **Simulated Container Activity:** Backend cron jobs simulate real-world container interactions:
    -   A random container's fill level increases every **30 minutes**.
    -   A random container is reported as "damaged" every **2 hours**.
    -   A random full or damaged container is "serviced" (emptied or repaired) every **4 hours**.
-   **Purpose:** This simulation allows users to experience the dynamic, real-time nature of the platform, observe status changes on the map, and see how different user roles would interact with live data.

## 🌱 Seed Data & Demo Users

### Pre-loaded Data
To facilitate the demo experience, the database is seeded with initial data upon setup:
-   **Containers:** Smart containers are pre-loaded for several cities: Madrid, Lappeenranta, Barcelona, Riga, Stockholm, Paris, Munich, and Warsaw.
-   **Operators:** An operator user is created for each of these cities, and they are automatically assigned the containers located in or near their respective city.

### Demo Login Credentials
You can log in and explore the platform's features using these pre-loaded accounts:

| Role             | Email                          | Password    | Name                   |
| ---------------- | ------------------------------ | ----------- | ---------------------- |
| 👑 Admin         | `admin@example.com` (or as per `ADMIN_EMAIL` in `.env`) | `password123` | Admin User             |
| 🎓 Citizen/Student | `user@example.com`               | `password123` | Student User           |
| 👷 Operator      | `madrid@example.com`             | `password123` | Madrid Operator        |
| 👷 Operator      | `barcelona@example.com`          | `password123` | Barcelona Operator     |
| 👷 Operator      | `paris@example.com`              | `password123` | Paris Operator         |
| 👷 Operator      | `munich@example.com`             | `password123` | Munich Operator        |
| 👷 Operator      | `warsaw@example.com`             | `password123` | Warsaw Operator        |
| 👷 Operator      | `riga@example.com`               | `password123` | Riga Operator          |
| 👷 Operator      | `stockholm@example.com`          | `password123` | Stockholm Operator     |
| 👷 Operator      | `lappeenranta@example.com`       | `password123` | Lappeenranta Operator  |

*(The actual admin email might be configured via the `ADMIN_EMAIL` variable in your `backend/.env` file.)*

## 🛠️ Tech Stack

### Backend (NestJS)
- Framework: NestJS (TypeScript)
- Database: PostgreSQL with TypeORM
- Authentication: Passport.js (JWT, etc.)
- API Docs: Swagger (OpenAPI)
- Real-time: WebSockets (`@nestjs/platform-socket.io`)
- Scheduling: `@nestjs/schedule` (for cron jobs)
- Emailing: `nodemailer`
- Other: `bcrypt`, `pdfmake`, `qrcode`, `nestjs-i18n`

### Frontend (Next.js)
- Framework: Next.js 15+ (React, App Router)
- Styling: Tailwind CSS, Shadcn/ui
- Forms: React Hook Form, Zod
- API: Axios
- Charts: Chart.js
- Maps: Leaflet
- i18n: `next-intl`
- Real-time: `socket.io-client`

## 📂 Project Structure
-   `/backend`: NestJS application.
-   `/frontend`: Next.js application.

## 📋 Prerequisites
-   [Node.js](https://nodejs.org/) (LTS version recommended) 🟢
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) 📦
-   **For Database:**
    -   Standalone [PostgreSQL](https://www.postgresql.org/download/) server. 🐘
    -   Or [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) 🐳.

## 🚀 Getting Started
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/antomihe/SustainableCity.git 
    cd SustainableCity 
    ```

### ⚙️ Backend Setup
Choose one of the database setup options:

#### Option 1: Manual PostgreSQL Setup 🐘
1. Install & run PostgreSQL.
2. Create a database (e.g., `sustainable_campus` - you might want to rename this in your `.env` to `smart_waste_db` or similar to match the project's theme).

#### Option 2: PostgreSQL with Docker Compose 🐳
1.  Create `docker-compose.yml` in the project root (or `backend/`):
2.  Ensure `backend/.env` has matching DB credentials.
3.  Start container: `docker-compose up -d`. 💨
---
**Continue common backend setup:**
1.  `cd backend`
2.  `npm install`
3.  Set up `backend/.env` from `.env.example`.
4.  Database schema syncs via TypeORM (`synchronize: true` in dev).
5.  `npm run start:dev` (Backend at `http://localhost:3001`) 🎉

### 🖥️ Frontend Setup
1.  `cd ../frontend`
2.  `npm install`
3.  Create `frontend/.env.local`:
    ```env
    NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
    NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    ```
4.  `npm run dev` (Frontend at `http://localhost:3000`) 🎈

## 🔑 Environment Variables
Refer to `backend/.env.example` and ensure your `backend/.env` is correctly configured, especially `DB_*` , `JWT_SECRET`, and `EMAIL_*` variables. For the frontend, check the `NEXT_PUBLIC_*` variables mentioned above.

## ▶️ Available Scripts
(Refer to `package.json` in `backend/` and `frontend/` folders for full list)
- **Backend:** `npm run start:dev`, `npm run build`, `npm run seed`
- **Frontend:** `npm run dev`, `npm run build`

## 📖 API Documentation
Swagger API docs at: `http://localhost:[APP_PORT]/[API_PREFIX]-docs` (e.g., `http://localhost:3001/api-docs`).

## 📜 License

Copyright © 2025 Antonio Miguel Herrero. All rights reserved.

---