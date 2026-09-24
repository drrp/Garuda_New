import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

// Define the structure of the user object
export interface User {
  id: string; // A unique ID, generated from email for simulation
  email: string;
  displayName: string;
  photoURL?: string; // Keep this for UI consistency
  role: 'admin' | 'user';
}

// Define the shape of the context
interface AuthContextType {
  user: User | null;
  login: (name: string, email: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_EMAIL = 'admin@auchithyam.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback((name: string, email: string) => {
    try {
      const isAdmin = email.toLowerCase() === ADMIN_EMAIL;
      
      // Create a simple, consistent ID from the email for the simulation
      const userId = `simulated-${email.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      const userToSave: User = {
        id: userId,
        email: email,
        displayName: name,
        // photoURL is omitted; the UI will handle its absence.
        role: isAdmin ? 'admin' : 'user',
      };
      
      localStorage.setItem('currentUser', JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error) {
      console.error("Failed to simulate login:", error);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
  }, []);

  const value = { user, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};