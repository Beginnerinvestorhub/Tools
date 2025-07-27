import React, { useEffect, useState } from 'react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { profileValidationSchema } from '../lib/validationSchemas';
import { useAuth } from '../hooks/useAuth'; // Assuming a hook that provides the Firebase user
import axios from 'axios'; // Using axios as in the original component

interface ProfileFormData {
  firstName: string;
  lastName: string;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | '';
  goals?: string;
}

const riskOptions = [
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

export default function ProfileForm() {
  const { user } = useAuth();
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileValidationSchema),
    mode: 'onChange', // Validate on change for immediate feedback
    defaultValues: {
      firstName: '',
      lastName: '',
      riskTolerance: '',
      goals: '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // The old form had a single 'name' field. We adapt to firstName/lastName.
        const [firstName, ...lastNameParts] = data.name?.split(' ') || ['', ''];
        reset({
          firstName: data.firstName || firstName,
          lastName: data.lastName || lastNameParts.join(' '),
          riskTolerance: data.riskTolerance || '',
          goals: data.goals || '',
        });
      } catch (error) {
        setStatusMessage({ type: 'error', message: 'Failed to load profile.' });
      }
    };
    fetchProfile();
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    setStatusMessage(null);
    try {
      const token = await user.getIdToken();
      // The backend route is PUT for updates
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/profile`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatusMessage({ type: 'success', message: 'Profile saved successfully!' });
      reset(data); // Resets the dirty state after a successful save
    } catch (error: any) {
      const message = error.response?.data?.message || 'An unexpected error occurred.';
      setStatusMessage({ type: 'error', message });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">Profile</h2>
      {user?.email && <p className="mb-4">Email: <span className="font-mono">{user.email}</span></p>}
      <form onSubmit={handleSubmit
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
