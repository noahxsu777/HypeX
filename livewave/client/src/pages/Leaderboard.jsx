import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BottomNav from '../components/BottomNav';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('streamers');
  const [streamers, setStreamers] = useState([]);
  const [gifters, setGifters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sRes, gRes] = await Promise.all([
          axios.get('/api/leaderboard/top-streamers'),
          axios.get('/api/leaderboard/top-gifters'),
        ]);
        setStreamers(sRes.data.leaderboard || []);
        setGifters(gRes.data.leaderboard || []);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const list = tab === 'streamers' ? streamers : gifters;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-20">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <h1 className="text-white font-black text-xl mb-4">🏆 Leaderboard</h1>

        {/* Tab switcher */}
        <div className="flex bg-[#111] rounded-xl p-1 gap-1">
          {[
            { id: 'streamers', label: '📺 Top Streamers' },
            { id: 'gifters', label: '🎁 Top Gifters' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id ? 'bg-[#ff3366] text-white' : 'text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 mt-2">
        {loading ? (
          <div className="flex flex-col gap-3 mt-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#1a1a1a] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <span className="text-5xl">🏆</span>
            <p className="text-gray-400 text-sm">No data yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 mt-2">
            {list.map((entry, idx) => (
              <div
                key={entry.id}
                onClick={() => navigate(`/profile/${entry.id}`)}
                className="bg-[#111] rounded-xl p-3 flex items-center gap-3 cursor-pointer active:bg-[#1a1a1a]"
              >
                <div className="w-8 text-center">
                  {idx < 3 ? (
                    <span className="text-2xl">{medals[idx]}</span>
                  ) : (
                    <span className="text-gray-500 font-bold text-sm">#{idx + 1}</span>
                  )}
                </div>
                <img
                  src={entry.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.username}`}
                  alt=""
                  className="w-11 h-11 rounded-full border-2 border-[#2a2a2a]"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{entry.username}</p>
                  {tab === 'streamers' ? (
                    <p className="text-gray-500 text-xs">
                      {entry.followers_count || 0} followers · {entry.total_streams || 0} streams
                    </p>
                  ) : (
                    <p className="text-gray-500 text-xs">
                      {(entry.total_coins_spent || 0).toLocaleString()} coins spent
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {tab === 'streamers' ? (
                    <span className="diamond-color text-sm font-bold">
                      💎 {(entry.diamonds || 0).toLocaleString()}
                    </span>
                  ) : (
                    <span className="diamond-color text-sm font-bold">
                      💎 {(entry.diamonds || 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
