require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./src/config/db');
const interviewRoutes = require('./src/routes/interview.routes');
const authRoutes = require('./src/routes/auth.routes');
const speechRoutes = require('./src/routes/speech.routes');
const errorHandler = require('./src/middleware/error.middleware');

const app = express();
const port = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// CORS Configuration - Very permissive for development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'AI Interview Backend is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/speech', speechRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
    console.log(`🚀 Backend server running at http://localhost:${port}`);
});
