import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { login, signup, error, loading } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (mode === 'login') {
        await login(email, password);
        router.push('/dashboard');
      } else {
        await signup(email, password);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-indigo-700">{mode === 'login' ? 'Log In' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <input
          type="email"
          className="w-full border border-indigo-300 rounded px-4 py-2"
          placeholder="Email"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border border-indigo-300 rounded px-4 py-2"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-indigo-700 text-white py-2 rounded hover:bg-indigo-800 font-semibold"
          disabled={loading}
        >
          {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
        {formError && <div className="text-red-500 text-sm">{formError}</div>}
        {error && <div className="text-red-500 text-sm">{error.message}</div>}
      </form>
    </div>
  );
}
