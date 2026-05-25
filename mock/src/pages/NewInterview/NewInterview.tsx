import React, { useState } from 'react';
import { MinusIcon, PlusIcon, MicIcon, FileTextIcon, PlayIcon, Check } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

const InterviewSetup = () => {
  const navigate = useNavigate();
  const [selectedTechnology, setSelectedTechnology] = useState<string>('React');
  const [customTechnology, setCustomTechnology] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');
  const [selectedInterviewType, setSelectedInterviewType] = useState<string>('Technical');
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [voiceInterviewMode, setVoiceInterviewMode] = useState<boolean>(false);
  const [resumeBasedQuestions, setResumeBasedQuestions] = useState<boolean>(false);
  const [showModeDialog, setShowModeDialog] = useState<boolean>(false);
  const [selectedMode, setSelectedMode] = useState<'speak' | 'written' | null>(null);

  const technologies = ['React', 'MERN', 'DSA', 'Java', 'HR'];
  const difficulties = [
    { label: 'Easy', time: '~20m', color: 'text-green-400', dotColor: 'bg-green-500' },
    { label: 'Medium', time: '~35m', color: 'text-yellow-400', dotColor: 'bg-yellow-500' },
    { label: 'Hard', time: '~50m', color: 'text-red-400', dotColor: 'bg-red-500' },
  ];
  const interviewTypes = [
    { label: 'Technical', dotColor: 'bg-indigo-500' },
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
    setSelectedTechnology('');
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
    setNumberOfQuestions((prev) => Math.max(prev - 1, 3));
  };

  const handleStartInterview = () => {
    setShowModeDialog(true);
  };

  const handleModeSelection = (mode: 'speak' | 'written') => {
    setSelectedMode(mode);
  };

  const handleConfirmStart = () => {
    if (!selectedMode) return;

    const technologyToSend = showCustomInput && customTechnology ? customTechnology : selectedTechnology;
    
    navigate('/interview', {
      state: {
        technology: technologyToSend,
        difficulty: selectedDifficulty,
        interviewType: selectedInterviewType,
        numberOfQuestions: numberOfQuestions,
        voiceInterviewMode: selectedMode === 'speak',
        resumeBasedQuestions: resumeBasedQuestions,
        interviewMode: selectedMode, // Add this to distinguish between modes
      },
    });
    
    setShowModeDialog(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Set Up Your Interview</h1>
          <p className="text-gray-400">Customize your session to match your target role.</p>
        </div>

        {/* Technology Section */}
        <div className="bg-[#1a1a24] p-6 rounded-xl mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Technology</h2>
          <div className="flex flex-wrap gap-3">
            {technologies.map((tech) => (
              <button
                key={tech}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                  selectedTechnology === tech
                    ? 'bg-indigo-600 text-white border border-indigo-500'
                    : 'bg-[#252530] text-gray-400 hover:bg-[#2a2a35] border border-gray-700'
                }`}
                onClick={() => handleTechnologyClick(tech)}
              >
                {tech}
              </button>
            ))}
            <button
              className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                showCustomInput
                  ? 'bg-indigo-600 text-white border border-indigo-500'
                  : 'bg-[#252530] text-gray-400 hover:bg-[#2a2a35] border border-gray-700'
              }`}
              onClick={handleOtherClick}
            >
              Other
            </button>
            {showCustomInput && (
              <input
                type="text"
                className="px-5 py-2.5 rounded-lg bg-[#252530] text-white border border-gray-700 focus:outline-none focus:border-indigo-500"
                placeholder="Enter custom technology"
                value={customTechnology}
                onChange={handleCustomTechnologyChange}
              />
            )}
          </div>
        </div>

        {/* Difficulty and Interview Type Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Difficulty */}
          <div className="bg-[#1a1a24] p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Difficulty</h2>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <button
                  key={difficulty.label}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                    selectedDifficulty === difficulty.label
                      ? 'bg-indigo-600/20 border border-indigo-500/50'
                      : 'bg-[#252530] hover:bg-[#2a2a35] border border-transparent'
                  }`}
                  onClick={() => setSelectedDifficulty(difficulty.label)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${difficulty.dotColor}`}></span>
                    <span className={`font-medium ${selectedDifficulty === difficulty.label ? 'text-white' : 'text-gray-300'}`}>
                      {difficulty.label}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{difficulty.time}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interview Type */}
          <div className="bg-[#1a1a24] p-6 rounded-xl border border-gray-800">
            <h2 className="text-lg font-semibold text-white mb-4">Interview Type</h2>
            <div className="space-y-2">
              {interviewTypes.map((type) => (
                <button
                  key={type.label}
                  className={`w-full flex items-center p-4 rounded-lg transition-all ${
                    selectedInterviewType === type.label
                      ? 'bg-indigo-600/20 border border-indigo-500/50'
                      : 'bg-[#252530] hover:bg-[#2a2a35] border border-transparent'
                  }`}
                  onClick={() => setSelectedInterviewType(type.label)}
                >
                  <span className={`w-2 h-2 rounded-full mr-3 ${type.dotColor}`}></span>
                  <span className={`font-medium ${selectedInterviewType === type.label ? 'text-white' : 'text-gray-300'}`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Number of Questions Section */}
        <div className="bg-[#1a1a24] p-6 rounded-xl mb-6 border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">Number of Questions</h2>
            <span className="text-3xl font-bold text-indigo-400">{numberOfQuestions}</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="w-10 h-10 rounded-lg bg-[#252530] hover:bg-[#2a2a35] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              onClick={decrementQuestions}
              disabled={numberOfQuestions <= 3}
            >
              <MinusIcon className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="range"
              min="3"
              max="15"
              value={numberOfQuestions}
              onChange={handleQuestionChange}
              className="flex-grow h-2 rounded-lg appearance-none cursor-pointer bg-gray-700"
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${((numberOfQuestions - 3) / 12) * 100}%, #374151 ${((numberOfQuestions - 3) / 12) * 100}%, #374151 100%)`
              }}
            />
            <button
              className="w-10 h-10 rounded-lg bg-[#252530] hover:bg-[#2a2a35] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              onClick={incrementQuestions}
              disabled={numberOfQuestions >= 15}
            >
              <PlusIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>3 min</span>
            <span>15 max</span>
          </div>
        </div>

        {/* Advanced Options Section */}
        <div className="bg-[#1a1a24] p-6 rounded-xl mb-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Advanced Options</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#252530]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <MicIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <Label htmlFor="voice-mode" className="text-white font-medium cursor-pointer">
                    Voice Interview Mode
                  </Label>
                  <p className="text-sm text-gray-400">Answer questions using your microphone</p>
                </div>
              </div>
              <Switch
                id="voice-mode"
                checked={voiceInterviewMode}
                onCheckedChange={setVoiceInterviewMode}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#252530]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <FileTextIcon className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <Label htmlFor="resume-based" className="text-white font-medium cursor-pointer">
                    Resume-Based Questions
                  </Label>
                  <p className="text-sm text-gray-400">AI generates questions from your resume</p>
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
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/20"
          onClick={handleStartInterview}
        >
          <PlayIcon className="w-5 h-5" />
          Start Interview Session
        </button>
      </div>

      {/* Mode Selection Dialog */}
      <AlertDialog open={showModeDialog} onOpenChange={setShowModeDialog}>
        <AlertDialogContent 
          className="bg-[#111114] border-zinc-800 text-white !max-w-[1000px] w-full max-h-[82vh] p-0 overflow-hidden rounded-2xl flex flex-col"
          style={{ maxWidth: '1000px' }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-zinc-800 shrink-0">
            <AlertDialogTitle className="text-3xl font-semibold tracking-tight text-white mb-2">
              Choose Interview Mode
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400 text-base">
              How would you like to answer the questions?
            </AlertDialogDescription>
          </div>

          {/* Mode Cards - scrollable */}
          <div className="flex-1 overflow-y-auto p-8 flex justify-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[900px]">
              {/* Speak Mode - Recommended */}
              <button
                onClick={() => handleModeSelection('speak')}
                className={`group relative p-7 rounded-2xl border-2 transition-all text-left flex flex-col ${
                  selectedMode === 'speak'
                    ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                {selectedMode === 'speak' && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${
                  selectedMode === 'speak' ? 'bg-indigo-600' : 'bg-zinc-800 group-hover:bg-zinc-700'
                }`}>
                  <MicIcon className="w-7 h-7" />
                </div>

                <div className="flex items-center gap-2 mb-1.5">
                  <h3 className="text-2xl font-semibold tracking-tight">Speak Mode</h3>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    RECOMMENDED
                  </span>
                </div>

                <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                  Answer naturally using your voice. Questions are spoken aloud.
                </p>

                <div className="space-y-2 text-sm mt-auto">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Voice-to-text transcription
                  </div>
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Auto-read questions
                  </div>
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Most realistic interview feel
                  </div>
                </div>
              </button>

              {/* Written Mode */}
              <button
                onClick={() => handleModeSelection('written')}
                className={`group relative p-7 rounded-2xl border-2 transition-all text-left flex flex-col ${
                  selectedMode === 'written'
                    ? 'border-indigo-500 bg-zinc-900 ring-1 ring-indigo-500/30'
                    : 'border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-900'
                }`}
              >
                {selectedMode === 'written' && (
                  <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${
                  selectedMode === 'written' ? 'bg-indigo-600' : 'bg-zinc-800 group-hover:bg-zinc-700'
                }`}>
                  <FileTextIcon className="w-7 h-7" />
                </div>

                <h3 className="text-2xl font-semibold tracking-tight mb-1.5">Written Mode</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                  Type your answers in a clean text box. Classic interview format.
                </p>

                <div className="space-y-2 text-sm mt-auto">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Type at your own pace
                  </div>
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Edit answers before submitting
                  </div>
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    Best for thinking through answers
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-8 py-5 border-t border-zinc-800 bg-zinc-950/60 shrink-0">
            <button
              onClick={() => {
                setShowModeDialog(false);
                setSelectedMode(null);
              }}
              className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmStart}
              disabled={!selectedMode}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                selectedMode
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                  : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <PlayIcon className="w-4 h-4" />
              Start Interview
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InterviewSetup;
