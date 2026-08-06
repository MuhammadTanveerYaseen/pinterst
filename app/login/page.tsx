'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { Pin, Key, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const router = require('next/navigation').useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/');
  };

  const handleGoogleLogin = async () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-neutral-900 to-black px-4 py-12 text-white">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-red-600 rounded-full filter blur-3xl opacity-10 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-800 rounded-full filter blur-3xl opacity-10 animate-pulse delay-700"></div>

      <div className="relative w-full max-w-md bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl space-y-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-lg shadow-red-600/30 mb-2">
            <Pin className="w-8 h-8 text-white rotate-45" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Pinterest Hub
          </h2>
          <p className="text-sm text-neutral-400">
            Sign in to manage multiple boards & accounts
          </p>
        </div>

        {/* Error Alert */}
        {(err || authError) && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{err || authError}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-red-600 pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                  Password
                </label>
                <a href="#" className="text-xs font-medium text-red-500 hover:text-red-400 transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-red-600 pl-11 pr-4 py-3.5 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3.5 px-4 rounded-2xl shadow-lg shadow-red-600/20 hover:opacity-95 active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-neutral-900 px-3 text-neutral-500 font-semibold tracking-wider">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google SSO Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-white py-3.5 px-4 rounded-2xl font-medium active:scale-[0.99] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.4 3.65 1.5 7.5l3.86 3c.9-2.7 3.4-4.46 6.64-4.46z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.8-.07-1.56-.2-2.27H12v4.51h6.47c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.7-4.94 3.7-8.69z"
            />
            <path
              fill="#FBBC05"
              d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 7.5C.54 9.4 0 11.63 0 14s.54 4.6 1.5 6.5l3.86-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.7-2.87c-1.11.75-2.53 1.2-4.26 1.2-3.24 0-5.74-1.76-6.64-4.46L1.5 17c1.9 3.85 5.85 6 10.5 6z"
            />
          </svg>
          Google
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-red-500 hover:text-red-400 hover:underline transition-colors">
            Register for free
          </Link>
        </p>

        {/* Demo Credentials Box */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-400 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Sandbox Demo Mode Active
          </p>
          <p>Login using any mock email & password (or Google) to inspect features instantly.</p>
        </div>
      </div>
    </div>
  );
}
