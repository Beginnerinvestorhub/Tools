import React,
 { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/router';

/**
 * Props for the AuthForm component.
 * @prop {string} mode - The form mode. Must be either 'login' or 'signup'.
 */
interface AuthFormProps {
       mode: 'login' |    'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const { login, signup, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    try {
      const authAction = mode === 'login' ? login : signup;
      await authAction(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    }
  };

 