import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Search, Eye, Download, X, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AdminLayout from './AdminLayout';

interface Interview {
  id: string;
  sessionId: string;
  candidate: string;
  candidateEmail: string;
  tech: string;
  difficulty: string;
  interviewType: string;
  score: number;
  duration: number;
  status: string;
  breakdownScores: Record<string, number>;
  strengths: string[];
  missingConcepts: string[];
  summaryFeedback: string;
  questionReview: { question: string; userAnswer: string; score: number; feedback: string }[];
  createdAt: string;
}

const AdminInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllInterviews();
      if (data.success) setInterviews(data.interviews);
    } catch (err) {
      console.error('Failed to fetch interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Download single interview as CSV ──────────────────────────────────────
  const downloadCSV = (interview: Interview) => {
    const rows: string[][] = [
      ['Field', 'Value'],
      ['Session ID', interview.sessionId],
      ['Candidate', interview.candidate],
      ['Email', interview.candidateEmail],
      ['Technology', interview.tech],
      ['Difficulty', interview.difficulty],
      ['Interview Type', interview.interviewType || '—'],
      ['Overall Score', String(interview.score)],
      ['Duration (min)', String(interview.duration)],
      ['Status', interview.status],
      ['Date', new Date(interview.createdAt).toLocaleString()],
      [],
      ['Score Breakdown'],
      ...Object.entries(interview.breakdownScores || {}).map(([k, v]) => [k, String(v)]),
      [],
      ['Summary Feedback'],
      [interview.summaryFeedback || 'N/A'],
      [],
      ['Strengths'],
      ...(interview.strengths.length ? interview.strengths.map(s => [s]) : [['—']]),
      [],
      ['Missing Concepts'],
      ...(interview.missingConcepts.length ? interview.missingConcepts.map(c => [c]) : [['—']]),
      [],
      ['Question Review'],
      ['#', 'Question', 'Score', 'Feedback'],
      ...(interview.questionReview || []).map((q, i) => [
        String(i + 1),
        q.question,
        String(q.score),
        q.feedback
      ])
    ];

    const csv = rows
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${interview.sessionId}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Download ALL filtered interviews as CSV ───────────────────────────────
  const downloadAllCSV = () => {
    const headers = [
      'Session ID', 'Candidate', 'Email', 'Technology',
      'Difficulty', 'Type', 'Score', 'Duration (min)', 'Status', 'Date'
    ];

    const rows = filteredInterviews.map(i => [
      i.sessionId,
      i.candidate,
      i.candidateEmail,
      i.tech,
      i.difficulty,
      i.interviewType || '—',
      String(i.score),
      String(i.duration),
      i.status,
      new Date(i.createdAt).toLocaleString()
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredInterviews = interviews.filter(i => {
    const matchesSearch =
      i.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.candidate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.tech.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'All' || i.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (d: string) => {
    switch (d.toLowerCase()) {
      case 'easy':   return 'text-green-400 bg-green-400/10';
      case 'medium': return 'text-yellow-400 bg-yellow-400/10';
      case 'hard':   return 'text-red-400 bg-red-400/10';
      default:       return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getScoreColor = (s: number) =>
    s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading interviews...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Interview Sessions</h1>
            <p className="text-gray-400">Browse, filter and moderate all interview sessions</p>
          </div>
          <Button
            onClick={downloadAllCSV}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Download className="w-4 h-4" />
            Export All CSV
          </Button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by session ID, candidate, or technology..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterDifficulty}
              onChange={e => setFilterDifficulty(e.target.value)}
              className="appearance-none pl-4 pr-10 py-3 bg-[#1a1a24] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            >
              {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Table */}
        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    {['Session ID', 'Candidate', 'Tech', 'Difficulty', 'Score', 'Duration', 'Status', ''].map(h => (
                      <th key={h} className="text-left p-4 text-sm font-medium text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredInterviews.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        No interviews found
                      </td>
                    </tr>
                  ) : filteredInterviews.map(interview => (
                    <tr key={interview.id} className="border-b border-gray-800 hover:bg-[#252530] transition-colors">
                      <td className="p-4">
                        <span className="text-indigo-400 font-mono text-sm font-medium">
                          {interview.sessionId}
                        </span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-white">{interview.candidate}</p>
                          <p className="text-xs text-gray-500">{interview.candidateEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm">
                          {interview.tech}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(interview.difficulty)}`}>
                          {interview.difficulty}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold text-lg ${getScoreColor(interview.score)}`}>
                          {interview.score}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-400">
                          {interview.duration > 0 ? `${interview.duration}m` : '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 rounded-full text-xs font-medium text-green-400 bg-green-400/10">
                          {interview.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View details"
                            onClick={() => setSelectedInterview(interview)}
                            className="text-gray-400 hover:text-white hover:bg-indigo-600/20"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download CSV report"
                            onClick={() => downloadCSV(interview)}
                            className="text-gray-400 hover:text-white hover:bg-green-600/20"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-gray-400">
          Showing {filteredInterviews.length} of {interviews.length} sessions
        </div>
      </div>

      {/* ── Detail Modal ─────────────────────────────────────────────────── */}
      {selectedInterview && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedInterview(null)}
        >
          <div
            className="bg-[#1a1a24] border border-gray-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800 sticky top-0 bg-[#1a1a24] z-10">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedInterview.sessionId}</h2>
                <p className="text-sm text-gray-400">{selectedInterview.candidate} · {selectedInterview.candidateEmail}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => downloadCSV(selectedInterview)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </Button>
                <button
                  onClick={() => setSelectedInterview(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Technology', value: selectedInterview.tech },
                  { label: 'Difficulty', value: selectedInterview.difficulty },
                  { label: 'Type', value: selectedInterview.interviewType || '—' },
                  { label: 'Duration', value: selectedInterview.duration > 0 ? `${selectedInterview.duration}m` : '—' },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-[#252530] rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                    <p className="text-white font-medium">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Score */}
              <div className="flex items-center gap-6 p-4 bg-[#252530] rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Overall</p>
                  <p className={`text-4xl font-bold ${getScoreColor(selectedInterview.score)}`}>
                    {selectedInterview.score}
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-3 gap-4">
                  {Object.entries(selectedInterview.breakdownScores || {}).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <p className="text-xs text-gray-400 mb-1">{key}</p>
                      <p className={`text-2xl font-bold ${getScoreColor(val)}`}>{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              {selectedInterview.summaryFeedback && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Summary Feedback</h3>
                  <p className="text-gray-300 text-sm leading-relaxed bg-[#252530] p-4 rounded-lg">
                    {selectedInterview.summaryFeedback}
                  </p>
                </div>
              )}

              {/* Strengths & Missing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-green-400 mb-2">✓ Strengths</h3>
                  <div className="space-y-1">
                    {selectedInterview.strengths.length > 0
                      ? selectedInterview.strengths.map((s, i) => (
                          <div key={i} className="px-3 py-1.5 bg-green-500/10 rounded-lg text-green-300 text-sm">{s}</div>
                        ))
                      : <p className="text-gray-500 text-sm">None recorded</p>
                    }
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-yellow-400 mb-2">⚠ Missing Concepts</h3>
                  <div className="space-y-1">
                    {selectedInterview.missingConcepts.length > 0
                      ? selectedInterview.missingConcepts.map((c, i) => (
                          <div key={i} className="px-3 py-1.5 bg-yellow-500/10 rounded-lg text-yellow-300 text-sm">{c}</div>
                        ))
                      : <p className="text-gray-500 text-sm">None recorded</p>
                    }
                  </div>
                </div>
              </div>

              {/* Question Review */}
              {selectedInterview.questionReview.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-3">
                    Question Review ({selectedInterview.questionReview.length} questions)
                  </h3>
                  <div className="space-y-3">
                    {selectedInterview.questionReview.map((q, i) => (
                      <div key={i} className="p-4 bg-[#252530] rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-white text-sm font-medium flex-1 pr-4">
                            Q{i + 1}. {q.question}
                          </p>
                          <span className={`text-lg font-bold flex-shrink-0 ${getScoreColor(q.score)}`}>
                            {q.score}
                          </span>
                        </div>
                        {q.userAnswer && (
                          <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                            <span className="text-gray-500">Answer: </span>{q.userAnswer}
                          </p>
                        )}
                        {q.feedback && (
                          <p className="text-indigo-400 text-xs">
                            <span className="text-gray-500">Feedback: </span>{q.feedback}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminInterviews;
