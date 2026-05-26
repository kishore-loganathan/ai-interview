const express = require('express');
const router = express.Router();
const multer = require('multer');
const { synthesizeSpeech, recognizeSpeech, listVoices } = require('../services/google-speech.service');
const { protect } = require('../middleware/auth.middleware');

// Configure multer for memory storage (audio files)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

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
// Supports both base64 JSON and multipart file upload
router.post('/stt', protect, upload.single('audio'), async (req, res) => {
    try {
        let audioBase64;

        // Check if file was uploaded via multipart
        if (req.file) {
            // Convert buffer to base64
            audioBase64 = req.file.buffer.toString('base64');
        } else if (req.body.audio) {
            // Use base64 from JSON body (backward compatibility)
            audioBase64 = req.body.audio;
        } else {
            return res.status(400).json({ success: false, error: 'Audio data is required' });
        }

        const languageCode = req.body.languageCode || 'en-US';
        const transcript = await recognizeSpeech(audioBase64, languageCode);

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
