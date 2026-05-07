import { createContext, useContext } from 'react';
import { useSession, signOut } from '../lib/auth-client';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  refetch: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function useAuthState(): AuthContextType {
  const { data: session, isPending, refetch } = useSession();

  const user = session?.user
    ? { id: session.user.id, email: session.user.email, name: session.user.name ?? undefined }
    : null;

  return {
    user,
    loading: isPending,
    logout: async () => { await signOut(); },
    refetch,
  };
}
