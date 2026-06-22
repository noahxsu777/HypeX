import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }
    const ok = await register(username, password, phone);
    if (ok) navigate('/');
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 py-10">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ff3366] to-[#ff6b35] flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#ff3366]/30">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="8" fill="white" opacity="0.9" />
            <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="2.5" fill="none" opacity="0.5" />
            <circle cx="20" cy="20" r="20" stroke="white" strokeWidth="2" fill="none" opacity="0.2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold gradient-text">LiveWave</h1>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm glass rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-1">Create account</h2>
        <p className="text-[#aaa] text-sm mb-6">Join thousands of live streamers</p>

        {displayError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-[#ff3366]/10 border border-[#ff3366]/30 text-[#ff3366] text-sm">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-1.5 uppercase tracking-wide">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a unique username"
              required
              minLength={3}
              maxLength={20}
              autoComplete="username"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366]/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-1.5 uppercase tracking-wide">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366]/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-1.5 uppercase tracking-wide">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366]/40 transition-all"
            />
          </div>

          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-1.5 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              autoComplete="new-password"
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
                Creating account...
              </span>
            ) : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-[#666] text-xs">
          By signing up you agree to our{' '}
          <span className="text-[#ff3366] cursor-pointer">Terms</span> and{' '}
          <span className="text-[#ff3366] cursor-pointer">Privacy Policy</span>
        </p>

        <div className="mt-5 text-center">
          <span className="text-[#aaa] text-sm">Already have an account? </span>
          <Link to="/login" className="text-[#ff3366] font-semibold text-sm hover:text-[#ff6699] transition-colors">
            Sign In
          </Link>
        </div>
      </div>

      {/* Decorative gradient orbs */}
      <div className="fixed top-0 right-0 w-64 h-64 rounded-full bg-[#ff3366]/5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-64 h-64 rounded-full bg-[#ff6b35]/5 blur-3xl pointer-events-none" />
    </div>
  );
}
