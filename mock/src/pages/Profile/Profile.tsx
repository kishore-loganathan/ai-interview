import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, MapPin, Zap, Save, Edit2, LogOut, Shield, Upload, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { interviewAPI } from '@/services/api';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  profilePicture: string | null;
  primarySkill: string;
  difficulty: string;
  notifications: {
    dailyReminder: boolean;
    weeklyReport: boolean;
    newFeatures: boolean;
  };
}

interface UserStats {
  interviewsCompleted: number;
  averageScore: number;
  streak: number;
  joinDate: string;
  completionRate: number;
  accuracy: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [editData, setEditData] = useState<UserProfile | null>(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const calculateStreak = (interviews: any[]): number => {
    if (!interviews || interviews.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const interviewDates = interviews
      .map((interview) => {
        const date = new Date(interview.date || interview.createdAt);
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

  const fetchUserProfile = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      // Fetch live stats + history from backend (like Dashboard does)
      let liveStats = { totalSessions: 0, avgScore: 0 };
      let computedStreak = 0;

      try {
        const [statsResponse, historyResponse] = await Promise.all([
          interviewAPI.getStats(),
          interviewAPI.getHistory()
        ]);

        if (statsResponse.success) {
          liveStats = statsResponse.stats;
        }

        if (historyResponse.success && historyResponse.interviews) {
          computedStreak = calculateStreak(historyResponse.interviews);
        }
      } catch (e) {
        console.warn('Could not fetch live stats, falling back to local data');
      }

      const initialProfile: UserProfile = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        profilePicture: user.profilePicture || null,
        primarySkill: user.primarySkill || 'System Design',
        difficulty: user.difficulty || 'Medium',
        notifications: user.notifications || {
          dailyReminder: true,
          weeklyReport: true,
          newFeatures: false,
        },
      };

      const initialStats: UserStats = {
        interviewsCompleted: liveStats.totalSessions || user.interviewsCompleted || 0,
        // Normalize score: backend returns 0-100 scale, UI expects 0-10
        averageScore: liveStats.avgScore 
          ? (liveStats.avgScore > 10 ? liveStats.avgScore / 10 : liveStats.avgScore) 
          : (user.averageScore || 0),
        streak: computedStreak || user.streak || 0,
        joinDate: user.joinDate || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        completionRate: user.completionRate || 0,
        accuracy: user.accuracy || 0,
      };

      setProfile(initialProfile);
      setStats(initialStats);
      setEditData(initialProfile);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const updatedUser = await res.json();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfile(editData);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/auth/upload-profile-picture', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload profile picture');
      const data = await res.json();
      const updatedProfile = { ...editData!, profilePicture: data.profilePicture };
      setEditData(updatedProfile);
      setProfile(updatedProfile);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.profilePicture = data.profilePicture;
      localStorage.setItem('user', JSON.stringify(user));
      toast.success('Profile picture updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change password');
      }
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrent: false,
        showNew: false,
        showConfirm: false,
      });
      setShowChangePassword(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Helper to get full image URL (handles relative paths from backend)
  const getProfileImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path; // already full URL
    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    return `${apiBase}${path}`;
  };

  if (!profile || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Profile</h1>
            <p className="text-slate-400">Manage your account settings and preferences</p>
          </div>
          <Button
            onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
            variant={isEditing ? 'outline' : 'default'}
            className={isEditing ? 'border-slate-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500'}
          >
            {isEditing ? 'Cancel' : <><Edit2 className="w-4 h-4 mr-2" /> Edit Profile</>}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-16 mb-6">
                <div className="relative group">
                   <Avatar className="w-32 h-32 border-4 border-slate-900 shadow-xl">
                     <AvatarImage src={getProfileImageUrl(editData?.profilePicture)} />
                     <AvatarFallback className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-2xl">
                       {getInitials(editData?.name || '')}
                     </AvatarFallback>
                   </Avatar>
                  {isEditing && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-colors"
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-1">{editData?.name || 'User'}</h2>
                  <p className="text-slate-400 font-medium mb-3">{editData?.email}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <Zap className="w-3 h-3 mr-1" /> {stats.streak} day streak
                    </Badge>
                    <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                      {stats.interviewsCompleted} interviews
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-400 text-sm font-medium mb-1">Interviews</p>
                  <p className="text-2xl font-bold text-white">{stats.interviewsCompleted}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-400 text-sm font-medium mb-1">Avg Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                    {isNaN(stats.averageScore) ? '0.0' : stats.averageScore.toFixed(1)}/10
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-400 text-sm font-medium mb-1">Streak</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.streak} days</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <p className="text-slate-400 text-sm font-medium mb-1">Joined</p>
                  <p className="text-2xl font-bold text-white">{stats.joinDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
              <CardDescription className="text-slate-400">Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-slate-300 font-medium">Full Name</Label>
                  {isEditing ? (
                    <Input value={editData?.name || ''} onChange={(e) => setEditData({ ...editData!, name: e.target.value })} className="bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500" />
                  ) : (
                    <p className="text-white font-medium">{profile.name || 'Not set'}</p>
                  )}
                </div>
                <div className="space-y-2.5">
                  <Label className="text-slate-300 font-medium">Email</Label>
                  <p className="text-white font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium flex items-center gap-2"><Phone className="w-4 h-4" /> Phone</Label>
                {isEditing ? (
                  <Input value={editData?.phone || ''} onChange={(e) => setEditData({ ...editData!, phone: e.target.value })} placeholder="Enter your phone number" className="bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500" />
                ) : (
                  <p className="text-white font-medium">{profile.phone || 'Not set'}</p>
                )}
              </div>
              <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Location</Label>
                {isEditing ? (
                  <Input value={editData?.location || ''} onChange={(e) => setEditData({ ...editData!, location: e.target.value })} placeholder="Enter your location" className="bg-slate-800/50 border-slate-700 text-white focus:border-indigo-500" />
                ) : (
                  <p className="text-white font-medium">{profile.location || 'Not set'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Interview Preferences</CardTitle>
              <CardDescription className="text-slate-400">Customize your interview experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium">Primary Skill Focus</Label>
                {isEditing ? (
                  <Select value={editData?.primarySkill || ''} onValueChange={(value) => setEditData({ ...editData!, primarySkill: value })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="System Design">System Design</SelectItem>
                      <SelectItem value="Data Structures">Data Structures</SelectItem>
                      <SelectItem value="Algorithms">Algorithms</SelectItem>
                      <SelectItem value="Behavioral">Behavioral</SelectItem>
                      <SelectItem value="Full Stack">Full Stack</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white font-medium">{profile.primarySkill}</p>
                )}
              </div>
              <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium">Difficulty Level</Label>
                {isEditing ? (
                  <Select value={editData?.difficulty || ''} onValueChange={(value) => setEditData({ ...editData!, difficulty: value })}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-white font-medium">{profile.difficulty}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="flex-1 h-12 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
              </Button>
              <Button onClick={handleCancel} variant="outline" className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            </div>
          )}
        </div>

         <div className="space-y-6">
           <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2"><Shield className="w-5 h-5" /> Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setShowChangePassword(!showChangePassword)} variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                <Lock className="w-4 h-4 mr-2" /> Change Password
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  toast.success('Signed out successfully');
                  navigate('/signin');
                }}
              >
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-400 text-sm">Completion Rate</p>
                  <p className="text-emerald-400 font-semibold">{stats.completionRate}%</p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full" style={{ width: `${stats.completionRate}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-slate-400 text-sm">Accuracy</p>
                  <p className="text-indigo-400 font-semibold">{stats.accuracy}%</p>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full" style={{ width: `${stats.accuracy}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showChangePassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center p-4 z-50">
          <Card className="border-slate-700 shadow-2xl w-full max-w-md ring-1 ring-slate-700 overflow-hidden">
            <div className="bg-slate-950">
              <CardHeader className="bg-slate-950">
                <CardTitle className="text-white flex items-center gap-2"><Lock className="w-5 h-5" /> Change Password</CardTitle>
                <CardDescription className="text-slate-400">Enter your current and new password</CardDescription>
              </CardHeader>
               <CardContent className="space-y-4 bg-slate-950">
               <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium">Current Password</Label>
                <div className="relative">
                  <Input 
  type={passwordData.showCurrent ? 'text' : 'password'} 
  placeholder="Enter current password" 
  value={passwordData.currentPassword} 
  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} 
  className="!bg-slate-900 !text-white border-slate-700 focus:border-indigo-500 pr-10 placeholder:text-slate-400" 
/>
                  <button type="button" onClick={() => setPasswordData({ ...passwordData, showCurrent: !passwordData.showCurrent })} className="absolute right-3 top-3 text-slate-500 hover:text-slate-400">
                    {passwordData.showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium">New Password</Label>
                <div className="relative">
                  <Input 
  type={passwordData.showNew ? 'text' : 'password'} 
  placeholder="Enter new password" 
  value={passwordData.newPassword} 
  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} 
  className="!bg-slate-900 !text-white border-slate-700 focus:border-indigo-500 pr-10 placeholder:text-slate-400" 
/>
                  <button type="button" onClick={() => setPasswordData({ ...passwordData, showNew: !passwordData.showNew })} className="absolute right-3 top-3 text-slate-500 hover:text-slate-400">
                    {passwordData.showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500">At least 8 characters</p>
              </div>
              <div className="space-y-2.5">
                <Label className="text-slate-300 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input 
  type={passwordData.showConfirm ? 'text' : 'password'} 
  placeholder="Confirm new password" 
  value={passwordData.confirmPassword} 
  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} 
  className="!bg-slate-900 !text-white border-slate-700 focus:border-indigo-500 pr-10 placeholder:text-slate-400" 
/>
                  <button type="button" onClick={() => setPasswordData({ ...passwordData, showConfirm: !passwordData.showConfirm })} className="absolute right-3 top-3 text-slate-500 hover:text-slate-400">
                    {passwordData.showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button onClick={handleChangePassword} disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white">
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</> : 'Update Password'}
                </Button>
                 <Button onClick={() => setShowChangePassword(false)} variant="outline" className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
               </div>
             </CardContent>
            </div>
           </Card>
         </div>
       )}
     </div>
   );
 }
