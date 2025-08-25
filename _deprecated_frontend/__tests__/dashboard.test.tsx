import { render, screen } from '@testing-library/react';
import DashboardPage from '../pages/dashboard';

jest.mock('../hooks/useAuth', () => () => ({ user: { email: 'test@example.com', token: 'mock' }, loading: false }));

jest.mock('../components/MainAppEmbed', () => () => <div>Embedded App</div>);

it('renders dashboard and embedded app', () => {
  render(<DashboardPage />);
  expect(screen.getByText(/embedded app/i)).toBeInTheDocument();
  expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
});
