import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import BottomNav from '../components/BottomNav';

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [streams, setStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('streams');
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = String(currentUser?.id) === String(userId);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`/api/users/${userId}`);
        setProfile(data.user || data);
        setFollowing(data.user?.is_following || data.is_following || false);
        setStreams(data.recent_streams || []);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (following) {
        await axios.delete(`/api/users/${userId}/follow`);
        setFollowing(false);
        setProfile(p => p ? { ...p, followers_count: (p.followers_count || 0) - 1 } : p);
      } else {
        await axios.post(`/api/users/${userId}/follow`);
        setFollowing(true);
        setProfile(p => p ? { ...p, followers_count: (p.followers_count || 0) + 1 } : p);
      }
    } catch (err) {
      console.error('Follow action failed:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <svg className="animate-spin w-8 h-8 text-[#ff3366]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="relative">
        {/* Banner gradient */}
        <div className="h-40 bg-gradient-to-br from-[#ff3366]/30 via-[#1a1a2e] to-[#0f3460]" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 safe-top w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 rounded-full border-4 border-[#0a0a0a] overflow-hidden">
            <img
              src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`}
              alt={profile?.username}
              className="w-full h-full object-cover bg-[#1a1a1a]"
              onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.username}&backgroundColor=ff3366`; }}
            />
          </div>
          {profile?.is_live && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#ff3366] text-white text-[10px] font-bold px-2 py-0.5 rounded-full live-badge">
              LIVE
            </div>
          )}
        </div>
      </div>

      {/* Profile info */}
      <div className="pt-16 px-4 text-center">
        <h1 className="text-white font-bold text-xl">{profile?.username}</h1>
        {profile?.bio && (
          <p className="text-[#aaa] text-sm mt-1 max-w-xs mx-auto">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="flex justify-center gap-8 mt-4">
          {[
            { label: 'Followers', value: formatCount(profile?.followers_count) },
            { label: 'Following', value: formatCount(profile?.following_count) },
            { label: 'Diamonds', value: formatCount(profile?.diamonds_earned) },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-white font-bold text-lg">{stat.value}</div>
              <div className="text-[#666] text-xs">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center mt-5">
          {isOwnProfile ? (
            <>
              <button
                onClick={() => navigate('/gift-store')}
                className="flex-1 max-w-[140px] py-2.5 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm font-semibold"
              >
                🪙 Buy Coins
              </button>
              <button
                onClick={() => navigate('/go-live')}
                className="flex-1 max-w-[140px] py-2.5 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white text-sm font-bold"
              >
                Go Live
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex-1 max-w-[140px] py-2.5 rounded-xl text-sm font-bold transition-all ${
                  following
                    ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa]'
                    : 'bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white shadow-lg shadow-[#ff3366]/25'
                }`}
              >
                {followLoading ? '...' : following ? 'Following' : 'Follow'}
              </button>
              {profile?.is_live && (
                <button
                  onClick={() => navigate(`/live/${profile.current_room_id}`)}
                  className="flex-1 max-w-[140px] py-2.5 rounded-xl bg-[#1a1a1a] border border-[#ff3366]/30 text-[#ff3366] text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#ff3366] live-badge" />
                  Watch Live
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Diamond balance (own profile) */}
      {isOwnProfile && (
        <div className="mx-4 mt-5 glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">💎</span>
            <div>
              <div className="text-white font-bold text-lg">{formatCount(currentUser?.diamonds || 0)}</div>
              <div className="text-[#666] text-xs">Diamonds earned</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🪙</span>
            <div>
              <div className="text-white font-bold text-lg coin-color">{formatCount(currentUser?.coins || 0)}</div>
              <div className="text-[#666] text-xs">Coins balance</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex mt-6 border-b border-[#1a1a1a]">
        {['streams', 'about'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-semibold capitalize transition-colors ${
              activeTab === tab
                ? 'text-[#ff3366] border-b-2 border-[#ff3366]'
                : 'text-[#666]'
            }`}
          >
            {tab === 'streams' ? 'Recent Streams' : 'About'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {activeTab === 'streams' ? (
          streams.length === 0 ? (
            <div className="text-center py-16 text-[#555]">
              <div className="text-4xl mb-3">📺</div>
              <p className="text-sm">No recent streams</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {streams.map(stream => (
                <div key={stream.id} className="rounded-xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a]">
                  <div className="aspect-video bg-gradient-to-br from-[#1a1a2e] to-[#0f3460] relative">
                    {stream.thumbnail && (
                      <img src={stream.thumbnail} className="w-full h-full object-cover" alt={stream.title} />
                    )}
                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded-md px-1.5 py-0.5 text-white text-[10px]">
                      {stream.duration || '--'}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-white text-xs font-medium truncate">{stream.title}</p>
                    <p className="text-[#666] text-[10px] mt-0.5">{stream.viewer_peak?.toLocaleString() || 0} peak viewers</p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {[
              { label: 'Username', value: profile?.username },
              { label: 'Member since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Unknown' },
              { label: 'Total streams', value: profile?.stream_count || 0 },
            ].map(item => (
              <div key={item.label} className="flex justify-between py-3 border-b border-[#1a1a1a]">
                <span className="text-[#666] text-sm">{item.label}</span>
                <span className="text-white text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
