const express = require('express');
const router = express.Router();
const { synthesizeSpeech, recognizeSpeech, listVoices } = require('../services/google-speech.service');
const { protect } = require('../middleware/auth.middleware');

// POST /api/speech/tts — Text to Speech
router.post('/tts', protect, async (req, res) => {
    try {
        const { text, voiceName, languageCode } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }

        if (text.length > 5000) {
            return res.status(400).json({ success: false, error: 'Text too long (max 5000 characters)' });
        }

        const audioBase64 = await synthesizeSpeech(
            text.trim(),
            voiceName || 'en-US-Neural2-D',
            languageCode || 'en-US'
        );

        res.json({ success: true, audio: audioBase64 });
    } catch (error) {
        console.error('TTS error:', error.message);
        res.status(500).json({ success: false, error: error.message || 'TTS failed' });
    }
});

// POST /api/speech/stt — Speech to Text
router.post('/stt', protect, async (req, res) => {
    try {
        const { audio, languageCode } = req.body;

        if (!audio) {
            return res.status(400).json({ success: false, error: 'Audio data is required' });
        }

        const transcript = await recognizeSpeech(audio, languageCode || 'en-US');

        res.json({ success: true, transcript });
    } catch (error) {
        console.error('STT error:', error.message);
        res.status(500).json({ success: false, error: error.message || 'STT failed' });
    }
});

// GET /api/speech/voices — List available voices
router.get('/voices', protect, async (req, res) => {
    try {
        const { languageCode } = req.query;
        const voices = await listVoices(languageCode || 'en-US');

        // Return clean list
        const formatted = voices.map(v => ({
            name: v.name,
            languageCodes: v.languageCodes,
            ssmlGender: v.ssmlGender,
            naturalSampleRateHertz: v.naturalSampleRateHertz,
        }));

        res.json({ success: true, voices: formatted });
    } catch (error) {
        console.error('List voices error:', error.message);
        res.status(500).json({ success: false, error: error.message || 'Failed to list voices' });
    }
});

module.exports = router;
