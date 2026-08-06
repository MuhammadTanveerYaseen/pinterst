'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useMutation, useQuery } from '@apollo/client/react';
import { useRouter, usePathname } from 'next/navigation';

// GraphQL operations
const ME_QUERY = gql`
  query GetMe {
    me {
      id
      name
      email
      role
      subscriptionStatus
      featureFlags
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        subscriptionStatus
        featureFlags
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($name: String!, $email: String!, $password: String!) {
    register(name: $name, email: $email, password: $password) {
      token
      user {
        id
        name
        email
        role
        subscriptionStatus
        featureFlags
      }
    }
  }
`;

const DEFAULT_SYSTEM_USER = {
  id: 'default_owner',
  name: 'Pinterest Manager',
  email: 'admin@pinteresthub.com',
  role: 'owner',
  subscriptionStatus: 'pro',
  featureFlags: ['ai-assistant', 'analytics-pro']
};

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(DEFAULT_SYSTEM_USER);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>('bypass_auth_token');
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const pathname = usePathname();

  // Read initial token from localStorage on mount or set default
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pinterest_hub_token');
      if (stored) {
        setToken(stored);
      }
    }
  }, []);

  // Sync token to query loading states
  const { data, loading: queryLoading, error: queryError } = useQuery(ME_QUERY, {
    skip: !token,
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);

  // Sync user state and resolve loading state when query completes
  useEffect(() => {
    if (data && (data as any).me) {
      setUser((data as any).me);
    } else {
      setUser(DEFAULT_SYSTEM_USER);
    }
    setLoading(false);
  }, [data, queryLoading, queryError]);

  // Auth System Bypassed — No route locking or login redirects
  useEffect(() => {
    // Keep user logged in on all pages
  }, [user, pathname]);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data } = await loginMutation({ variables: { email, password } });
      if (data && (data as any).login) {
        const res = (data as any).login;
        localStorage.setItem('pinterest_hub_token', res.token);
        setUser(res.user);
        setToken(res.token); // Triggers re-query/mount
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setError(null);
      const { data } = await registerMutation({ variables: { name, email, password } });
      if (data && (data as any).register) {
        const res = (data as any).register;
        localStorage.setItem('pinterest_hub_token', res.token);
        setUser(res.user);
        setToken(res.token); // Triggers re-query/mount
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = () => {
    setUser(DEFAULT_SYSTEM_USER);
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
