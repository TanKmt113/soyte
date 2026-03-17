
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api'; // Correctly import the api object

// Define the shape of the user object
interface User {
  id: string;
  name: string;
  email: string;
  full_name: string;
  role: 'admin' | 'user';
}

// Define the shape of the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the provider component
interface AuthProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const storedUser = localStorage.getItem('user_info');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            setLoading(false);
          }
          const response = await api.get('/auth/me');
          setUser(response.user); // Extract the user object
          localStorage.setItem('user_info', JSON.stringify(response.user));
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('auth_token', token);
    setLoading(true);
    try {
        const response = await api.get('/auth/me');
        setUser(response.user); // Extract the user object
        localStorage.setItem('user_info', JSON.stringify(response.user));
    } catch(error) {
        console.error('Failed to fetch user after login:', error);
        setUser(null);
    } finally {
        setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    setUser(null);
    window.location.href = '/login';
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Create a custom hook for easy consumption of the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
