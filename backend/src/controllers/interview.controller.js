const { generateInterviewQuestions, evaluateInterview } = require('../services/ai.service');
const Interview = require('../models/Interview');

const generateQuestions = async (req, res, next) => {
    try {
        const { technology, difficulty, interviewType, numberOfQuestions } = req.body;

        if (!technology || !difficulty || !interviewType || !numberOfQuestions) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: technology, difficulty, interviewType, numberOfQuestions' 
            });
        }

        const questions = await generateInterviewQuestions({
            technology,
            difficulty,
            interviewType,
            numberOfQuestions: parseInt(numberOfQuestions),
        });

        res.json({ 
            success: true, 
            questions 
        });
    } catch (error) {
        next(error);
    }
};

const scoreInterview = async (req, res, next) => {
    try {
        const { questions, userAnswers, technology, difficulty, interviewType, duration } = req.body;
        const userId = req.user?._id; // Will be available if protected route is used

        if (!questions || !userAnswers || !technology || !difficulty || !interviewType) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields for scoring'
            });
        }

        const scoreData = await evaluateInterview({
            questions,
            userAnswers,
            technology,
            difficulty,
            interviewType,
        });

        // Save interview to database if user is logged in
        if (userId) {
            await Interview.create({
                user: userId,
                technology,
                difficulty,
                interviewType,
                overallScore: scoreData.overallScore,
                duration: duration || null, // Save duration if provided
                summaryFeedback: scoreData.summaryFeedback,
                breakdownScores: scoreData.breakdownScores,
                strengths: scoreData.strengths,
                missingConcepts: scoreData.missingConcepts,
                questionReview: scoreData.questionReview,
            });
        }

        res.json({
            success: true,
            score: scoreData,
        });
    } catch (error) {
        next(error);
    }
};

const getInterviewHistory = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const interviews = await Interview.find({ user: userId })
            .sort({ createdAt: -1 })
            .select('technology difficulty interviewType overallScore duration createdAt questionReview');

        // Calculate duration from questionReview length (approximate) if not stored
        const formattedInterviews = interviews.map((interview, index) => {
            let duration;
            if (interview.duration) {
                duration = interview.duration;
            } else {
                // Estimate duration based on question count
                duration = interview.questionReview?.length 
                    ? interview.questionReview.length * 5 + Math.floor(Math.random() * 10) 
                    : 30;
            }
            
            return {
                id: `INT-${interview._id.toString().slice(-4).toUpperCase()}`,
                _id: interview._id,
                tech: interview.technology,
                difficulty: interview.difficulty,
                type: interview.interviewType,
                score: interview.overallScore,
                duration: `${duration}m`,
                date: interview.createdAt,
            };
        });

        res.json({
            success: true,
            interviews: formattedInterviews,
        });
    } catch (error) {
        next(error);
    }
};

const getInterviewStats = async (req, res, next) => {
    try {
        const userId = req.user._id;

        const interviews = await Interview.find({ user: userId });

        if (interviews.length === 0) {
            return res.json({
                success: true,
                stats: {
                    totalSessions: 0,
                    avgScore: 0,
                    totalHours: 0,
                    uniqueTopics: 0,
                },
            });
        }

        // Calculate statistics
        const totalSessions = interviews.length;
        const avgScore = Math.round(
            interviews.reduce((sum, interview) => sum + interview.overallScore, 0) / totalSessions
        );

        // Calculate total hours
        const totalMinutes = interviews.reduce((sum, interview) => {
            if (interview.duration) {
                return sum + interview.duration;
            }
            // Estimate if duration not stored
            const duration = interview.questionReview?.length 
                ? interview.questionReview.length * 5 + Math.floor(Math.random() * 10)
                : 30;
            return sum + duration;
        }, 0);
        const totalHours = (totalMinutes / 60).toFixed(1);

        // Get unique topics
        const uniqueTopics = new Set(interviews.map(i => i.technology)).size;

        res.json({
            success: true,
            stats: {
                totalSessions,
                avgScore,
                totalHours,
                uniqueTopics,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getInterviewById = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const interview = await Interview.findOne({ _id: id, user: userId });

        if (!interview) {
            return res.status(404).json({
                success: false,
                error: 'Interview not found',
            });
        }

        res.json({
            success: true,
            interview,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    generateQuestions,
    scoreInterview,
    getInterviewHistory,
    getInterviewStats,
    getInterviewById,
};
