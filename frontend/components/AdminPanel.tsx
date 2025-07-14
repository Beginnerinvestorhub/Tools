import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

interface User {
  uid: string;
  email: string;
  role: string;
  getIdToken: () => Promise<string>;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleUpdating, setRoleUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    user.getIdToken().then(token => {
      axios.get('http://localhost:4000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setUsers(res.data.users))
        .catch(() => setError('Failed to load users'))
        .finally(() => setLoading(false));
    });
  }, [user]);

  const handleRoleChange = async (uid: string, newRole: string) => {
    setRoleUpdating(uid);
    try {
      if (!user) throw new Error('No authenticated user');
      const token = await user.getIdToken();
      await axios.post('http://localhost:4000/api/admin/role', { uid, role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users => users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch {
      setError('Failed to update role');
    } finally {
      setRoleUpdating(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Admin Panel</h2>
      <p className="mb-4">Manage users, roles, and site settings here.</p>
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table className="w-full border mt-4">
          <thead>
            <tr className="bg-indigo-50">
              <th className="py-2 px-2 text-left">Email</th>
              <th className="py-2 px-2 text-left">Role</th>
              <th className="py-2 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.uid} className="border-t">
                <td className="py-2 px-2 font-mono">{u.email}</td>
                <td className="py-2 px-2 capitalize">{u.role}</td>
                <td className="py-2 px-2">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.uid, e.target.value)}
                    disabled={roleUpdating === u.uid}
                    className="border rounded px-2 py-1"
                    title={`Set role for ${u.email}`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="paiduser">Paid User</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
