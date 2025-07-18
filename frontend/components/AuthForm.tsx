import { useState } from 'react'

interface AuthFormProps {
  mode?: 'login' | 'signup'
}

export default function AuthForm({ mode = 'login' }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full gap-4">
      <label className="flex flex-col w-full text-sm">
        Email
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </label>
      <label className="flex flex-col w-full text-sm">
        Password
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="mt-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
      </label>
      <button
        type="submit"
        className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        {mode === 'login' ? 'Login' : 'Sign Up'}
      </button>
    </form>
  )
}