import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { 
  Users, 
  TrendingUp, 
  Award, 
  CheckCircle2,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from './AdminLayout';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDashboardStats();
      if (data.success) {
        setStats(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: 'TOTAL USERS',
      value: stats?.stats?.totalUsers || 0,
      change: `+${stats?.stats?.usersGrowth || 0}% vs last week`,
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'SESSIONS TODAY',
      value: stats?.stats?.sessionsToday || 0,
      change: `+${stats?.stats?.sessionsGrowth || 0}% vs last week`,
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      title: 'AVG SCORE',
      value: stats?.stats?.avgScore?.toFixed(1) || '0.0',
      change: '+2.1% vs last week',
      icon: Award,
      color: 'text-yellow-400'
    },
    {
      title: 'COMPLETIONS',
      value: `${stats?.stats?.completionRate?.toFixed(1) || '0.0'}%`,
      change: '+3.2% vs last week',
      icon: CheckCircle2,
      color: 'text-green-400'
    }
  ];

  const systemStatus = stats?.systemStatus || {};
  const statusItems = [
    { name: 'AI Question Engine', status: systemStatus.aiQuestionEngine || 'offline' },
    { name: 'Voice Interview API', status: systemStatus.voiceInterviewAPI || 'offline' },
    { name: 'Resume Parser', status: systemStatus.resumeParser || 'offline' },
    { name: 'Score Pipeline', status: systemStatus.scorePipeline || 'offline' }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Platform overview — live metrics and system health</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => (
            <Card key={index} className="bg-[#1a1a24] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">{stat.title}</span>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-green-400">{stat.change}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interview Sessions Chart */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Interview Sessions</CardTitle>
              <p className="text-sm text-gray-400">This week</p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
                  const height = Math.random() * 100 + 50;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all hover:opacity-80"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-gray-400">{day}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tech Breakdown */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Tech Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.charts?.techBreakdown?.slice(0, 5).map((tech: any, index: number) => {
                  const colors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-cyan-500'];
                  const total = stats.charts.techBreakdown.reduce((sum: number, t: any) => sum + t.count, 0);
                  const percentage = ((tech.count / total) * 100).toFixed(1);
                  
                  return (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300">{tech._id}</span>
                        <span className="text-gray-400">{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div 
                          className={`${colors[index % colors.length]} h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Score Distribution & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Distribution */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Score Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-3">
                {['0-20', '20-40', '40-60', '60-80', '80-100'].map((range, i) => {
                  const heights = [20, 35, 60, 45, 30];
                  return (
                    <div key={range} className="flex-1 flex flex-col items-center gap-2">
                      <div className="text-sm text-gray-400">{heights[i]}</div>
                      <div 
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg"
                        style={{ height: `${heights[i] * 3}px` }}
                      />
                      <span className="text-xs text-gray-400">{range}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card className="bg-[#1a1a24] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#252530] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{item.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${
                      item.status === 'online' ? 'text-green-400' :
                      item.status === 'degraded' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      ● {item.status}
                    </span>
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

export default AdminDashboard;
