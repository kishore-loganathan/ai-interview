import React, { useState, useEffect } from 'react';
import { MinusIcon, PlusIcon, MicIcon, FileTextIcon, PlayIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const InterviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { technology, difficulty, interviewType, numberOfQuestions } = location.state || {};

  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [allUserAnswers, setAllUserAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(150); // 2 minutes 30 seconds for demo
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = !!localStorage.getItem('token');

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

    const token = localStorage.getItem('token');

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
    // Save current answer
    setAllUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = currentAnswer;
      return newAnswers;
    });

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentAnswer(allUserAnswers[currentQuestionIndex + 1] || ''); // Load next question's answer or empty
      setTimer(150); // Reset timer for next question
    } else {
      // End of interview, submit answers for scoring
      handleSubmitInterview(); // Call new submit function
    }
  };

  const handleSkip = () => {
    // Save empty answer for skipped question
    setAllUserAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = '';
      return newAnswers;
    });
    handleNext(); // Move to the next question or submit
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center text-muted-foreground">
          <span className="mr-2">&lt;</span> Exit Interview
        </div>
        <div className="text-muted-foreground">AI Interview Engine</div>
      </div>

      {/* Login Warning Banner */}
      {!isLoggedIn && (
        <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-600 text-sm flex items-center">
          <span className="font-medium">Note:</span> 
          &nbsp;You must be logged in to save your interview results and view them later in History.
        </div>
      )}

      {/* Question Progress */}
      <div className="flex items-center mb-6">
        <span className="text-lg font-semibold text-foreground mr-2">Question {currentQuestionIndex + 1} of {questions.length}</span>
        <div className="flex space-x-1">
          {Array.from({ length: questions.length }).map((_, index) => (
            <div
              key={index}
              className={`w-8 h-2 rounded-full ${index <= currentQuestionIndex ? 'bg-primary' : 'bg-muted-foreground'
                }`}
            ></div>
          ))}
        </div>
      </div>

      {/* Timer and Difficulty */}
      <div className="flex justify-end items-center mb-6">
        <span className="text-green-500 font-bold text-xl mr-4">{formatTime(timer)}</span>
        <span className="px-3 py-1 rounded-md bg-muted text-muted-foreground text-sm mr-2">{interviewType}</span>
        <span className="px-3 py-1 rounded-md bg-muted text-muted-foreground text-sm">{difficulty}</span>
      </div>

      {/* Question Card */}
      <div className="bg-card p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center text-muted-foreground mb-4">
          <span className="mr-2">AI Question</span> &bull; {interviewType}
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {currentQuestion}
        </h2>
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="px-3 py-1 rounded-md bg-muted">Think through the concept</span>
          <span className="px-3 py-1 rounded-md bg-muted">Use a real example</span>
          <span className="px-3 py-1 rounded-md bg-muted">Cover edge cases</span>
        </div>
      </div>

      {/* Answer Section */}
      <div className="bg-card p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Your Answer</h2>
        <textarea
          className="w-full h-40 p-4 rounded-md bg-muted text-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder="Type your answer here. Be thorough — cover the concept, implementation details, and any tradeoffs..."
          value={currentAnswer}
          onChange={(e) => setCurrentAnswer(e.target.value)}
        ></textarea>
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-muted-foreground">{currentAnswer.length} characters</span>
          <div className="flex space-x-4">
            <button
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground hover:bg-accent"
              onClick={handleSkip}
            >
              Skip
            </button>
            <button
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground flex items-center"
              onClick={handleNext}
            >
              Next <span className="ml-2">&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Hint */}
      <div className="flex items-center text-sm text-muted-foreground">
        <span className="mr-2">&diams;</span> Take your time. AI evaluates depth and clarity, not speed.
      </div>
    </div>
  );
};

export default InterviewPage;