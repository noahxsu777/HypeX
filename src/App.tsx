import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';

import BottomNav from './components/layout/BottomNav';
import HomePage from './pages/HomePage';
import ReelsPage from './pages/ReelsPage';
import ExplorePage from './pages/ExplorePage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import CreatePage from './pages/CreatePage';
import SettingsPage from './pages/settings/SettingsPage';
import PrivacyPage from './pages/settings/PrivacyPage';
import SecurityPage from './pages/settings/SecurityPage';
import NotificationsSettingsPage from './pages/settings/NotificationsSettingsPage';
import EditProfilePage from './pages/settings/EditProfilePage';
import BlockedUsersPage from './pages/settings/BlockedUsersPage';
import SplashPage from './pages/SplashPage';

function AppContent() {
  const location = useLocation();
  const { darkMode } = useStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const hideNav = location.pathname === '/create';

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<SplashPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/reels" element={<ReelsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/privacy" element={<PrivacyPage />} />
        <Route path="/settings/security" element={<SecurityPage />} />
        <Route path="/settings/notifications" element={<NotificationsSettingsPage />} />
        <Route path="/settings/edit-profile" element={<EditProfilePage />} />
        <Route path="/settings/blocked" element={<BlockedUsersPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
      {!hideNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
