const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllUsers,
    getAllInterviews,
    getAIEvaluations,
    getAnalytics,
    updateUserStatus,
    updateUserRole,
    deleteUser
} = require('../controllers/admin.controller');
const { protect, adminOnly } = require('../middleware/auth.middleware');

// All admin routes require authentication AND admin role
// Apply both protect and adminOnly middleware to all routes

// Dashboard
router.get('/dashboard/stats', protect, adminOnly, getDashboardStats);

// Users
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:userId/status', protect, adminOnly, updateUserStatus);
router.patch('/users/:userId/role', protect, adminOnly, updateUserRole);
router.delete('/users/:userId', protect, adminOnly, deleteUser);

// Interviews
router.get('/interviews', protect, adminOnly, getAllInterviews);

// AI Evaluations
router.get('/evaluations', protect, adminOnly, getAIEvaluations);

// Analytics
router.get('/analytics', protect, adminOnly, getAnalytics);

module.exports = router;
