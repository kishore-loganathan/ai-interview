import { useState, useEffect } from 'react';
import { adminAPI } from '@/services/api';
import { Search, MoreVertical, Trash2, Ban, CheckCircle, Shield, ShieldCheck, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AdminLayout from './AdminLayout';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAllUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      const response = await adminAPI.updateUserRole(userId, newRole);
      if (response.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        alert(`User role updated to ${newRole}`);
      }
    } catch (err: any) {
      console.error('Failed to update role:', err);
      alert(err.response?.data?.error || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-400/10';
      case 'Inactive': return 'text-yellow-400 bg-yellow-400/10';
      case 'Suspended': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-purple-400 bg-purple-400/10';
      case 'superadmin': return 'text-red-400 bg-red-400/10';
      case 'user': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'superadmin': return ShieldCheck;
      case 'user': return User;
      default: return User;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">Loading users...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
            <p className="text-gray-400">Manage all registered users, permissions, and account status</p>
          </div>
        </div>

        {/* Role Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(() => {
            const roleStats = users.reduce((acc, user) => {
              acc[user.role] = (acc[user.role] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return [
              { role: 'admin', label: 'Admins', color: 'text-purple-400 bg-purple-400/10', icon: Shield },
              { role: 'user', label: 'Users', color: 'text-blue-400 bg-blue-400/10', icon: User },
              { role: 'superadmin', label: 'Super Admins', color: 'text-red-400 bg-red-400/10', icon: ShieldCheck }
            ].map(({ role, label, color, icon: Icon }) => (
              <Card key={role} className="bg-[#1a1a24] border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">{label}</p>
                      <p className="text-2xl font-bold text-white">{roleStats[role] || 0}</p>
                    </div>
                    <Icon className="w-8 h-8 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ));
          })()}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#1a1a24] border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Users Table */}
        <Card className="bg-[#1a1a24] border-gray-800">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-800">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">User</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">ID</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Role</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Interviews</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Avg Score</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Streak</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-800 hover:bg-[#252530] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.profilePicture ? (
                            <img 
                              src={`http://localhost:3001${user.profilePicture}`} 
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium">{user.name}</p>
                            <p className="text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-400 text-sm font-mono">
                          U-{user.id.slice(-4).toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {(() => {
                            const RoleIcon = getRoleIcon(user.role);
                            return <RoleIcon className="w-4 h-4 text-gray-400" />;
                          })()}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-white">{user.interviews}</span>
                      </td>
                      <td className="p-4">
                        <span className={`font-bold ${
                          user.avgScore >= 80 ? 'text-green-400' :
                          user.avgScore >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {user.avgScore}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-yellow-400 font-medium">🔥 {user.streak}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a24] border-gray-800">
                            {/* Role Management */}
                            <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Role Management
                            </div>
                            {user.role !== 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user.id, 'admin')}
                                className="text-purple-400 hover:bg-purple-400/10"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {user.role !== 'user' && (
                              <DropdownMenuItem 
                                onClick={() => handleRoleChange(user.id, 'user')}
                                className="text-blue-400 hover:bg-blue-400/10"
                              >
                                <User className="w-4 h-4 mr-2" />
                                Make User
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuSeparator className="bg-gray-800" />
                            
                            {/* Status Management */}
                            <div className="px-2 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                              Status
                            </div>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, 'Active')}
                              className="text-green-400 hover:bg-green-400/10"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Set Active
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, 'Inactive')}
                              className="text-yellow-400 hover:bg-yellow-400/10"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Set Inactive
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(user.id, 'Suspended')}
                              className="text-orange-400 hover:bg-orange-400/10"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="bg-gray-800" />
                            
                            {/* Danger Zone */}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:bg-red-400/10"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Stats Footer */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Showing {filteredUsers.length} of {users.length} users</span>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
