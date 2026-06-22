import React from 'react';
import { useNavigate } from 'react-router-dom';

const CATEGORY_GRADIENTS = {
  Entertainment: 'from-purple-900 to-pink-900',
  Music: 'from-blue-900 to-purple-900',
  Gaming: 'from-green-900 to-teal-900',
  Dance: 'from-pink-900 to-red-900',
  Talk: 'from-orange-900 to-yellow-900',
};

const CATEGORY_EMOJIS = {
  Entertainment: '🎭',
  Music: '🎵',
  Gaming: '🎮',
  Dance: '💃',
  Talk: '💬',
};

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const gradient = CATEGORY_GRADIENTS[room.category] || 'from-[#1a1a2e] to-[#0f3460]';

  return (
    <button
      onClick={() => navigate(`/live/${room.id}`)}
      className="relative rounded-2xl overflow-hidden bg-[#1a1a1a] border border-[#2a2a2a] active:scale-95 transition-transform text-left w-full"
    >
      {/* Thumbnail area - portrait 9:16 */}
      <div className={`relative w-full bg-gradient-to-br ${gradient}`} style={{ paddingTop: '177.78%' }}>
        {room.thumbnail_url ? (
          <img
            src={room.thumbnail_url}
            alt={room.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center opacity-60">
              <div className="text-4xl mb-2">{CATEGORY_EMOJIS[room.category] || '📡'}</div>
              <div className="w-8 h-8 rounded-full border-2 border-white/20 mx-auto flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

        {/* LIVE badge - top left */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-[#ff3366] rounded-md px-2 py-0.5 live-badge">
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-white text-[10px] font-bold tracking-wide">LIVE</span>
        </div>

        {/* Viewer count - top right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 rounded-md px-2 py-0.5">
          <svg width="10" height="10" fill="white" viewBox="0 0 24 24" opacity="0.9">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          <span className="text-white text-[10px] font-semibold">
            {(room.viewer_count || 0) >= 1000
              ? `${((room.viewer_count || 0) / 1000).toFixed(1)}k`
              : (room.viewer_count || 0)}
          </span>
        </div>

        {/* Category tag */}
        {room.category && (
          <div className="absolute top-8 left-2 mt-0.5">
            <span className="bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md">
              {CATEGORY_EMOJIS[room.category]} {room.category}
            </span>
          </div>
        )}

        {/* Host info - bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#ff3366]/60 flex-shrink-0">
              <img
                src={room.host_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.host_username}`}
                alt={room.host_username}
                className="w-full h-full object-cover"
                onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${room.host_username}&backgroundColor=ff3366`; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{room.host_username}</p>
              <p className="text-white/70 text-[10px] truncate leading-tight">{room.title}</p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
