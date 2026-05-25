const express = require('express');
const router = express.Router();
const { registerUser, loginUser, refreshToken, logoutUser, changePassword, updateProfile, uploadProfilePicture, upload } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logoutUser);
router.post('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);
router.post('/upload-profile-picture', protect, upload.single('profilePicture'), uploadProfilePicture);

module.exports = router;
