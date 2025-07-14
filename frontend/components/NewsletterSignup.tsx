import React, { useState } from 'react';
import axios from 'axios';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);
    try {
      await axios.post('http://localhost:4000/api/newsletter', { email });
      setStatus('success');
      setEmail('');
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.error || 'Something went wrong.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-2 mt-8 max-w-lg mx-auto">
      <input
        type="email"
        className="flex-1 border border-indigo-300 rounded px-4 py-2"
        placeholder="Your email for updates"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        className="bg-indigo-700 text-white px-6 py-2 rounded font-semibold hover:bg-indigo-800 disabled:opacity-50"
        disabled={status === 'loading' || !email}
      >
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {status === 'success' && <span className="text-green-600 ml-2">Thank you for subscribing!</span>}
      {status === 'error' && <span className="text-red-500 ml-2">{error}</span>}
    </form>
  );
}
