import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function PKInviteModal({ roomId, onClose, emit }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [invitedUser, setInvitedUser] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await axios.get('/api/users/search', { params: { q: search, live: true } });
        setResults(data.users || data || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Countdown after invite sent
  useEffect(() => {
    if (!inviteSent) return;
    setCountdown(30);
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current);
          onClose();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(countdownRef.current);
  }, [inviteSent]);

  const handleInvite = async (targetUser) => {
    try {
      const { data } = await axios.post('/api/pk/invite', {
        challenger_room_id: roomId,
        target_room_id: targetUser.current_room_id || targetUser.room_id,
      });
      setInvitedUser(targetUser);
      setInviteSent(true);
      if (emit) emit('pk:invite', { targetUserId: targetUser.id, pkId: data.pk_id });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send PK invite');
    }
  };

  const handleCancel = () => {
    clearInterval(countdownRef.current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4" onClick={handleCancel}>
      <div
        className="bg-[#111] rounded-2xl slide-up w-full max-w-md max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#222]">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <h3 className="text-white font-bold">PK Battle</h3>
          </div>
          <button
            onClick={handleCancel}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] text-[#aaa]"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {inviteSent ? (
          /* Waiting state */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            {/* Animated radar */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-[#ff3366]/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-[#ff3366]/40 animate-ping" style={{ animationDelay: '0.3s' }} />
              <div className="w-24 h-24 rounded-full border-2 border-[#ff3366]/60 flex items-center justify-center">
                <span className="text-3xl">⚔️</span>
              </div>
            </div>

            <h3 className="text-white font-bold text-lg mb-1">Invite Sent!</h3>
            <p className="text-[#aaa] text-sm mb-2">
              Waiting for <span className="text-[#ff3366] font-semibold">{invitedUser?.username}</span> to respond...
            </p>
            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-full px-4 py-2 mt-2">
              <span className="text-[#aaa] text-sm">Auto-cancel in</span>
              <span className={`font-bold text-lg ${countdown <= 10 ? 'text-[#ff3366]' : 'text-white'}`}>{countdown}s</span>
            </div>

            <button
              onClick={handleCancel}
              className="mt-6 px-6 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] text-sm font-semibold"
            >
              Cancel Invite
            </button>
          </div>
        ) : (
          /* Search state */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search bar */}
            <div className="px-4 py-3 border-b border-[#222]">
              <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search live streamers..."
                  autoFocus
                  className="flex-1 bg-transparent text-white text-sm placeholder-[#555] focus:outline-none"
                />
                {searching && (
                  <svg className="animate-spin w-4 h-4 text-[#ff3366]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                )}
              </div>
              <p className="text-[#555] text-xs mt-2 text-center">Only live streamers can be challenged</p>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto py-2">
              {results.length === 0 && search.trim() && !searching ? (
                <div className="text-center py-8 text-[#555]">
                  <p className="text-3xl mb-2">🔍</p>
                  <p className="text-sm">No live streamers found</p>
                </div>
              ) : results.length === 0 && !search.trim() ? (
                <div className="text-center py-8 text-[#555]">
                  <p className="text-3xl mb-2">⚔️</p>
                  <p className="text-sm">Search for a streamer to challenge</p>
                </div>
              ) : (
                results.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#1a1a1a] transition-colors"
                  >
                    <div className="relative">
                      <img
                        src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                        alt={user.username}
                        className="w-11 h-11 rounded-full border-2 border-[#ff3366]/40"
                        onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.username}&backgroundColor=ff3366`; }}
                      />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#ff3366] rounded-full border-2 border-[#111] live-badge" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{user.username}</p>
                      <p className="text-[#666] text-xs">
                        {(user.viewer_count || 0).toLocaleString()} viewers
                      </p>
                    </div>
                    <button
                      onClick={() => handleInvite(user)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white text-xs font-bold active:scale-95 transition-transform"
                    >
                      Invite ⚔️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
