import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Inbox, Settings, LogOut, Menu, X, UserCog } from 'lucide-react';
import { useState } from 'react';
import { isRootUser } from '../lib/api';
import { UserManagementModal } from './UserManagementModal';

const navItems = [
  { path: '/',       label: 'Inbox',  icon: Inbox,    color: 'blue' },
  { path: '/config', label: 'Config', icon: Settings, color: 'orange' },
];

const activeStyles: Record<string, string> = {
  blue:   'bg-acacia-blue-highlight text-acacia-blue-text',
  orange: 'bg-acacia-orange-highlight text-acacia-orange-text',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  const isRoot = user ? isRootUser(user.email) : false;

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo + nav */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img src="/acacia_logo.png" alt="Acacia" className="h-8" />
                <span className="ml-2 text-xl font-bold font-mali text-gray-900">Email Helper</span>
              </div>
              <nav className="hidden md:ml-8 md:flex md:space-x-2">
                {navItems.map(({ path, label, icon: Icon, color }) => {
                  const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
                  return (
                    <Link key={path} to={path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${active ? activeStyles[color] : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1">
              <span className="hidden xm:block text-sm text-gray-500 mr-2">{user?.email}</span>
              {isRoot && (
                <button onClick={() => setUserMgmtOpen(true)} title="Manage user access"
                  className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                  <UserCog className="h-4 w-4" />
                </button>
              )}
              <button onClick={handleLogout}
                className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${location.pathname === path ? 'bg-acacia-50 text-acacia-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                  <Icon className="h-5 w-5 mr-3" />
                  {label}
                </Link>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md">
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {userMgmtOpen && <UserManagementModal onClose={() => setUserMgmtOpen(false)} />}
    </div>
  );
}
