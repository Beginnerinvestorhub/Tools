import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export default function ProfileForm() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ name: '', riskTolerance: '', goals: '' });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    user.getIdToken().then(token => {
      axios.get('http://localhost:4000/api/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setProfile(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      await axios.post('http://localhost:4000/api/profile', profile, { headers: { Authorization: `Bearer ${token}` } });
      setSaved(true);
    } catch {
      setSaved(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Profile</h2>
      <p className="mb-4">Email: <span className="font-mono">{user?.email}</span></p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={loading}
            title="Full name"
            placeholder="Enter your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Risk Tolerance</label>
          <select
            name="riskTolerance"
            value={profile.riskTolerance}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            disabled={loading}
            title="Risk tolerance"
          >
            <option value="">Select...</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Investment Goals</label>
          <textarea
            name="goals"
            value={profile.goals}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={3}
            title="Investment goals"
            placeholder="Describe your investment goals"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-700 text-white px-4 py-2 rounded hover:bg-indigo-800 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
        {saved && <span className="text-green-600 ml-2">Profile saved!</span>}
      </form>
    </div>
  );
}
