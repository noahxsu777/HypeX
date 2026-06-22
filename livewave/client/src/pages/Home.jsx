import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import RoomCard from '../components/RoomCard';
import BottomNav from '../components/BottomNav';

const CATEGORIES = ['All', 'Entertainment', 'Music', 'Gaming', 'Dance', 'Talk'];

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fetchRooms = useCallback(async (cat = category, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const params = cat !== 'All' ? { category: cat } : {};
      const { data } = await axios.get('/api/rooms/live', { params });
      setRooms(data.rooms || data || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category]);

  useEffect(() => { fetchRooms(category); }, [category]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
  };

  // Pull to refresh via touch
  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = e.changedTouches[0].clientY - touchStart;
    if (diff > 80 && window.scrollY === 0) fetchRooms(category, true);
    setTouchStart(null);
  };

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] pb-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a] safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff3366] to-[#ff6b35] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                <circle cx="20" cy="20" r="8" fill="white" opacity="0.9" />
                <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="3" fill="none" opacity="0.6" />
              </svg>
            </div>
            <span className="text-lg font-extrabold gradient-text">LiveWave</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Coin balance */}
            <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-full px-3 py-1.5">
              <span className="coin-color text-sm">🪙</span>
              <span className="text-yellow-400 text-xs font-bold">{(user?.coins || 0).toLocaleString()}</span>
            </div>
            {/* Notification */}
            <button className="relative w-9 h-9 flex items-center justify-center rounded-full bg-[#1a1a1a] text-[#aaa] hover:text-white transition-colors">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
              </svg>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff3366] rounded-full" />
            </button>
            {/* Avatar */}
            <button onClick={() => navigate(`/profile/${user?.id}`)} className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#ff3366]/40">
              <img
                src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                alt={user?.username}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}&backgroundColor=ff3366`; }}
              />
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex overflow-x-auto scrollbar-none gap-1 px-4 pb-3 no-scrollbar">
          <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-[#ff3366] text-white shadow-sm shadow-[#ff3366]/40'
                  : 'bg-[#1a1a1a] text-[#aaa] hover:text-white hover:bg-[#252525]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="flex items-center justify-center py-4">
          <svg className="animate-spin w-5 h-5 text-[#ff3366]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="ml-2 text-[#aaa] text-sm">Refreshing...</span>
        </div>
      )}

      {/* Main content */}
      <div className="px-3 pt-3">
        {loading ? (
          /* Skeleton grid */
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-[#1a1a1a] animate-pulse overflow-hidden">
                <div className="aspect-[9/16] bg-[#252525]" />
              </div>
            ))}
          </div>
        ) : rooms.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#444" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-2">No live streams right now</h3>
            <p className="text-[#666] text-sm mb-6">
              {category !== 'All' ? `No ${category} streams live yet.` : 'Be the first to go live!'}
            </p>
            <button
              onClick={() => navigate('/go-live')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white font-bold text-sm shadow-lg shadow-[#ff3366]/25"
            >
              Start Streaming
            </button>
          </div>
        ) : (
          /* Room grid */
          <div className="grid grid-cols-2 gap-2">
            {rooms.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Go Live button */}
      <button
        onClick={() => navigate('/go-live')}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white font-bold shadow-xl shadow-[#ff3366]/40 hover:shadow-[#ff3366]/60 active:scale-95 transition-all"
      >
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.5" />
        </svg>
        Go Live
      </button>

      <BottomNav />
    </div>
  );
}
