import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const NAV_ITEMS = [
  {
    path: '/',
    label: 'Home',
    icon: (active) => (
      <svg width="22" height="22" fill={active ? '#ff3366' : 'none'} viewBox="0 0 24 24" stroke={active ? '#ff3366' : '#666'} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    path: '/leaderboard',
    label: 'Top',
    icon: (active) => (
      <svg width="22" height="22" fill={active ? '#ff3366' : 'none'} viewBox="0 0 24 24" stroke={active ? '#ff3366' : '#666'} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
      </svg>
    ),
  },
  {
    path: '/gift-store',
    label: 'Store',
    icon: (active) => (
      <svg width="22" height="22" fill={active ? '#ff3366' : 'none'} viewBox="0 0 24 24" stroke={active ? '#ff3366' : '#666'} strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isProfileActive = location.pathname.startsWith('/profile');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a] safe-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home, Leaderboard, Store */}
        {NAV_ITEMS.slice(0, 2).map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
          >
            {item.icon(isActive(item.path))}
            <span className={`text-[10px] font-medium ${isActive(item.path) ? 'text-[#ff3366]' : 'text-[#555]'}`}>
              {item.label}
            </span>
          </button>
        ))}

        {/* Center Go Live button */}
        <button
          onClick={() => navigate('/go-live')}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ff3366] to-[#ff6b35] flex items-center justify-center shadow-lg shadow-[#ff3366]/30 -mt-4">
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
              <circle cx="12" cy="12" r="10" fill="none" stroke="white" strokeWidth="2" opacity="0.5" />
            </svg>
          </div>
          <span className="text-[10px] font-medium text-[#ff3366]">Live</span>
        </button>

        {/* Store */}
        <button
          onClick={() => navigate('/gift-store')}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
        >
          {NAV_ITEMS[2].icon(isActive('/gift-store'))}
          <span className={`text-[10px] font-medium ${isActive('/gift-store') ? 'text-[#ff3366]' : 'text-[#555]'}`}>
            Store
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate(`/profile/${user?.id}`)}
          className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full"
        >
          <div className={`w-7 h-7 rounded-full overflow-hidden border-2 ${isProfileActive ? 'border-[#ff3366]' : 'border-[#333]'}`}>
            <img
              src={user?.avatar || user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              alt={user?.username}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}&backgroundColor=ff3366`; }}
            />
          </div>
          <span className={`text-[10px] font-medium ${isProfileActive ? 'text-[#ff3366]' : 'text-[#555]'}`}>
            Me
          </span>
        </button>
      </div>
    </nav>
  );
}
