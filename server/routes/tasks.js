// routes/tasks.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  createTask,
  updateTask,
  deleteTask,
  getAllTasks
} = require('../controllers/taskControllers');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Task list
router.get('/lists', getAllTasks);

// Create task
router.post('/create', createTask);

// Update task
router.put('/update/:id', updateTask);

// Delete task
router.delete('/delete/:id', deleteTask);

module.exports = router;