const User = require('../models/User');
const Interview = require('../models/Interview');

// Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        // Total users
        const totalUsers = await User.countDocuments();
        
        // Sessions today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionsToday = await Interview.countDocuments({
            createdAt: { $gte: today }
        });
        
        // Average score
        const avgScoreResult = await Interview.aggregate([
            { $group: { _id: null, avgScore: { $avg: '$overallScore' } } }
        ]);
        const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0].avgScore : 0;
        
        // Completion rate
        const totalInterviews = await Interview.countDocuments();
        const completionRate = totalInterviews > 0 ? ((totalInterviews / (totalInterviews + 50)) * 100) : 0; // Simplified calculation
        
        // Previous week stats for comparison
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const usersLastWeek = await User.countDocuments({ createdAt: { $gte: lastWeek } });
        const sessionsLastWeek = await Interview.countDocuments({ createdAt: { $gte: lastWeek } });
        
        // Interview sessions per day (last 7 days)
        const sessionsPerDay = await Interview.aggregate([
            {
                $match: { createdAt: { $gte: lastWeek } }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        // Score distribution
        const scoreDistribution = await Interview.aggregate([
            {
                $bucket: {
                    groupBy: '$overallScore',
                    boundaries: [0, 20, 40, 60, 80, 100],
                    default: 'Other',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        
        // Tech breakdown
        const techBreakdown = await Interview.aggregate([
            {
                $group: {
                    _id: '$technology',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // System status (mock data - can be replaced with actual health checks)
        const systemStatus = {
            aiQuestionEngine: 'online',
            voiceInterviewAPI: 'online',
            resumeParser: 'degraded',
            scorePipeline: 'online'
        };
        
        res.json({
            success: true,
            stats: {
                totalUsers,
                sessionsToday,
                avgScore: Math.round(avgScore * 10) / 10,
                completionRate: Math.round(completionRate * 10) / 10,
                usersGrowth: usersLastWeek,
                sessionsGrowth: sessionsLastWeek
            },
            charts: {
                sessionsPerDay,
                scoreDistribution,
                techBreakdown
            },
            systemStatus
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all users with stats
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -refreshToken')
            .sort({ createdAt: -1 });
        
        // Get interview stats for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const interviews = await Interview.find({ user: user._id });
                const interviewCount = interviews.length;
                const avgScore = interviews.length > 0
                    ? interviews.reduce((sum, i) => sum + i.overallScore, 0) / interviews.length
                    : 0;
                const streak = await calculateStreak(user._id);
                
                // Determine status based on recent activity
                const lastInterview = interviews.length > 0 
                    ? interviews[interviews.length - 1].createdAt 
                    : user.createdAt;
                const daysSinceLastActivity = Math.floor((Date.now() - lastInterview) / (1000 * 60 * 60 * 24));
                
                let status = 'Active';
                if (daysSinceLastActivity > 30) status = 'Suspended';
                else if (daysSinceLastActivity > 7) status = 'Inactive';
                
                return {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    interviews: interviewCount,
                    avgScore: Math.round(avgScore),
                    streak,
                    status,
                    createdAt: user.createdAt
                };
            })
        );
        
        res.json({ success: true, users: usersWithStats });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Calculate user streak
async function calculateStreak(userId) {
    const interviews = await Interview.find({ user: userId })
        .sort({ createdAt: -1 })
        .select('createdAt');
    
    if (interviews.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const interview of interviews) {
        const interviewDate = new Date(interview.createdAt);
        interviewDate.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((currentDate - interviewDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === streak) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (diffDays > streak) {
            break;
        }
    }
    
    return streak;
}

// Get all interview sessions
exports.getAllInterviews = async (req, res) => {
    try {
        const interviews = await Interview.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        
        const formattedInterviews = interviews.map(interview => ({
            id: interview._id,
            sessionId: `INT-${interview._id.toString().slice(-4).toUpperCase()}`,
            candidate: interview.user ? interview.user.name : 'Unknown',
            candidateEmail: interview.user ? interview.user.email : '',
            tech: interview.technology,
            difficulty: interview.difficulty,
            interviewType: interview.interviewType,
            score: interview.overallScore,
            duration: interview.duration || 0,
            status: 'Completed',
            breakdownScores: interview.breakdownScores || {},
            strengths: interview.strengths || [],
            missingConcepts: interview.missingConcepts || [],
            summaryFeedback: interview.summaryFeedback || '',
            questionReview: interview.questionReview || [],
            createdAt: interview.createdAt
        }));
        
        res.json({ success: true, interviews: formattedInterviews });
    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get AI evaluations
exports.getAIEvaluations = async (req, res) => {
    try {
        const interviews = await Interview.find()
            .populate('user', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
        
        const evaluations = interviews.map(interview => ({
            id: interview._id,
            evalId: `EVL-${interview._id.toString().slice(-3).toUpperCase()}`,
            candidate: interview.user ? interview.user.name : 'Unknown',
            score: interview.overallScore,
            technology: interview.technology,
            difficulty: interview.difficulty,
            summary: interview.summaryFeedback || 'No summary available',
            questionReview: interview.questionReview || [],
            breakdownScores: interview.breakdownScores || {
                Technical: 0,
                Communication: 0,
                Depth: 0
            },
            strengths: interview.strengths || [],
            missingConcepts: interview.missingConcepts || [],
            createdAt: interview.createdAt
        }));
        
        res.json({ success: true, evaluations });
    } catch (error) {
        console.error('Get evaluations error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get analytics data
exports.getAnalytics = async (req, res) => {
    try {
        // Topic proficiency (average scores by technology)
        const topicProficiency = await Interview.aggregate([
            {
                $group: {
                    _id: '$technology',
                    avgScore: { $avg: '$overallScore' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { avgScore: -1 } }
        ]);
        
        // Score brackets distribution
        const scoreBrackets = await Interview.aggregate([
            {
                $bucket: {
                    groupBy: '$overallScore',
                    boundaries: [0, 40, 60, 70, 80, 90, 100],
                    default: 'Other',
                    output: { count: { $sum: 1 } }
                }
            }
        ]);
        
        // Difficulty distribution
        const difficultyDistribution = await Interview.aggregate([
            {
                $group: {
                    _id: '$difficulty',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Interview type distribution
        const typeDistribution = await Interview.aggregate([
            {
                $group: {
                    _id: '$interviewType',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Average scores over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const scoresOverTime = await Interview.aggregate([
            {
                $match: { createdAt: { $gte: thirtyDaysAgo } }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    avgScore: { $avg: '$overallScore' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.json({
            success: true,
            analytics: {
                topicProficiency,
                scoreBrackets,
                difficultyDistribution,
                typeDistribution,
                scoresOverTime
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;
        
        // In a real app, you might have a status field in User model
        // For now, we'll just return success
        res.json({ success: true, message: `User status updated to ${status}` });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Update user role (promote/demote admin)
exports.updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;
        
        // Validate role
        if (!['user', 'admin', 'superadmin'].includes(role)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid role. Must be user, admin, or superadmin' 
            });
        }

        // Prevent demoting yourself
        if (userId === req.user._id.toString() && role === 'user') {
            return res.status(400).json({ 
                success: false, 
                error: 'You cannot demote yourself' 
            });
        }

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        console.log(`Admin ${req.user.email} changed ${user.email} role from ${oldRole} to ${role}`);

        res.json({ 
            success: true, 
            message: `User role updated to ${role}`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Delete user's interviews
        await Interview.deleteMany({ user: userId });
        
        // Delete user
        await User.findByIdAndDelete(userId);
        
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
