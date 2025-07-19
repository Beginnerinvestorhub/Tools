import { render, screen } from '@testing-library/react';
import LoginPage from '../pages/login';

// Smoke test – ensures login page renders without crashing

describe('LoginPage', () => {
  it('renders login heading and form', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
