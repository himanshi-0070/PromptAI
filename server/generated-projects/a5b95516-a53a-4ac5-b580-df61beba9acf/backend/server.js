require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const connectDB = require('./src/config/db')
const errorHandler = require('./src/middleware/errorHandler')

// Import routes
const authRoutes = require('./src/routes/auth.routes')
const taskRoutes = require('./src/routes/task.routes')
const projectRoutes = require('./src/routes/project.routes')
const labelRoutes = require('./src/routes/label.routes')

const app = express()

// Connect to database
connectDB()

// Middleware
app.use(express.json()) // Body parser for JSON requests
app.use(cors()) // Enable CORS for all origins
app.use(helmet()) // Secure Express apps by setting various HTTP headers
app.use(morgan('dev')) // HTTP request logger middleware for node.js

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/labels', labelRoutes)

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Task Manager API!' })
})

// Error handling middleware (must be last)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
