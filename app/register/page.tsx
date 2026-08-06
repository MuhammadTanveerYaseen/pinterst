'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { Pin, User, Mail, Lock, ShieldAlert, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const { register, error: authError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErr('Please fill in all fields.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (e: any) {
      setErr(e.message || 'Failed to register account.');
      setLoading(false);
    }
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
            Get Started
          </h2>
          <p className="text-sm text-neutral-400">
            Create your Pinterest Hub account today
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <User className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-red-600 pl-11 pr-4 py-3 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
            </div>

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
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-red-600 pl-11 pr-4 py-3 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-neutral-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-950/80 border border-neutral-800 focus:border-red-600 pl-11 pr-4 py-3 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
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
                Registering...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-neutral-400">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-red-500 hover:text-red-400 hover:underline transition-colors">
            Sign In
          </Link>
        </p>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-xs text-neutral-400 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-red-500" />
            Sandbox Demo Active
          </p>
          <p>Registering will dynamically create a user in the local fallback database.</p>
        </div>
      </div>
    </div>
  );
}
