'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth-context';
import { useTheme } from './Providers';
import { 
  Pin, LayoutDashboard, UserCheck, CalendarDays, BarChart3, 
  FolderHeart, Cpu, Users, History, Shield, LogOut, 
  Menu, X, Sun, Moon, Bell, HelpCircle, Check, AlertCircle
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Globally register a toast helper
  useEffect(() => {
    window.showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-neutral-400 font-medium">Restoring secure session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via auth context
  }

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Accounts Manager', href: '/accounts', icon: UserCheck },
    { name: 'Post Scheduler', href: '/scheduler', icon: CalendarDays },
    { name: 'Content Library', href: '/library', icon: FolderHeart },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Automation Rules', href: '/automation', icon: Cpu },
    { name: 'Team Management', href: '/team', icon: Users },
    { name: 'Activity Logs', href: '/logs', icon: History },
  ];

  // Admin access link
  const isAdmin = user.role === 'admin' || user.role === 'owner';
  if (isAdmin) {
    navItems.push({ name: 'Admin Panel', href: '/admin', icon: Shield });
  }

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);
  const handleMobileMenuToggle = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="min-h-screen flex bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50">
      
      {/* Toast Notification Container */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-2xl shadow-xl flex items-start gap-3 border backdrop-blur-md transition-all duration-300 animate-slide-in ${
              toast.type === 'success' 
                ? 'bg-emerald-500/10 dark:bg-emerald-950/80 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                : toast.type === 'error'
                ? 'bg-red-500/10 dark:bg-red-950/80 border-red-500/30 text-red-600 dark:text-red-400'
                : 'bg-blue-500/10 dark:bg-blue-950/80 border-blue-500/30 text-blue-600 dark:text-blue-400'
            }`}
          >
            {toast.type === 'success' && <Check className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
            {toast.type === 'info' && <HelpCircle className="w-5 h-5 flex-shrink-0" />}
            <p className="text-sm font-semibold">{toast.message}</p>
          </div>
        ))}
      </div>

      {/* Sidebar for Desktop */}
      <aside 
        className={`hidden md:flex flex-col bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0 rotate-45 shadow-lg shadow-red-600/20">
              <Pin className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                Pinterest Hub
              </span>
            )}
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-150 group relative ${
                  isActive 
                    ? 'bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                {sidebarOpen && <span className="text-sm truncate">{item.name}</span>}
                {!sidebarOpen && (
                  <span className="absolute left-20 bg-neutral-900 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 shadow-md">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={logout}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/5 dark:hover:bg-red-500/5 transition-all duration-150 ${
              sidebarOpen ? 'justify-start' : 'justify-center'
            }`}
          >
            <LogOut className="w-5 h-5 text-neutral-400 group-hover:text-red-500 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden bg-neutral-950/40 backdrop-blur-sm" onClick={handleMobileMenuToggle}>
          <aside className="w-64 h-full bg-white dark:bg-neutral-900 flex flex-col border-r border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
            <div className="h-16 flex items-center px-6 border-b border-neutral-200 dark:border-neutral-800 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center rotate-45">
                  <Pin className="w-5 h-5 text-white" />
                </div>
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                  Pinterest Hub
                </span>
              </div>
              <button onClick={handleMobileMenuToggle}>
                <X className="w-6 h-6 text-neutral-500" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleMobileMenuToggle}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-150 ${
                      isActive 
                        ? 'bg-red-500/10 text-red-600 dark:text-red-400 font-semibold' 
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={logout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-neutral-500 hover:text-red-600 hover:bg-red-500/5 transition-all duration-150"
              >
                <LogOut className="w-5 h-5 text-neutral-400" />
                <span className="text-sm font-semibold">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Desktop collapse button */}
            <button 
              onClick={handleSidebarToggle} 
              className="hidden md:flex p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Mobile menu trigger */}
            <button 
              onClick={handleMobileMenuToggle} 
              className="flex md:hidden p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h1 className="text-base md:text-lg font-bold truncate">
              {navItems.find(item => item.href === pathname)?.name || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 transition-all duration-150"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Notification Drawer Trigger */}
            <button
              className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-neutral-100 relative transition-all duration-150"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Divider */}
            <div className="h-6 w-[1px] bg-neutral-200 dark:bg-neutral-800"></div>

            {/* User Badge */}
            <div className="flex items-center gap-3 pl-1">
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center font-bold text-xs uppercase text-neutral-600 dark:text-neutral-300">
                {user.name.slice(0, 2)}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-sm font-semibold leading-none">{user.name}</span>
                <span className="text-xxs text-neutral-400 capitalize mt-0.5">{user.role}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
