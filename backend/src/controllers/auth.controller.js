const User = require('../models/User');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
        expiresIn: '15m' // Short-lived access token
    });
};

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key', {
        expiresIn: '7d' // Long-lived refresh token
    });
};

// @desc    Register new user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide name, email and password' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Check if this is the first user - make them admin
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'admin' : 'user';

        const user = await User.create({ name, email, password, role });

        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Store refresh token in user document
        user.refreshToken = refreshToken;
        await user.save();

        // Log if first user was made admin
        if (role === 'admin') {
            console.log(`🎉 First user registered as admin: ${email}`);
        }

        res.status(201).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        // Handle duplicate email from MongoDB unique index
        if (error.code === 11000 && error.keyPattern?.email) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong during signup' });
    }
};

// @desc    Authenticate user & get token
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const accessToken = generateAccessToken(user._id);
            const refreshToken = generateRefreshToken(user._id);

            // Store refresh token in user document
            user.refreshToken = refreshToken;
            await user.save();

            res.json({
                success: true,
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong during login' });
    }
};

// @desc    Refresh access token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret_key');

        // Find user and check if refresh token matches
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== refreshToken) {
            return res.status(403).json({ success: false, error: 'Invalid refresh token' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user._id);

        res.json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(403).json({ success: false, error: 'Invalid or expired refresh token' });
    }
};

// @desc    Logout user
const logoutUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, error: 'Something went wrong during logout' });
    }
};

// @desc    Change user password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'Current password and new password are required' 
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ 
                success: false, 
                error: 'New password must be at least 8 characters long' 
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Current password is incorrect' 
            });
        }

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({ 
                success: false, 
                error: 'New password must be different from current password' 
            });
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Something went wrong while changing password' 
        });
    }
};

// @desc    Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const updateData = req.body;

        // Prevent updating sensitive fields
        delete updateData.password;
        delete updateData.email; // Email change should have separate flow if needed
        delete updateData.refreshToken;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            ...updatedUser.toObject()
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Something went wrong while updating profile' 
        });
    }
};

// @desc    Upload profile picture
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        const userId = req.user._id;
        const filePath = `/uploads/profile-pictures/${req.file.filename}`;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePicture: filePath },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            message: 'Profile picture uploaded successfully',
            profilePicture: filePath
        });
    } catch (error) {
        console.error('Upload profile picture error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Something went wrong while uploading profile picture' 
        });
    }
};

// @desc    Get current user
const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -refreshToken');
        
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                location: user.location,
                profilePicture: user.profilePicture,
                primarySkill: user.primarySkill,
                difficulty: user.difficulty,
                notifications: user.notifications,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Something went wrong while fetching user data' 
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    changePassword,
    updateProfile,
    uploadProfilePicture,
    getCurrentUser,
    upload  // Export multer middleware
};
