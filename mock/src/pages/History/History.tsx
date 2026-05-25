import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, Flame } from "lucide-react";
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

export default function History() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    avgScore: 0,
    totalHours: "0",
    uniqueTopics: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both history and stats in parallel
      const [historyResponse, statsResponse] = await Promise.all([
        interviewAPI.getHistory(),
        interviewAPI.getStats(),
      ]);

      if (historyResponse.success) {
        // Format dates for display
        const formattedInterviews = historyResponse.interviews.map((interview: any) => ({
          ...interview,
          date: new Date(interview.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
        }));
        setInterviews(formattedInterviews);
      }

      if (statsResponse.success) {
        setStats(statsResponse.stats);
      }
    } catch (err: any) {
      console.error('Error fetching interview data:', err);
      setError(err.response?.data?.error || 'Failed to load interview history');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from interviews
  const totalSessions = stats.totalSessions;
  const avgScore = stats.avgScore;
  const totalHours = parseFloat(stats.totalHours);
  const uniqueTopics = stats.uniqueTopics;

  // Calculate streak (consecutive days with interviews)
  const calculateStreak = () => {
    if (interviews.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const interviewDates = interviews
      .map(i => {
        const date = new Date(i.date);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
      .sort((a, b) => b - a); // Sort descending (most recent first)
    
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

   const streak = calculateStreak();

   // Prepare chart data (Score Over Time)
  const chartData = interviews
    .slice()
    .reverse()
    .map((interview, index) => ({
      date: interview.date,
      score: interview.score,
      index: index,
    }));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-500";
      case "Medium":
        return "text-yellow-500";
      case "Hard":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const handleExport = () => {
    // Convert interviews to CSV
    const headers = ['Session ID', 'Tech', 'Difficulty', 'Type', 'Score', 'Duration', 'Date'];
    const csvContent = [
      headers.join(','),
      ...interviews.map(interview => 
        [interview.id, interview.tech, interview.difficulty, interview.type, interview.score, interview.duration, interview.date].join(',')
      )
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-gray-400">Loading interview history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Interview History</h1>
            <p className="text-gray-400 text-sm mt-1">
              Track your progress and performance
            </p>
          </div>
        </div>
        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="pt-6 text-center py-12">
            <p className="text-gray-400 text-lg">No interviews yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Start your first interview to see your history here
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Interview History</h1>
          <p className="text-gray-400 text-sm mt-1">
            Track your progress and performance
          </p>
        </div>
         <div className="flex items-center gap-4">
           {streak > 0 && (
             <div className="flex items-center gap-2 bg-[#1a1a24] border border-orange-500/30 rounded-full pl-1 pr-3 py-1">
               <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                 <Flame className="w-4 h-4 text-white" />
               </div>
               <span className="text-sm font-medium text-orange-400">{streak}-day streak</span>
             </div>
           )}
             <button 
               onClick={() => navigate('/profile')}
               className="focus:outline-none"
             >
               <UserAvatar 
                 size="sm" 
                 className="ring-2 ring-purple-500/20 hover:ring-purple-500/40 transition-all" 
               />
             </button>
         </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold">{totalSessions}</div>
            <div className="text-gray-400 text-sm mt-1">Total Sessions</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold">{avgScore}</div>
            <div className="text-gray-400 text-sm mt-1">Avg Score</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold">{totalHours.toFixed(1)}h</div>
            <div className="text-gray-400 text-sm mt-1">Total Hours</div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="pt-6">
            <div className="text-4xl font-bold">{uniqueTopics}</div>
            <div className="text-gray-400 text-sm mt-1">Topics</div>
          </CardContent>
        </Card>
      </div>

      {/* All Interviews Table */}
      <Card className="bg-[#1a1a24] border-gray-800 mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">All Interviews</CardTitle>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-transparent">
                <TableHead className="text-gray-400">Session ID</TableHead>
                <TableHead className="text-gray-400">Tech</TableHead>
                <TableHead className="text-gray-400">Difficulty</TableHead>
                <TableHead className="text-gray-400">Type</TableHead>
                <TableHead className="text-gray-400">Score</TableHead>
                <TableHead className="text-gray-400">Duration</TableHead>
                <TableHead className="text-gray-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow
                  key={interview.id}
                  className="border-gray-800 hover:bg-[#252530] cursor-pointer"
                >
                  <TableCell className="font-mono text-purple-400">
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
        </CardContent>
      </Card>

      {/* Score Over Time Chart */}
      <Card className="bg-[#1a1a24] border-gray-800">
        <CardHeader>
          <CardTitle className="text-xl">Score Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No data to display
            </div>
          ) : chartData.length === 1 ? (
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 1000 250">
                {/* Grid lines */}
                <line x1="50" y1="200" x2="950" y2="200" stroke="#2a2a35" strokeWidth="1" />
                <line x1="50" y1="150" x2="950" y2="150" stroke="#2a2a35" strokeWidth="1" />
                <line x1="50" y1="100" x2="950" y2="100" stroke="#2a2a35" strokeWidth="1" />
                <line x1="50" y1="50" x2="950" y2="50" stroke="#2a2a35" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="20" y="205" fill="#666" fontSize="12">0</text>
                <text x="20" y="155" fill="#666" fontSize="12">33</text>
                <text x="20" y="105" fill="#666" fontSize="12">66</text>
                <text x="20" y="55" fill="#666" fontSize="12">100</text>

                {/* Single data point */}
                <circle
                  cx="500"
                  cy={200 - (chartData[0].score / 100) * 150}
                  r="6"
                  fill="#6366f1"
                  stroke="#0a0a0f"
                  strokeWidth="2"
                />

                {/* X-axis label */}
                <text x="500" y="230" fill="#666" fontSize="12" textAnchor="middle">
                  {chartData[0].date.split(",")[0]}
                </text>
              </svg>
            </div>
          ) : (
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 1000 250">
                {/* Grid lines */}
                <line x1="50" y1="200" x2="950" y2="200" stroke="#2a2a35" strokeWidth="1" />
                <line x1="50" y1="150" x2="950" y2="150" stroke="#2a2a35" strokeWidth="1" />
                <line x1="50" y1="100" x2="950" y2="100" stroke="#2a2a35" strokeWidth="1" />
                <line x1="50" y1="50" x2="950" y2="50" stroke="#2a2a35" strokeWidth="1" />

                {/* Y-axis labels */}
                <text x="20" y="205" fill="#666" fontSize="12">0</text>
                <text x="20" y="155" fill="#666" fontSize="12">33</text>
                <text x="20" y="105" fill="#666" fontSize="12">66</text>
                <text x="20" y="55" fill="#666" fontSize="12">100</text>

                {/* Line chart */}
                <polyline
                  points={chartData
                    .map((point, index) => {
                      const x = 50 + (index * 900) / (chartData.length - 1);
                      const y = 200 - (point.score / 100) * 150;
                      return `${x},${y}`;
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                />

                {/* Data points */}
                {chartData.map((point, index) => {
                  const x = 50 + (index * 900) / (chartData.length - 1);
                  const y = 200 - (point.score / 100) * 150;
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
                  const x = 50 + (index * 900) / (chartData.length - 1);
                  const dateLabel = point.date.split(",")[0];
                  return (
                    <text
                      key={index}
                      x={x}
                      y="230"
                      fill="#666"
                      fontSize="12"
                      textAnchor="middle"
                    >
                      {dateLabel}
                    </text>
                  );
                })}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
