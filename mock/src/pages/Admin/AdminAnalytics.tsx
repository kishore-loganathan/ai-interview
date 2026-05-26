import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from './AdminLayout';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAnalytics();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading analytics...</div>
        </div>
      </AdminLayout>
    );
  }

  // Prepare data for radar chart (Topic Proficiency)
  const topicData = analytics?.topicProficiency?.slice(0, 6) || [];
  const maxScore = 100;

  // Prepare data for score brackets
  const scoreBrackets = [
    { range: '<40', count: 0 },
    { range: '40-60', count: 0 },
    { range: '60-70', count: 0 },
    { range: '70-80', count: 0 },
    { range: '80-90', count: 0 },
    { range: '90-100', count: 0 }
  ];

  analytics?.scoreBrackets?.forEach((bracket: any) => {
    const boundary = bracket._id;
    if (boundary < 40) scoreBrackets[0].count += bracket.count;
    else if (boundary < 60) scoreBrackets[1].count += bracket.count;
    else if (boundary < 70) scoreBrackets[2].count += bracket.count;
    else if (boundary < 80) scoreBrackets[3].count += bracket.count;
    else if (boundary < 90) scoreBrackets[4].count += bracket.count;
    else scoreBrackets[5].count += bracket.count;
  });

  const maxBracketCount = Math.max(...scoreBrackets.map(b => b.count), 1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-gray-400">Deep-dive into performance trends and topic proficiency</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Topic Proficiency (Radar Chart) */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Topic Proficiency (avg)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-80 flex items-center justify-center">
                {/* Simple radar chart visualization */}
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  {/* Background circles */}
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
                    <circle
                      key={i}
                      cx="200"
                      cy="200"
                      r={150 * scale}
                      fill="none"
                      stroke="#374151"
                      strokeWidth="1"
                    />
                  ))}
                  
                  {/* Axes */}
                  {topicData.map((_topic: any, index: number) => {
                    const angle = (index * 2 * Math.PI) / topicData.length - Math.PI / 2;
                    const x = 200 + 150 * Math.cos(angle);
                    const y = 200 + 150 * Math.sin(angle);
                    return (
                      <line
                        key={index}
                        x1="200"
                        y1="200"
                        x2={x}
                        y2={y}
                        stroke="#374151"
                        strokeWidth="1"
                      />
                    );
                  })}
                  
                  {/* Data polygon */}
                  <polygon
                    points={topicData.map((topic: any, index: number) => {
                      const angle = (index * 2 * Math.PI) / topicData.length - Math.PI / 2;
                      const distance = (topic.avgScore / maxScore) * 150;
                      const x = 200 + distance * Math.cos(angle);
                      const y = 200 + distance * Math.sin(angle);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="rgba(99, 102, 241, 0.3)"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="2"
                  />
                  
                  {/* Labels */}
                  {topicData.map((topic: any, index: number) => {
                    const angle = (index * 2 * Math.PI) / topicData.length - Math.PI / 2;
                    const x = 200 + 170 * Math.cos(angle);
                    const y = 200 + 170 * Math.sin(angle);
                    return (
                      <text
                        key={index}
                        x={x}
                        y={y}
                        fill="#9CA3AF"
                        fontSize="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        {topic._id}
                      </text>
                    );
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          {/* Score Brackets */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Score Brackets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scoreBrackets.map((bracket, index) => {
                  const percentage = (bracket.count / maxBracketCount) * 100;
                  const colors = [
                    'bg-red-500',
                    'bg-orange-500',
                    'bg-yellow-500',
                    'bg-lime-500',
                    'bg-green-500',
                    'bg-emerald-500'
                  ];
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">{bracket.range}</span>
                        <span className="text-gray-400">{bracket.count} sessions</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-8 relative overflow-hidden">
                        <div 
                          className={`${colors[index]} h-8 rounded-full transition-all flex items-center justify-end pr-3`}
                          style={{ width: `${percentage}%` }}
                        >
                          {percentage > 15 && (
                            <span className="text-white text-sm font-medium">
                              {percentage.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Difficulty Distribution */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Difficulty Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.difficultyDistribution?.map((item: any, index: number) => {
                  const colors = ['text-green-400', 'text-yellow-400', 'text-red-400'];
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{item._id}</span>
                      <span className={`font-bold ${colors[index % colors.length]}`}>
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Interview Type Distribution */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Interview Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.typeDistribution?.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{item._id}</span>
                    <span className="font-bold text-indigo-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Technologies */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Top Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics?.topicProficiency?.slice(0, 5).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-300">{item._id}</span>
                    <span className="font-bold text-purple-400">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
