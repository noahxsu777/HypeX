import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(username, password);
    if (ok) navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ff3366] to-[#ff6b35] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#ff3366]/30">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="8" fill="white" opacity="0.9" />
            <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5" />
            <circle cx="20" cy="20" r="20" stroke="white" strokeWidth="2" fill="none" opacity="0.2" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold gradient-text">LiveWave</h1>
        <p className="text-[#aaa] text-sm mt-1">Go live. Connect the world.</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-6">Welcome back</h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-1.5 uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366]/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366]/40 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-[#ff3366] to-[#ff6b35] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#ff3366]/25 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-[#aaa] text-sm">Don't have an account? </span>
          <Link to="/register" className="text-[#ff3366] font-semibold text-sm hover:text-[#ff6699] transition-colors">
            Sign Up
          </Link>
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div className="fixed top-0 left-0 w-64 h-64 rounded-full bg-[#ff3366]/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-64 h-64 rounded-full bg-[#ff6b35]/5 blur-3xl pointer-events-none" />
    </div>
  );
}
