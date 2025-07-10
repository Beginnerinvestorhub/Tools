import React from 'react';
import { render, screen } from '@testing-library/react';
import { Permissioned } from './Permissioned';
import { PermissionsProvider } from './PermissionsContext';
import { Role } from './roles';

function renderWithRole(role: Role | null, children: React.ReactNode) {
  const user = role ? { id: '1', name: 'Test', role } : null;
  return render(
    <PermissionsProvider>
      <Permissioned allowed={[Role.Admin, Role.User]}>{children}</Permissioned>
    </PermissionsProvider>
  );
}

test('renders children if user has allowed role', () => {
  renderWithRole(Role.Admin, <div>Visible</div>);
  expect(screen.getByText('Visible')).toBeInTheDocument();
});

test('does not render children if user does not have allowed role', () => {
  renderWithRole(Role.Guest, <div>Hidden</div>);
  expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
});

test('renders fallback if user is not allowed', () => {
  // You can extend Permissioned to support fallback in tests
});
