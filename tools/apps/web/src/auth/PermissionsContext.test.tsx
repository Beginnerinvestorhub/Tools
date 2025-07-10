import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { PermissionsProvider, usePermissions } from './PermissionsContext';
import { Role } from './roles';

describe('PermissionsContext', () => {
  it('provides and updates user state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PermissionsProvider>{children}</PermissionsProvider>
    );
    const { result } = renderHook(() => usePermissions(), { wrapper });
    expect(result.current.user).toBeNull();
    act(() => {
      result.current.setUser({ id: '1', name: 'Test', role: Role.User });
    });
    expect(result.current.user?.role).toBe(Role.User);
  });
});
