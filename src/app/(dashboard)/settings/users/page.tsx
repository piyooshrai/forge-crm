'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  monthlyQuota: number;
  createdAt: string;
}

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'SALES_REP', label: 'Sales Rep' },
  { value: 'MARKETING_REP', label: 'Marketing Rep' },
];

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'SALES_REP',
    monthlyQuota: 3000,
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const isAdmin = (session?.user as any)?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !isAdmin) {
      router.push('/dashboard');
    }
  }, [status, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

      await fetchUsers();
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormError('');
    setFormLoading(true);

    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          monthlyQuota: formData.monthlyQuota,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      await fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password' }),
      });

      const data = await res.json();
      if (res.ok) {
        setNewPassword(data.newPassword);
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      alert('Failed to reset password');
    }
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to deactivate user');
      }
    } catch (error) {
      alert('Failed to deactivate user');
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to reactivate user');
      }
    } catch (error) {
      alert('Failed to reactivate user');
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      monthlyQuota: user.monthlyQuota,
    });
    setFormError('');
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'SALES_REP',
      monthlyQuota: 3000,
    });
    setFormError('');
  };

  const getRoleLabel = (role: string) => {
    return ROLES.find(r => r.value === role)?.label || role;
  };

  const formatQuota = (role: string, quota: number) => {
    if (role === 'MARKETING_REP') {
      return `${quota} leads`;
    }
    return `$${quota.toLocaleString()}`;
  };

  if (status === 'loading' || loading) {
    return (
      <div className="p-8">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <p className="text-red-400">Access denied. Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
        >
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/50 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-slate-800">
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Email</th>
                <th className="text-left p-4">Role</th>
                <th className="text-right p-4">Monthly Quota</th>
                <th className="text-center p-4">Status</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map(user => (
                <tr
                  key={user.id}
                  className={`hover:bg-slate-800/30 cursor-pointer ${!user.isActive ? 'opacity-50' : ''}`}
                  onClick={() => openEditModal(user)}
                >
                  <td className="p-4 text-gray-300">{user.name}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-900/50 text-purple-400' :
                      user.role === 'SALES_REP' ? 'bg-blue-900/50 text-blue-400' :
                      'bg-green-900/50 text-green-400'
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="p-4 text-right text-gray-300 tabular-nums">
                    {formatQuota(user.role, user.monthlyQuota)}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs px-2 py-1 ${
                      user.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-gray-300 transition-colors"
                      >
                        Reset PW
                      </button>
                      {user.isActive ? (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="text-xs px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-400 transition-colors"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(user.id)}
                          className="text-xs px-2 py-1 bg-green-900/50 hover:bg-green-900 text-green-400 transition-colors"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Password Modal */}
      {newPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Password Reset</h2>
            <p className="text-gray-400 mb-4">New password generated. Share this with the user securely:</p>
            <div className="p-3 bg-slate-800 border border-slate-700 font-mono text-cyan-400 text-lg select-all">
              {newPassword}
            </div>
            <p className="text-xs text-gray-500 mt-2">This password will not be shown again.</p>
            <button
              onClick={() => setNewPassword(null)}
              className="mt-4 w-full py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Add New User</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                  placeholder="user@company.com"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Password
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                  placeholder="Initial password"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Monthly Quota
                </label>
                <input
                  type="number"
                  value={formData.monthlyQuota}
                  onChange={e => setFormData({ ...formData, monthlyQuota: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For Sales: $ amount. For Marketing: lead count target.
                </p>
              </div>

              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-white mb-4">Edit User</h2>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Monthly Quota
                </label>
                <input
                  type="number"
                  value={formData.monthlyQuota}
                  onChange={e => setFormData({ ...formData, monthlyQuota: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-gray-300 focus:border-slate-600 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  For Sales: $ amount. For Marketing: lead count target.
                </p>
              </div>

              {formError && (
                <p className="text-sm text-red-400">{formError}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
