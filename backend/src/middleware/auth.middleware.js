const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, error: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};

// Middleware to check if user is admin
const adminOnly = async (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            error: 'Access denied. Admin privileges required.' 
        });
    }
};

// Middleware to check if user is superadmin
const superAdminOnly = async (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        next();
    } else {
        res.status(403).json({ 
            success: false, 
            error: 'Access denied. Super admin privileges required.' 
        });
    }
};

module.exports = { protect, adminOnly, superAdminOnly };
