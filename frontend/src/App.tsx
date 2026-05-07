import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, useAuth, useAuthState } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/Login';
import { InboxPage } from './pages/Inbox';
import { EmailDetailPage } from './pages/EmailDetail';
import { ConfigPage } from './pages/Config';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-acacia-400 animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-acacia-400 animate-spin" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const authState = useAuthState();
  return (
    <AuthContext.Provider value={authState}>
      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout><InboxPage /></Layout></ProtectedRoute>} />
        <Route path="/emails/:id" element={<ProtectedRoute><Layout><EmailDetailPage /></Layout></ProtectedRoute>} />
        <Route path="/config" element={<ProtectedRoute><Layout><ConfigPage /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}

export default function App() {
  return <AppRoutes />;
}
