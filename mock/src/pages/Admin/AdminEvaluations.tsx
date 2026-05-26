import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from './AdminLayout';

const AdminEvaluations = () => {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAIEvaluations();
      if (data.success) {
        setEvaluations(data.evaluations);
        if (data.evaluations.length > 0) {
          setSelectedEval(data.evaluations[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch evaluations:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading evaluations...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Evaluations</h1>
          <p className="text-gray-400">Review AI-generated evaluation reports for each session</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Evaluations List */}
          <Card className="bg-[#1a1a24] border-gray-800 lg:col-span-1">
            <CardContent className="p-4">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {evaluations.map((evaluation) => (
                  <button
                    key={evaluation.id}
                    onClick={() => setSelectedEval(evaluation)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedEval?.id === evaluation.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#252530] text-gray-300 hover:bg-[#2a2a35]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-mono">{evaluation.evalId}</span>
                      <span className={`text-lg font-bold ${
                        evaluation.score >= 80 ? 'text-green-400' :
                        evaluation.score >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {evaluation.score}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{evaluation.candidate}</p>
                    <p className="text-xs opacity-70">
                      {evaluation.technology} • {evaluation.difficulty}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Evaluation Detail */}
          {selectedEval && (
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card className="bg-[#1a1a24] border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{selectedEval.candidate}</h2>
                      <p className="text-gray-400">{selectedEval.summary}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold mb-1 ${
                        selectedEval.score >= 80 ? 'text-green-400' :
                        selectedEval.score >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {selectedEval.score}<span className="text-2xl text-gray-500">/100</span>
                      </div>
                      <p className="text-sm text-gray-400">{selectedEval.evalId}</p>
                    </div>
                  </div>

                  {/* Question Preview */}
                  {selectedEval.questionReview && selectedEval.questionReview.length > 0 && (
                    <div className="mt-6 p-4 bg-[#252530] rounded-lg">
                      <p className="text-sm text-gray-400 mb-2">Sample Question</p>
                      <p className="text-white font-medium">{selectedEval.questionReview[0].question}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Breakdown Scores */}
              <Card className="bg-[#1a1a24] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(selectedEval.breakdownScores || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="text-center p-4 bg-[#252530] rounded-lg">
                        <p className="text-sm text-gray-400 mb-2">{key}</p>
                        <p className={`text-3xl font-bold ${
                          value >= 80 ? 'text-green-400' :
                          value >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {value || 0}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths & Missing Concepts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-[#1a1a24] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-green-400">✓ Missing Concepts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedEval.missingConcepts && selectedEval.missingConcepts.length > 0 ? (
                        selectedEval.missingConcepts.map((concept: string, index: number) => (
                          <div key={index} className="px-3 py-2 bg-yellow-500/10 rounded-lg">
                            <span className="text-yellow-400 text-sm">{concept}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No missing concepts identified</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a1a24] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-yellow-400">⚠ Filter reconciler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedEval.strengths && selectedEval.strengths.length > 0 ? (
                        selectedEval.strengths.map((strength: string, index: number) => (
                          <div key={index} className="px-3 py-2 bg-green-500/10 rounded-lg">
                            <span className="text-green-400 text-sm">{strength}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-sm">No strengths recorded</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Question Reviews */}
              {selectedEval.questionReview && selectedEval.questionReview.length > 0 && (
                <Card className="bg-[#1a1a24] border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-white">Question-by-Question Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedEval.questionReview.slice(0, 3).map((review: any, index: number) => (
                        <div key={index} className="p-4 bg-[#252530] rounded-lg">
                          <div className="flex items-start justify-between mb-3">
                            <p className="text-white font-medium flex-1">{review.question}</p>
                            <span className={`ml-4 text-lg font-bold ${
                              review.score >= 80 ? 'text-green-400' :
                              review.score >= 60 ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {review.score}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            <span className="font-medium">Answer:</span> {review.userAnswer?.substring(0, 150)}...
                          </p>
                          <p className="text-sm text-indigo-400">
                            <span className="font-medium">Feedback:</span> {review.feedback}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminEvaluations;
