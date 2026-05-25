import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  PlayIcon, 
  TrophyIcon, 
  TargetIcon, 
  GridIcon,
  ArrowRightIcon,
  Loader2,
  Flame
} from "lucide-react";
import { interviewAPI } from "@/services/api";

interface Interview {
  id: string;
  _id: string;
  tech: string;
  difficulty: "Easy" | "Medium" | "Hard";
  type: "Technical" | "Mixed" | "HR";
  score: number;
  duration: string;
  date: string;
}

interface Stats {
  totalSessions: number;
  avgScore: number;
  totalHours: string;
  uniqueTopics: number;
}

interface QuickStartConfig {
  tech: string;
  difficulty: string;
  questions: number;
}

interface WeakArea {
  topic: string;
  score: number;
  total: number;
  count: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    avgScore: 0,
    totalHours: "0",
    uniqueTopics: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [streak, setStreak] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<QuickStartConfig | null>(null);
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);

  useEffect(() => {
    fetchData();
    loadUserName();
  }, []);

  const loadUserName = () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(userData.name || 'User');
      } catch {
        setUserName('User');
      }
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyResponse, statsResponse] = await Promise.all([
        interviewAPI.getHistory(),
        interviewAPI.getStats(),
      ]);

      if (historyResponse.success) {
        const formattedInterviews = historyResponse.interviews.map((interview: any) => ({
          ...interview,
          date: new Date(interview.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        }));
        setInterviews(formattedInterviews);
        setStreak(calculateStreak(formattedInterviews));
        setWeakAreas(calculateWeakAreas(formattedInterviews));
      }

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeakAreas = (interviews: Interview[]): WeakArea[] => {
    if (interviews.length === 0) return [];

    // Group interviews by technology and calculate average scores
    const techScores: { [key: string]: { total: number; count: number } } = {};

    interviews.forEach((interview) => {
      if (!techScores[interview.tech]) {
        techScores[interview.tech] = { total: 0, count: 0 };
      }
      techScores[interview.tech].total += interview.score;
      techScores[interview.tech].count += 1;
    });

    // Calculate average scores and identify weak areas (below 70%)
    const weakAreasArray: WeakArea[] = Object.entries(techScores)
      .map(([topic, data]) => ({
        topic,
        score: Math.round(data.total / data.count),
        total: 100,
        count: data.count,
      }))
      .filter((area) => area.score < 70) // Only show topics with average score below 70
      .sort((a, b) => a.score - b.score) // Sort by score (lowest first)
      .slice(0, 3); // Show top 3 weak areas

    return weakAreasArray;
  };

  const calculateStreak = (interviews: Interview[]) => {
    if (interviews.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const interviewDates = interviews
      .map(i => {
        const date = new Date(i.date);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .sort((a, b) => b - a);
    
    const uniqueDates = [...new Set(interviewDates)];
    let streak = 0;
    let currentDate = today.getTime();
    
    for (const interviewDate of uniqueDates) {
      const daysDiff = Math.floor((currentDate - interviewDate) / (1000 * 60 * 60 * 24));
      if (daysDiff === streak) {
        streak++;
        currentDate = interviewDate;
      } else if (daysDiff > streak) {
        break;
      }
    }
    
    return streak;
  };

  const handleQuickStart = (config: QuickStartConfig) => {
    setSelectedConfig(config);
    setShowConfirmDialog(true);
  };

  const handleConfirmStart = () => {
    if (selectedConfig) {
      // Show mode selection dialog instead of directly navigating
      setShowConfirmDialog(false);
      // We'll need to add another dialog for mode selection
      // For now, default to written mode
      navigate('/interview', {
        state: {
          technology: selectedConfig.tech,
          difficulty: selectedConfig.difficulty,
          interviewType: 'Technical',
          numberOfQuestions: selectedConfig.questions,
          voiceInterviewMode: false,
          resumeBasedQuestions: false,
          interviewMode: 'written', // Default to written mode from dashboard
        },
      });
    }
    setShowConfirmDialog(false);
  };

  const handlePracticeWeakTopic = (topic: string) => {
    const config: QuickStartConfig = {
      tech: topic,
      difficulty: 'Easy',
      questions: 10,
    };
    setSelectedConfig(config);
    setShowConfirmDialog(true);
  };

  // Get best score
  const bestScore = interviews.length > 0 
    ? Math.max(...interviews.map(i => i.score))
    : 0;

  // Quick start suggestions based on user's history
  const getQuickStartSuggestions = (): QuickStartConfig[] => {
    if (interviews.length === 0) {
      // Default suggestions for new users
      return [
        { tech: "React", difficulty: "Medium", questions: 10 },
        { tech: "MERN", difficulty: "Hard", questions: 8 },
        { tech: "DSA", difficulty: "Easy", questions: 12 },
      ];
    }

    // Get most practiced technologies
    const techCount: { [key: string]: number } = {};
    interviews.forEach((interview) => {
      techCount[interview.tech] = (techCount[interview.tech] || 0) + 1;
    });

    const topTechs = Object.entries(techCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tech]) => tech);

    return topTechs.map((tech) => ({
      tech,
      difficulty: "Medium",
      questions: 10,
    }));
  };

  const quickStart = getQuickStartSuggestions();

  // Chart data for score progress
  const chartData = interviews
    .slice(0, 7)
    .reverse()
    .map((interview, index) => ({
      date: interview.date,
      score: interview.score,
      index: index,
    }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-400";
      case "Medium":
        return "text-yellow-400";
      case "Hard":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
          <div className="flex items-center justify-between mb-8">
           <div>
             <h1 className="text-3xl font-bold mb-1">
               Good morning, {userName} 👋
             </h1>
             <p className="text-gray-400 text-sm">
               {streak > 0 
                 ? `You're on a ${streak}-day streak. Keep it going!` 
                 : "Start your first interview today!"}
             </p>
           </div>
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => navigate('/new-interview')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 gap-2"
              >
                <PlayIcon className="w-4 h-4" />
                Start Interview
              </Button>

              <button onClick={() => navigate('/profile')} className="focus:outline-none">
                <UserAvatar 
                  size="sm" 
                  className="ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all" 
                />
              </button>
            </div>
         </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {/* Streak Card - Prominent */}
          <Card className="bg-[#1a1a24] border-orange-500/30 hover:border-orange-500/50 transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1 text-orange-400">{streak}</div>
              <div className="text-gray-400 text-sm">Current Streak</div>
              <div className="text-xs text-orange-400/80 mt-1">
                {streak > 0 ? "🔥 Keep it going!" : "Start today!"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a24] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                  <PlayIcon className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{stats.totalSessions}</div>
              <div className="text-gray-400 text-sm">Total Interviews</div>
              <div className="text-xs text-gray-500 mt-1">+2 this week</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a24] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <TargetIcon className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{stats.avgScore}</div>
              <div className="text-gray-400 text-sm">Average Score</div>
              <div className="text-xs text-green-500 mt-1">+5% from last week</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a24] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center">
                  <TrophyIcon className="w-5 h-5 text-yellow-400" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{bestScore}</div>
              <div className="text-gray-400 text-sm">Best Score</div>
              <div className="text-xs text-gray-500 mt-1">React - Medium</div>
            </CardContent>
          </Card>

          <Card className="bg-[#1a1a24] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-600/20 flex items-center justify-center">
                  <GridIcon className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-1">{stats.uniqueTopics}</div>
              <div className="text-gray-400 text-sm">Topics Covered</div>
              <div className="text-xs text-gray-500 mt-1">React, MERN, DSA, HR</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Score Progress Chart */}
          <Card className="bg-[#1a1a24] border-gray-800 lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Score Progress</h2>
                  <p className="text-sm text-gray-400">Last 7 days</p>
                </div>
              </div>
              {chartData.length > 0 ? (
                <div className="h-64">
                  <svg className="w-full h-full" viewBox="0 0 800 200">
                    {/* Grid lines */}
                    <line x1="40" y1="160" x2="760" y2="160" stroke="#2a2a35" strokeWidth="1" />
                    <line x1="40" y1="120" x2="760" y2="120" stroke="#2a2a35" strokeWidth="1" />
                    <line x1="40" y1="80" x2="760" y2="80" stroke="#2a2a35" strokeWidth="1" />
                    <line x1="40" y1="40" x2="760" y2="40" stroke="#2a2a35" strokeWidth="1" />

                    {/* Y-axis labels */}
                    <text x="10" y="165" fill="#666" fontSize="12">0</text>
                    <text x="10" y="125" fill="#666" fontSize="12">40</text>
                    <text x="10" y="85" fill="#666" fontSize="12">80</text>
                    <text x="10" y="45" fill="#666" fontSize="12">100</text>

                    {/* Line chart */}
                    {chartData.length > 1 && (
                      <polyline
                        points={chartData
                          .map((point, index) => {
                            const x = 40 + (index * 720) / (chartData.length - 1);
                            const y = 160 - (point.score / 100) * 120;
                            return `${x},${y}`;
                          })
                          .join(" ")}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                      />
                    )}

                    {/* Data points */}
                    {chartData.map((point, index) => {
                      const x = 40 + (index * 720) / Math.max(chartData.length - 1, 1);
                      const y = 160 - (point.score / 100) * 120;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#6366f1"
                          stroke="#0a0a0f"
                          strokeWidth="2"
                        />
                      );
                    })}

                    {/* X-axis labels */}
                    {chartData.map((point, index) => {
                      const x = 40 + (index * 720) / Math.max(chartData.length - 1, 1);
                      return (
                        <text
                          key={index}
                          x={x}
                          y="185"
                          fill="#666"
                          fontSize="11"
                          textAnchor="middle"
                        >
                          {point.date.split(",")[0].slice(0, 6)}
                        </text>
                      );
                    })}
                  </svg>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Start */}
            <Card className="bg-[#1a1a24] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Quick Start</h3>
                </div>
                <div className="space-y-3">
                  {quickStart.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#252530] hover:bg-[#2a2a35] cursor-pointer transition-all"
                      onClick={() => handleQuickStart(item)}
                    >
                      <div>
                        <div className="font-medium text-sm">{item.tech} - {item.difficulty}</div>
                        <div className="text-xs text-gray-400">{item.questions} questions</div>
                      </div>
                      <PlayIcon className="w-4 h-4 text-indigo-400" />
                    </div>
                  ))}
                </div>
                <Button
                  variant="link"
                  className="text-indigo-400 hover:text-indigo-300 mt-3 p-0 h-auto text-sm"
                  onClick={() => navigate('/new-interview')}
                >
                  Custom setup →
                </Button>
              </CardContent>
            </Card>

            {/* Weak Areas */}
            <Card className="bg-[#1a1a24] border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Weak Areas</h3>
                  {weakAreas.length > 0 && (
                    <span className="text-xs text-gray-400">{weakAreas[0]?.score}/{weakAreas[0]?.total}</span>
                  )}
                </div>
                {weakAreas.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {weakAreas.map((area, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300">{area.topic}</span>
                            <span className="text-xs text-gray-400">{area.score}/{area.total}</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${(area.score / area.total) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="link"
                      className="text-indigo-400 hover:text-indigo-300 mt-3 p-0 h-auto text-sm"
                      onClick={() => handlePracticeWeakTopic(weakAreas[0].topic)}
                    >
                      Practice weak topics →
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    <p>No weak areas identified yet.</p>
                    <p className="text-xs mt-1">Complete more interviews to see insights.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Interviews Table */}
        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recent Interviews</h2>
              <Button
                variant="link"
                className="text-indigo-400 hover:text-indigo-300 p-0 h-auto"
                onClick={() => navigate('/history')}
              >
                View all →
              </Button>
            </div>
            {interviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Session</TableHead>
                    <TableHead className="text-gray-400">Tech</TableHead>
                    <TableHead className="text-gray-400">Difficulty</TableHead>
                    <TableHead className="text-gray-400">Type</TableHead>
                    <TableHead className="text-gray-400">Score</TableHead>
                    <TableHead className="text-gray-400">Duration</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.slice(0, 3).map((interview) => (
                    <TableRow
                      key={interview.id}
                      className="border-gray-800 hover:bg-[#252530] cursor-pointer"
                    >
                      <TableCell className="font-mono text-indigo-400 text-sm">
                        {interview.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          {interview.tech}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={getDifficultyColor(interview.difficulty)}>
                          {interview.difficulty}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-400">{interview.type}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${getScoreColor(interview.score)}`}>
                          {interview.score}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-400">{interview.duration}</TableCell>
                      <TableCell className="text-gray-400">{interview.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>No interviews yet</p>
                <Button
                  onClick={() => navigate('/new-interview')}
                  className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                >
                  Start your first interview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-[#1a1a24] border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Start Interview?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {selectedConfig && (
                <div className="mt-4 space-y-2">
                  <p>Would you like to start the interview immediately with these settings?</p>
                  <div className="mt-4 p-4 bg-[#252530] rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Technology:</span>
                      <span className="text-white font-medium">{selectedConfig.tech}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Difficulty:</span>
                      <span className="text-white font-medium">{selectedConfig.difficulty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Questions:</span>
                      <span className="text-white font-medium">{selectedConfig.questions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white font-medium">Technical</span>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#252530] text-white border-gray-700 hover:bg-[#2a2a35]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmStart}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start Interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
