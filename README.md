# Customer & Policy Management System

A full-stack application for managing customers and insurance policies.

## Tech Stack

- **Backend**: Node.js, Express, Prisma, SQLite (Modified for local ease-of-use)
- **Frontend**: React, Tailwind CSS, Framer Motion

## Features

- **Customers**: Add, List (Pagination), View Details
- **Policies**: Create, Search (Filter by City, Type, Status)
- **UI**: Modern, responsive design with glassmorphism effects and animations.

## Getting Started

### Prerequisites

- Node.js (Installed)

### Running Locally

1. **Backend**:
   ```bash
   cd backend
   npm install
   npx prisma db push
   npm start
   ```
   *The server will run on `http://localhost:4000`.*

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *The app will run on `http://localhost:5173`.*

## Directory Structure

- `backend/` - Express API & Prisma (SQLite configured)
- `frontend/` - React Vite App
