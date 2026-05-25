import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, AlertCircleIcon, ChevronDownIcon, ChevronUpIcon, RefreshCcwIcon, HomeIcon } from 'lucide-react';

const ScorecardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get data passed from InterviewPage
  const { scoreData, interviewDetails } = location.state || {};

  // Handle case when no data is passed (direct access or refresh)
  if (!scoreData || !interviewDetails) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold mb-4">No Score Data Found</h1>
        <p className="text-muted-foreground mb-6">
          Please complete an interview to view your scorecard.
        </p>
        <button
          onClick={() => navigate('/new-interview')}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold"
        >
          Start a New Interview
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Overall Score and Summary */}
      <div className="bg-card p-6 rounded-lg shadow-md mb-6 flex items-center">
        <div className="relative size-24 mr-6">
          <svg className="size-full" viewBox="0 0 100 100">
            <circle
              className="text-muted-foreground"
              strokeWidth="10"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-primary"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 40}
              strokeDashoffset={2 * Math.PI * 40 * (1 - scoreData.overallScore / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-primary">
            {scoreData.overallScore}
          </span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Interview Complete</p>
          <h1 className="text-3xl font-bold text-foreground mb-2">Good effort!</h1>
          <p className="text-muted-foreground">{scoreData.summaryFeedback}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">{interviewDetails.interviewType}</span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">{interviewDetails.difficulty}</span>
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs">{interviewDetails.technology}</span>
          </div>
        </div>
      </div>

      {/* Breakdown Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg shadow-md">
          <div className="flex items-center text-muted-foreground mb-2">
            <span className="mr-2">Technical</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {scoreData.breakdownScores.Technical !== null ? scoreData.breakdownScores.Technical : '-'}
          </p>
          {scoreData.breakdownScores.Technical !== null && (
            <div className="w-full bg-muted-foreground/20 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${scoreData.breakdownScores.Technical}%` }}
              ></div>
            </div>
          )}
        </div>
        <div className="bg-card p-4 rounded-lg shadow-md">
          <div className="flex items-center text-muted-foreground mb-2">
            <span className="mr-2">Communication</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {scoreData.breakdownScores.Communication !== null ? scoreData.breakdownScores.Communication : '-'}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg shadow-md">
          <div className="flex items-center text-muted-foreground mb-2">
            <span className="mr-2">Depth</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {scoreData.breakdownScores.Depth !== null ? scoreData.breakdownScores.Depth : '-'}
          </p>
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-card p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center text-green-500 mb-4">
          <CheckCircle2Icon className="size-5 mr-2" />
          <h2 className="text-lg font-semibold">Strengths</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {scoreData.strengths.map((strength: string, index: number) => (
            <span key={index} className="px-3 py-1 rounded-md bg-green-500/20 text-green-500 text-sm">
              {strength}
            </span>
          ))}
        </div>
      </div>

      {/* Missing Concepts */}
      <div className="bg-card p-4 rounded-lg shadow-md mb-6">
        <div className="flex items-center text-yellow-500 mb-4">
          <AlertCircleIcon className="size-5 mr-2" />
          <h2 className="text-lg font-semibold">Missing Concepts - Study These</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {scoreData.missingConcepts.map((concept: string, index: number) => (
            <span key={index} className="px-3 py-1 rounded-md bg-yellow-500/20 text-yellow-500 text-sm">
              {concept}
            </span>
          ))}
        </div>
      </div>

      {/* Question-by-Question Review */}
      <div className="bg-card p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Question-by-Question Review</h2>
        {scoreData.questionReview.map((review: any, index: number) => (
          <div key={index} className="mb-4 pb-4 border-b border-muted-foreground/20 last:border-b-0 last:pb-0">
            <div className="flex justify-between items-center mb-2">
              <p className="font-medium text-foreground">Q{index + 1} {review.question}</p>
              <div className="flex items-center">
                <span className="text-primary font-bold mr-2">{review.score}</span>
                {review.score > 75 ? (
                  <ChevronUpIcon className="size-4 text-green-500" />
                ) : (
                  <ChevronDownIcon className="size-4 text-red-500" />
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">AI Feedback: {review.feedback}</p>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button 
          onClick={() => navigate('/new-interview')}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center hover:bg-primary/90 transition-colors"
        >
          <RefreshCcwIcon className="size-5 mr-2" />
          Try Another Interview
        </button>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-lg bg-muted text-muted-foreground font-semibold flex items-center hover:bg-muted/80 transition-colors"
        >
          <HomeIcon className="size-5 mr-2" />
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ScorecardPage;
