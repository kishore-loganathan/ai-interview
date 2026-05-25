const axios = require('axios');

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not defined in environment variables');
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const callGroqAPI = async (messages, options = {}) => {
    try {
        const response = await axios.post(
            GROQ_API_URL,
            {
                model: options.model || 'llama-3.1-8b-instant',
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.max_tokens || 4000,
                stream: false,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Groq API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.error?.message || 'Failed to call Groq API');
    }
};

module.exports = {
    callGroqAPI,
};
