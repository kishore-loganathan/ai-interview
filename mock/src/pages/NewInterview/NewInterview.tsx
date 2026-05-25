import React, { useState } from 'react';
import { MinusIcon, PlusIcon, MicIcon, FileTextIcon, PlayIcon } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [selectedTechnology, setSelectedTechnology] = useState<string>('React');
  const [customTechnology, setCustomTechnology] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');
  const [selectedInterviewType, setSelectedInterviewType] = useState<string>('Technical');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(15);
  const [voiceInterviewMode, setVoiceInterviewMode] = useState<boolean>(false);
  const [resumeBasedQuestions, setResumeBasedQuestions] = useState<boolean>(false);

  const technologies = ['React', 'MERN', 'DSA', 'Java', 'HR'];
  const difficulties = [
    { label: 'Easy', time: '~20m', color: 'text-green-500', dotColor: 'bg-green-500' },
    { label: 'Medium', time: '~35m', color: 'text-yellow-500', dotColor: 'bg-yellow-500' },
    { label: 'Hard', time: '~50m', color: 'text-red-500', dotColor: 'bg-red-500' },
  ];
  const interviewTypes = [
    { label: 'Technical', dotColor: 'bg-blue-500' },
    { label: 'HR', dotColor: 'bg-purple-500' },
    { label: 'Mixed', dotColor: 'bg-cyan-500' },
  ];

  const handleTechnologyClick = (tech: string) => {
    setSelectedTechnology(tech);
    setShowCustomInput(false);
    setCustomTechnology('');
  };

  const handleCustomTechnologyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTechnology(e.target.value);
    setSelectedTechnology(''); // Deselect predefined technologies when custom is typed
  };

  const handleOtherClick = () => {
    setShowCustomInput(true);
    setSelectedTechnology('');
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumberOfQuestions(Number(e.target.value));
  };

  const incrementQuestions = () => {
    setNumberOfQuestions((prev) => Math.min(prev + 1, 15));
  };

  const decrementQuestions = () => {
    setNumberOfQuestions((prev) => Math.min(prev - 1, 3));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Set Up Your Interview</h1>
      <p className="text-muted-foreground mb-6">Customize your session to match your target role.</p>

      {/* Technology Section */}
      <div className="bg-card p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Technology</h2>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => (
            <button
              key={tech}
              className={`px-4 py-2 rounded-md ${selectedTechnology === tech
                ? 'border border-primary bg-primary-active-bg text-primary'
                : 'bg-muted text-muted-foreground hover:bg-accent'
                }`}
              onClick={() => handleTechnologyClick(tech)}
            >
              {tech}
            </button>
          ))}
          <button
            className={`px-4 py-2 rounded-md ${showCustomInput
              ? 'border border-primary bg-primary-active-bg text-primary'
              : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            onClick={handleOtherClick}
          >
            Other
          </button>
          {showCustomInput && (
            <input
              type="text"
              className="px-4 py-2 rounded-md bg-muted text-muted-foreground border border-input focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter custom technology"
              value={customTechnology}
              onChange={handleCustomTechnologyChange}
            />
          )}
        </div>
      </div>

      {/* Difficulty Section */}
      <div className='flex flex-row gap-6'>
        <div className="bg-card p-4 rounded-lg shadow-md mb-6 w-1/2">

          <h2 className="text-lg font-semibold text-foreground mb-4">Difficulty</h2>
          <div className="grid grid-cols-1 gap-2">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty.label}
                className={`flex items-center justify-between p-3 rounded-md transition-colors ${selectedDifficulty === difficulty.label
                  ? 'border border-primary bg-primary-active-bg text-primary'
                  : 'bg-muted hover:bg-accent'
                  }`}
                onClick={() => setSelectedDifficulty(difficulty.label)}
              >
                <div className="flex items-center">
                  <span className={`size-2 rounded-full mr-2 ${difficulty.dotColor}`}></span>
                  <span className="font-medium">{difficulty.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{difficulty.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interview Type Section */}
        <div className="bg-card p-4 rounded-lg shadow-md mb-6 w-1/2">
          <h2 className="text-lg font-semibold text-foreground mb-4">Interview Type</h2>
          <div className="grid grid-cols-1 gap-2">
            {interviewTypes.map((type) => (
              <button
                key={type.label}
                className={`flex items-center p-3 rounded-md transition-colors ${selectedInterviewType === type.label
                  ? 'border border-primary bg-primary-active-bg text-primary'
                  : 'bg-muted hover:bg-accent'
                  }`}
                onClick={() => setSelectedInterviewType(type.label)}
              >
                <span className={`size-2 rounded-full mr-2 ${type.dotColor}`}></span>
                <span className="font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Number of Questions Section */}
      <div className="bg-card p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">Number of Questions</h2>
          <span className="text-2xl font-bold text-primary">{numberOfQuestions}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-md bg-muted hover:bg-accent disabled:opacity-50"
            onClick={decrementQuestions}
            disabled={numberOfQuestions <= 3}
          >
            <MinusIcon className="size-4" />
          </button>
          <input
            type="range"
            min="3"
            max="15"
            value={numberOfQuestions}
            onChange={handleQuestionChange}
            className="flex-grow h-2 rounded-lg appearance-none cursor-pointer bg-muted-foreground/50 accent-primary"
          />
          <button
            className="p-2 rounded-md bg-muted hover:bg-accent disabled:opacity-50"
            onClick={incrementQuestions}
            disabled={numberOfQuestions >= 15}
          >
            <PlusIcon className="size-4" />
          </button>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>3 min</span>
          <span>15 max</span>
        </div>
      </div>

      {/* Advanced Options Section */}
      <div className="bg-card p-4 rounded-lg shadow-md mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Advanced Options</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MicIcon className="size-5 mr-3 text-muted-foreground" />
              <div>
                <Label htmlFor="voice-mode" className="text-foreground">Voice Interview Mode</Label>
                <p className="text-sm text-muted-foreground">Answer questions using your microphone</p>
              </div>
            </div>
            <Switch
              id="voice-mode"
              checked={voiceInterviewMode}
              onCheckedChange={setVoiceInterviewMode}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileTextIcon className="size-5 mr-3 text-muted-foreground" />
              <div>
                <Label htmlFor="resume-based" className="text-foreground">Resume-Based Questions</Label>
                <p className="text-sm text-muted-foreground">AI generates questions from your resume</p>
              </div>
            </div>
            <Switch
              id="resume-based"
              checked={resumeBasedQuestions}
              onCheckedChange={setResumeBasedQuestions}
            />
          </div>
        </div>
      </div>

      {/* Start Interview Session Button */}
      <button
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-lg flex items-center justify-center"
        onClick={() => {
          const technologyToSend = showCustomInput && customTechnology ? customTechnology : selectedTechnology;
          navigate('/interview', {
            state: {
              technology: technologyToSend,
              difficulty: selectedDifficulty,
              interviewType: selectedInterviewType,
              numberOfQuestions: numberOfQuestions,
              voiceInterviewMode: voiceInterviewMode,
              resumeBasedQuestions: resumeBasedQuestions,
            },
          });
        }}
      >
        <PlayIcon className="size-5 mr-2" />
        Start Interview Session
      </button>
    </div>
  );
};

export default InterviewSetup;
