import React, { useState, useEffect, useRef } from 'react';
import { MicIcon, MicOffIcon, Volume2Icon, VolumeXIcon, FileTextIcon, Settings2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { speechAPI } from '@/services/api';

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    technology, 
    difficulty, 
    interviewType, 
    numberOfQuestions,
    voiceInterviewMode,
    interviewMode // 'speak' or 'written'
  } = location.state || {};

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [allUserAnswers, setAllUserAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(150);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Voice-related states
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true); // Google API always supported
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<{ name: string; ssmlGender: string }[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('en-US-Neural2-D');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');

  // Audio recording refs for Google STT
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isLoggedIn = !!(localStorage.getItem('accessToken') || localStorage.getItem('token'));
  const isSpeakMode = interviewMode === 'speak';

  // Load available Google voices on mount
  useEffect(() => {
    const savedVoice = localStorage.getItem('selectedGoogleVoice');
    if (savedVoice) setSelectedVoice(savedVoice);

    speechAPI.listVoices()
      .then(data => {
        if (data.success) {
          // Filter to Neural2 and Wavenet voices for best quality
          const quality = data.voices.filter((v: any) =>
            v.name.includes('Neural2') || v.name.includes('Wavenet')
          );
          setAvailableVoices(quality);
        }
      })
      .catch(() => {
        // Fallback list if API call fails
        setAvailableVoices([
          { name: 'en-US-Neural2-D', ssmlGender: 'MALE' },
          { name: 'en-US-Neural2-F', ssmlGender: 'FEMALE' },
          { name: 'en-US-Neural2-A', ssmlGender: 'MALE' },
          { name: 'en-US-Neural2-C', ssmlGender: 'FEMALE' },
          { name: 'en-US-Wavenet-D', ssmlGender: 'MALE' },
          { name: 'en-US-Wavenet-F', ssmlGender: 'FEMALE' },
        ]);
      });
  }, []);

  // Speak question when it changes
  useEffect(() => {
    if (isSpeakMode && questions.length > 0 && !loading) {
      speakText(questions[currentQuestionIndex]);
    }
  }, [currentQuestionIndex, questions, isSpeakMode, loading]);

  // Google Cloud TTS — plays audio from backend
  const speakText = async (text: string) => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      setSpeechError(null);

      const data = await speechAPI.tts(text, selectedVoice);

      if (!data.success) throw new Error(data.error);

      // Decode base64 MP3 and play it
      const audioBlob = base64ToBlob(data.audio, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        setSpeechError('Failed to play audio.');
      };

      await audio.play();
    } catch (err: any) {
      setIsSpeaking(false);
      setSpeechError('TTS failed: ' + (err.message || 'Unknown error'));
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteChars = atob(base64);
    const byteArrays = [];
    for (let i = 0; i < byteChars.length; i += 512) {
      const slice = byteChars.slice(i, i + 512);
      const byteNumbers = Array.from(slice).map(c => c.charCodeAt(0));
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: mimeType });
  };

  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoice(voiceName);
    localStorage.setItem('selectedGoogleVoice', voiceName);
    setShowVoiceSettings(false);
    speakText('Voice updated. This is how I sound.');
  };

  // Google Cloud STT — records mic audio and sends to backend
  const toggleListening = async () => {
    if (isListening) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      setSpeechError(null);
      setInterimTranscript('Listening...');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        setInterimTranscript('Processing...');

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          const base64 = await blobToBase64(audioBlob);

          const data = await speechAPI.stt(base64);

          if (data.success && data.transcript) {
            setCurrentAnswer(prev => prev + (prev ? ' ' : '') + data.transcript);
          } else {
            setSpeechError('No speech detected. Try again.');
          }
        } catch (err: any) {
          setSpeechError('STT failed: ' + (err.message || 'Unknown error'));
        } finally {
          setInterimTranscript('');
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setSpeechError('Microphone access denied. Please allow microphone access.');
      } else {
        setSpeechError('Could not start recording: ' + err.message);
      }
      setIsListening(false);
      setInterimTranscript('');
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const toggleSpeaking = () => {
    speakText(questions[currentQuestionIndex]);
  };

  const stopAllVoice = () => {
    if (isListening && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsListening(false);
    }
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (!technology || !difficulty || !interviewType || !numberOfQuestions) {
      setError('Interview parameters missing. Please go back and set up the interview.');
      setLoading(false);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/interview/generate-questions', { // Changed API endpoint
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ technology, difficulty, interviewType, numberOfQuestions }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch questions');
        }

        const data = await response.json();
        setQuestions(data.questions);
        setAllUserAnswers(new Array(data.questions.length).fill('')); // Initialize user answers array
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [technology, difficulty, interviewType, numberOfQuestions]);

  useEffect(() => {
    if (loading || error || questions.length === 0 || isSubmitting) return; // Added isSubmitting

    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          // Optionally handle what happens when timer runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [loading, error, questions, isSubmitting]); // Added isSubmitting to dependencies

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmitInterview = async () => {
    setIsSubmitting(true);
    setError(null);

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');

    try {
      const response = await fetch('http://localhost:3001/api/interview/score-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          questions,
          userAnswers: allUserAnswers,
          technology,
          difficulty,
          interviewType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get interview score');
      }

      const data = await response.json();
      navigate('/scorecard', { 
        state: { 
          scoreData: data.score, 
          interviewDetails: { technology, difficulty, interviewType } 
        } 
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    // Stop all voice activities
    stopAllVoice();
    
    // Save current answer
    setAllUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = currentAnswer;
      return newAnswers;
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentAnswer(allUserAnswers[currentQuestionIndex + 1] || '');
      setTimer(150);
    } else {
      handleSubmitInterview();
    }
  };

  const handleSkip = () => {
    // Stop all voice activities
    stopAllVoice();
    
    // Save empty answer for skipped question
    setAllUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = '';
      return newAnswers;
    });
    handleNext();
  };

  if (loading) {
    return <div className="p-6 text-foreground">Loading questions...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  if (questions.length === 0) {
    return <div className="p-6 text-foreground">No questions generated. Please try again.</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => {
              stopAllVoice();
              navigate('/dashboard');
            }}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <span className="mr-2">←</span> Exit Interview
          </button>
          <div className="text-gray-400">AI Interview Engine</div>
        </div>

        {/* Login Warning Banner */}
        {!isLoggedIn && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm flex items-center">
            <span className="font-medium">Note:</span> 
            &nbsp;You must be logged in to save your interview results and view them later in History.
          </div>
        )}

        {/* Voice/Written Mode Banner */}
        {isSpeakMode && (
          <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <MicIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold">Speak Mode Active</div>
                  <div className="text-sm text-gray-400">
                    {speechSupported
                      ? selectedVoice
                        ? `Voice: ${selectedVoice.name}`
                        : "Use voice to answer or type as fallback"
                      : "Voice unavailable - you can type your answers"}
                  </div>
                </div>
              </div>
              {speechSupported && availableVoices.length > 0 && (
                <button
                  onClick={() => setShowVoiceSettings(!showVoiceSettings)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-sm transition-colors"
                >
                  <Settings2 className="w-4 h-4" />
                  {selectedVoice.replace('en-US-', '')}
                </button>
              )}
            </div>

            {/* Google Voice Selector */}
            {showVoiceSettings && (
              <div className="mt-4 pt-4 border-t border-indigo-500/20">
                <p className="text-sm text-gray-400 mb-3 font-medium">🎙️ Google Cloud Neural Voice</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {availableVoices.map((voice) => (
                    <button
                      key={voice.name}
                      onClick={() => handleVoiceChange(voice.name)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                        selectedVoice === voice.name
                          ? 'bg-indigo-600 text-white'
                          : 'bg-[#1a1a24] text-gray-300 hover:bg-indigo-600/20 hover:text-indigo-300'
                      }`}
                    >
                      <span className="truncate font-medium">{voice.name.replace('en-US-', '')}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ml-2 flex-shrink-0 ${
                        voice.ssmlGender === 'FEMALE'
                          ? 'bg-pink-500/20 text-pink-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {voice.ssmlGender === 'FEMALE' ? '♀' : '♂'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isSpeakMode && (
          <div className="mb-6 p-4 bg-gray-500/10 border border-gray-700 rounded-xl text-gray-300 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <FileTextIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold">Written Mode</div>
              <div className="text-sm text-gray-400">Type your answers in the text box below.</div>
            </div>
          </div>
        )}

        {/* Question Progress */}
        <div className="flex items-center mb-6">
          <span className="text-lg font-semibold mr-4">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex space-x-1 flex-1">
            {Array.from({ length: questions.length }).map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full flex-1 ${
                  index <= currentQuestionIndex ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              ></div>
            ))}
          </div>
        </div>

        {/* Timer and Difficulty */}
        <div className="flex justify-end items-center mb-6 gap-3">
          <span className="text-green-400 font-bold text-xl">{formatTime(timer)}</span>
          <span className="px-3 py-1 rounded-lg bg-[#252530] text-gray-300 text-sm">
            {interviewType}
          </span>
          <span className="px-3 py-1 rounded-lg bg-[#252530] text-gray-300 text-sm">
            {difficulty}
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-[#1a1a24] p-6 rounded-xl shadow-lg mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center text-gray-400 text-sm">
              <span className="mr-2">AI Question</span> • {interviewType}
            </div>
            {speechSupported && (
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleSpeaking}
                className={`${
                  isSpeaking 
                    ? 'text-indigo-400 bg-indigo-600/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeXIcon className="w-4 h-4 mr-2" />
                    Stop Reading
                  </>
                ) : (
                  <>
                    <Volume2Icon className="w-4 h-4 mr-2" />
                    Read Question
                  </>
                )}
              </Button>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {currentQuestion}
          </h2>
          <div className="flex flex-wrap gap-2 text-sm text-gray-400">
            <span className="px-3 py-1 rounded-lg bg-[#252530]">Think through the concept</span>
            <span className="px-3 py-1 rounded-lg bg-[#252530]">Use a real example</span>
            <span className="px-3 py-1 rounded-lg bg-[#252530]">Cover edge cases</span>
          </div>
        </div>

        {/* Answer Section */}
        <div className="bg-[#1a1a24] p-6 rounded-xl shadow-lg mb-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Answer</h2>
            {isSpeakMode && speechSupported && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={toggleListening}
                  className={`${
                    isListening 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOffIcon className="w-4 h-4 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <MicIcon className="w-4 h-4 mr-2" />
                      Start Recording
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
          
          {isSpeakMode ? (
            // Speak Mode UI with typing fallback
            <div className="space-y-4">
              {speechError && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 flex items-center gap-3">
                  <div className="text-sm">
                    <strong>Voice unavailable:</strong> {speechError}
                    <br />
                    <span className="text-gray-400">You can type your answer below instead.</span>
                  </div>
                </div>
              )}
              
              {isListening && !speechError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                    <div className="font-semibold">Recording in progress...</div>
                    <div className="text-sm text-gray-400">Speak clearly into your microphone</div>
                  </div>
                </div>
              )}
              
              {/* Always show textarea in speak mode as fallback */}
              <textarea
                className="w-full h-40 p-4 rounded-lg bg-[#252530] text-white border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Your answer will appear here as you speak, or you can type directly..."
                value={currentAnswer + (interimTranscript ? interimTranscript : '')}
                onChange={(e) => {
                  // Only allow manual editing when not listening
                  if (!isListening) {
                    setCurrentAnswer(e.target.value);
                  }
                }}
                readOnly={isListening}
              ></textarea>
              
              {isListening && interimTranscript && (
                <div className="text-xs text-gray-400 italic">
                  Speaking... (text in gray is being processed)
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">
                  {currentAnswer.length} characters
                  {interimTranscript && ` (+${interimTranscript.length} processing...)`}
                </span>
              </div>
            </div>
          ) : (
            // Written Mode UI
            <div>
              <textarea
                className="w-full h-40 p-4 rounded-lg bg-[#252530] text-white border border-gray-700 focus:outline-none focus:border-indigo-500 resize-none"
                placeholder="Type your answer here. Be thorough — cover the concept, implementation details, and any tradeoffs..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
              ></textarea>
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-400">{currentAnswer.length} characters</span>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-4 mt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="bg-[#252530] text-gray-300 border-gray-700 hover:bg-[#2a2a35]"
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? 'Submitting...' : currentQuestionIndex === questions.length - 1 ? 'Submit' : 'Next →'}
            </Button>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="flex items-center text-sm text-gray-400">
          <span className="mr-2">💡</span> Take your time. AI evaluates depth and clarity, not speed.
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;