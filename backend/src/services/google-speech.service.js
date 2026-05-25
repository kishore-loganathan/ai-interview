const textToSpeech = require('@google-cloud/text-to-speech');
const speech = require('@google-cloud/speech');

// Initialize clients using API key
const ttsClient = new textToSpeech.TextToSpeechClient({
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});

const sttClient = new speech.SpeechClient({
    apiKey: process.env.GOOGLE_CLOUD_API_KEY,
});

/**
 * Convert text to speech using Google Cloud TTS
 * Returns base64-encoded MP3 audio
 */
const synthesizeSpeech = async (text, voiceName = 'en-US-Neural2-D', languageCode = 'en-US') => {
    const request = {
        input: { text },
        voice: {
            languageCode,
            name: voiceName,
        },
        audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.95,
            pitch: 0,
        },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioBase64 = response.audioContent.toString('base64');
    return audioBase64;
};

/**
 * Convert speech (base64 audio) to text using Google Cloud STT
 */
const recognizeSpeech = async (audioBase64, languageCode = 'en-US') => {
    const request = {
        audio: { content: audioBase64 },
        config: {
            encoding: 'WEBM_OPUS',
            sampleRateHertz: 48000,
            languageCode,
            enableAutomaticPunctuation: true,
            model: 'latest_long',
        },
    };

    const [response] = await sttClient.recognize(request);
    const transcript = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

    return transcript;
};

/**
 * List available voices
 */
const listVoices = async (languageCode = 'en-US') => {
    const [result] = await ttsClient.listVoices({ languageCode });
    return result.voices;
};

module.exports = { synthesizeSpeech, recognizeSpeech, listVoices };
