const { callGroqAPI } = require('../config/groq.config');

// Helper to retry Groq calls on rate limit
const callGroqWithRetry = async (messages, options = {}, maxRetries = 3) => {
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await callGroqAPI(messages, options);
            return response;
        } catch (error) {
            lastError = error;

            const isRateLimit = error.message?.includes('429') || 
                               error.message?.includes('rate limit') ||
                               error.message?.includes('Rate limit');

            if (!isRateLimit || attempt === maxRetries) {
                throw error;
            }

            // Exponential backoff: 2s, 4s, 8s...
            const delay = Math.pow(2, attempt + 1) * 1000;
            console.log(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
};

const generateInterviewQuestions = async ({ technology, difficulty, interviewType, numberOfQuestions }) => {
    const messages = [
        {
            role: 'user',
            content: `Generate ${numberOfQuestions} ${difficulty} ${interviewType} interview questions for ${technology}. Return only JSON array of strings, no markdown.`
        }
    ];

    const response = await callGroqWithRetry(messages, { 
        temperature: 0.7, 
        model: 'llama-3.1-8b-instant',
        max_tokens: 800 // Reduced token limit
    });
    
    const text = response.trim().replace(/```json|```/g, '').trim();

    let questions;
    try {
        questions = JSON.parse(text);
    } catch (error) {
        console.error('Failed to parse Groq response:', text);
        throw new Error('Invalid JSON response from AI');
    }

    if (!Array.isArray(questions)) {
        throw new Error('AI did not return an array of questions');
    }

    return questions;
};

const evaluateInterview = async (interviewData) => {
    const { questions, userAnswers, technology, difficulty, interviewType } = interviewData;

    // Create a more concise conversation format
    const qa = questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${userAnswers[i] || "No answer"}`).join('\n\n');

    const messages = [
        {
            role: 'user',
            content: `Evaluate this ${technology} ${difficulty} ${interviewType} interview. Return JSON only:
{
  "overallScore": number,
  "summaryFeedback": "brief summary",
  "breakdownScores": {"Technical": number, "Communication": number, "Depth": number},
  "strengths": ["strength1", "strength2"],
  "missingConcepts": ["concept1", "concept2"],
  "questionReview": [{"question": "q", "userAnswer": "a", "score": number, "feedback": "brief"}]
}

${qa}`
        }
    ];

    const response = await callGroqWithRetry(messages, { 
        temperature: 0.3, 
        max_tokens: 2500, // Reduced from 6000
        model: 'llama-3.1-8b-instant' 
    });
    
    const text = response.trim().replace(/```json|```/g, '').trim();

    let scoreData;
    try {
        scoreData = JSON.parse(text);
    } catch (error) {
        console.error('Failed to parse Groq scoring response:', text);
        throw new Error('Invalid JSON response from AI for scoring');
    }

    return scoreData;
};

module.exports = {
    generateInterviewQuestions,
    evaluateInterview,
};
