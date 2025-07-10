import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Role } from './roles';

interface User {
  id: string;
  name: string;
  role: Role;
}

interface PermissionsContextType {
  user: User | null;
  setUser: (user: User | null) => void;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export const PermissionsProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  return (
    <PermissionsContext.Provider value={{ user, setUser }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};
