const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    technology: { type: String, required: true },
    difficulty: { type: String, required: true },
    interviewType: { type: String, required: true },
    overallScore: { type: Number, required: true },
    duration: { type: Number }, // Duration in minutes
    summaryFeedback: { type: String },
    breakdownScores: {
        Technical: { type: Number },
        Communication: { type: Number },
        Depth: { type: Number }
    },
    strengths: [String],
    missingConcepts: [String],
    questionReview: [{
        question: String,
        userAnswer: String,
        score: Number,
        feedback: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Interview', interviewSchema);
