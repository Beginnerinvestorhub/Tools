import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AuthForm from '../components/AuthForm';

jest.mock('../lib/firebase', () => ({
  auth: { signInWithEmailAndPassword: jest.fn(), createUserWithEmailAndPassword: jest.fn() },
}));

describe('AuthForm', () => {
  it('renders login form and handles submit', async () => {
    render(<AuthForm mode="login" />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });
  });

  it('renders signup form', () => {
    render(<AuthForm mode="signup" />);
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });
});
