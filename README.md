# Digital Catalogue

A full-stack web application designed to simplify digital product catalogue management through an interactive interface and structured backend services.

## Overview

Digital Catalogue enables administrators to organize and manage product information, categories, and product variants through a centralized web platform. The project demonstrates full-stack development, REST API integration, database management, and authentication.

## Key Features

- **Product Management:** Create, view, update, and manage product information.
- **Category Management:** Organize products into structured categories.
- **Product Variants:** Manage product variations and their associated details.
- **Authentication:** Secure login and authentication using JWT.
- **User Management:** Manage user access and administrative operations.
- **REST API Integration:** Connect the frontend with backend services.
- **Responsive Interface:** Provide an interactive interface for catalogue browsing and management.
- **Database Integration:** Store and retrieve catalogue information using a relational database.

## Technology Stack

- **Frontend:** React.js, Vite, JavaScript, HTML5, CSS3
- **Backend:** Node.js, Express.js
- **Database:** MySQL/MariaDB
- **Authentication:** JSON Web Tokens (JWT), bcrypt
- **API:** REST APIs
- **Version Control:** Git

## Project Structure

```text
digital-catalogue/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── package-lock.json
├── backend/
│   ├── src/
│   ├── package.json
│   └── schema.sql
└── README.md
```

*Note: Update this structure to match your actual project folders and files.*

## Getting Started

### Prerequisites

- Node.js and npm
- MySQL or MariaDB
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd digital-catalogue
   ```

2. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

3. Install backend dependencies:

   ```bash
   cd ../backend
   npm install
   ```

### Configuration

Configure the database connection and required environment variables according to the backend configuration.

Keep database passwords, JWT secrets, and other sensitive credentials in a local `.env` file. Never commit these secrets to GitHub.

### Running the Application

Start the backend using the command configured in its `package.json`, for example:

```bash
npm start
```

Start the frontend in a separate terminal:

```bash
cd frontend
npm run dev
```

Follow the terminal output for the local development URL and ensure the database is configured before testing the application.

## Learning Outcomes

- Full-stack web application development
- REST API design and integration
- Relational database management
- Authentication and authorization concepts
- Frontend and backend integration
- Dependency management and application testing

## Project Purpose

This project demonstrates practical full-stack development skills through the design and implementation of a centralized digital product catalogue.

## Author

**Poojashri**

