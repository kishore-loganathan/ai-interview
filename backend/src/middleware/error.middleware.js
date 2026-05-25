const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle Gemini API rate limit / quota errors nicely
    if (err.message?.includes('429') || 
        err.message?.includes('Too Many Requests') || 
        err.message?.includes('quota exceeded') ||
        err.message?.includes('free_tier')) {
        
        statusCode = 429;
        message = "AI service is currently rate limited. Please wait a moment and try again. (Free tier quota exceeded)";
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
