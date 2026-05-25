const express = require('express');
const router = express.Router();
const { 
    generateQuestions, 
    scoreInterview, 
    getInterviewHistory, 
    getInterviewStats,
    getInterviewById 
} = require('../controllers/interview.controller');
const { protect } = require('../middleware/auth.middleware');

// Public
router.post('/generate-questions', generateQuestions);

// Protected - requires login (JWT)
router.post('/score-interview', protect, scoreInterview);
router.get('/history', protect, getInterviewHistory);
router.get('/stats', protect, getInterviewStats);
router.get('/:id', protect, getInterviewById);

module.exports = router;
