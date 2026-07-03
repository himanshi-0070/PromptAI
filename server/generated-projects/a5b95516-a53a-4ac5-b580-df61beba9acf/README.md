# Task Manager Application

Welcome to the Task Manager, a full-stack MERN application designed to help you organize your tasks efficiently.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Folder Structure](#folder-structure)

## Features

- User Authentication (Register, Login, Protected Routes)
- Kanban Board View with Drag and Drop functionality
- List View for tasks
- Task Details with title, description, due date, priority, status, and labels
- Project Management
- Customizable Labels
- Dark Mode UI with Tailwind CSS
- Smooth UI animations with Framer Motion

## Technology Stack

**Frontend:**
- React 18 with Vite
- Tailwind CSS
- React Router DOM v6
- Axios (HTTP Client)
- Framer Motion (Animations)
- Lucide React (Icons)

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose
- JWT for Authentication
- Bcrypt.js for password hashing
- Express-validator for input validation
- Helmet, CORS, Morgan for security and logging

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v18 or higher) and npm installed
- MongoDB instance (local or cloud-based like MongoDB Atlas)

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Backend Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install backend dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    Copy the `.env.example` file to `.env` and fill in your environment variables. See [Environment Variables](#environment-variables) for details.

4.  **Run the backend server:**
    ```bash
    npm start
    ```
    The backend server will run on `http://localhost:5000` (or your specified `PORT`).

### Frontend Setup

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Create a `.env` file:**
    Copy the `.env.example` file to `.env` and fill in your environment variables. See [Environment Variables](#environment-variables) for details.

4.  **Run the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend application will open in your browser, usually at `http://localhost:5173` (or the port Vite assigns).

## Environment Variables

### Backend (`backend/.env`)

| Variable Name       | Description                                        | Example Value                 |
| :------------------ | :------------------------------------------------- | :---------------------------- |
| `PORT`              | Port for the Express server                        | `5000`                        |
| `MONGO_URI`         | MongoDB connection URI                             | `mongodb://localhost:27017/taskmanager` |
| `JWT_SECRET`        | Secret key for signing JWTs                        | `your_jwt_secret_key`         |
| `JWT_EXPIRES_IN`    | JWT expiration time                                | `1h`                          |

### Frontend (`frontend/.env`)

| Variable Name       | Description                                        | Example Value                 |
| :------------------ | :------------------------------------------------- | :---------------------------- |
| `VITE_API_BASE_URL` | Base URL for the backend API                       | `http://localhost:5000/api`   |

## API Endpoints

All API endpoints are prefixed with `/api`.

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and get JWT
- `GET /api/auth/me` - Get current user's profile (protected)

### Tasks (Protected)
- `GET /api/tasks` - Get all tasks for the authenticated user
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get a single task by ID
- `PUT /api/tasks/:id` - Update a task by ID
- `DELETE /api/tasks/:id` - Delete a task by ID
- `PATCH /api/tasks/:id/status` - Update task status by ID

### Projects (Protected)
- `GET /api/projects` - Get all projects for the authenticated user
- `POST /api/projects` - Create a new project
- `GET /api/projects/:id` - Get a single project by ID
- `PUT /api/projects/:id` - Update a project by ID
- `DELETE /api/projects/:id` - Delete a project by ID

### Labels (Protected)
- `GET /api/labels` - Get all labels for the authenticated user
- `POST /api/labels` - Create a new label
- `GET /api/labels/:id` - Get a single label by ID
- `PUT /api/labels/:id` - Update a label by ID
- `DELETE /api/labels/:id` - Delete a label by ID

## Folder Structure

```
.gitignore
README.md

backend/
├── .env.example
├── package.json
├── server.js
└── src/
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── auth.controller.js
    │   ├── label.controller.js
    │   ├── project.controller.js
    │   └── task.controller.js
    ├── middleware/
    │   ├── auth.js
    │   ├── errorHandler.js
    │   └── validation.js
    ├── models/
    │   ├── Label.js
    │   ├── Project.js
    │   ├── Task.js
    │   └── User.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── label.routes.js
    │   ├── project.routes.js
    │   └── task.routes.js
    ├── services/
    │   ├── auth.service.js
    │   ├── label.service.js
    │   ├── project.service.js
    │   └── task.service.js
    └── utils/
        └── jwt.js

frontend/
├── index.html
├── package.json
├── public/
│   └── vite.svg
├── src/
│   ├── App.jsx
│   ├── assets/
│   ├── components/
│   │   ├── AddTaskForm.jsx
│   │   ├── Column.jsx
│   │   ├── ErrorDisplay.jsx
│   │   ├── KanbanBoard.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Navbar.jsx
│   │   ├── PriorityBadge.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   └── TaskCard.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ProjectContext.jsx
│   │   └── TaskContext.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useProjects.js
│   │   └── useTasks.js
│   ├── index.css
│   ├── main.jsx
│   ├── pages/
│   │   ├── BoardView.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ListView.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Settings.jsx
│   │   └── TaskDetail.jsx
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── project.service.js
│   │   └── task.service.js
│   └── utils/
│       └── api.js
├── tailwind.config.js
└── vite.config.js
```
