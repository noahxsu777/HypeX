import React from 'react';

export default function ViewerList({ viewers = [], count = 0, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-[#111] rounded-t-2xl slide-up max-h-[60vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#222]">
          <h3 className="text-white font-bold">
            Viewers
            <span className="ml-2 text-sm text-[#aaa] font-normal">{count.toLocaleString()}</span>
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] text-[#aaa]"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {viewers.length > 0 ? (
            <div className="space-y-3">
              {viewers.map((viewer, i) => (
                <div key={viewer.id || i} className="flex items-center gap-3">
                  <img
                    src={viewer.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewer.username}`}
                    alt={viewer.username}
                    className="w-10 h-10 rounded-full border border-[#2a2a2a]"
                    onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${viewer.username}&backgroundColor=ff3366`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{viewer.username}</p>
                    {viewer.level && (
                      <p className="text-[#666] text-xs">Level {viewer.level}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Summary when no individual viewer list */
            <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <div className="w-12 h-12 rounded-full bg-[#252525] flex items-center justify-center">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#666" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-lg">{count.toLocaleString()}</p>
                <p className="text-[#666] text-sm">watching right now</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
