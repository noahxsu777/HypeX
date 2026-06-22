import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useRoomStore from '../store/roomStore';
import useSocket from '../hooks/useSocket';
import useZegoCloud from '../hooks/useZegoCloud';
import ChatOverlay from '../components/ChatOverlay';
import GiftAnimation from '../components/GiftAnimation';
import PKInviteModal from '../components/PKInviteModal';
import PKBattleView from '../components/PKBattleView';

const CATEGORIES = ['Entertainment', 'Music', 'Gaming', 'Dance', 'Talk'];

export default function GoLive() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { pkSession, setPkSession, updatePkScore, endPk, isStreaming, setStreaming, reset } = useRoomStore();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [isLive, setIsLive] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [giftTotal, setGiftTotal] = useState(0);
  const [comments, setComments] = useState([]);
  const [giftAnimation, setGiftAnimation] = useState(null);
  const [showPKModal, setShowPKModal] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [starting, setStarting] = useState(false);
  const [pkInvite, setPkInvite] = useState(null);

  const videoContainerRef = useRef(null);
  const { startLiveStream, leaveRoom } = useZegoCloud();
  const zegoRef = useRef(null);

  // Socket handlers
  const socketHandlers = {
    'room:viewer_joined': ({ count }) => setViewerCount(count),
    'room:viewer_left': ({ count }) => setViewerCount(count),
    'room:new_comment': (comment) => setComments(prev => [...prev.slice(-19), comment]),
    'room:gift_received': ({ gift, sender, amount, diamonds }) => {
      setGiftAnimation({ gift, sender, amount });
      setGiftTotal(t => t + (diamonds || 0));
      setComments(prev => [...prev.slice(-19), {
        id: Date.now(),
        username: sender?.username || 'Someone',
        content: `sent ${amount}x ${gift?.name || 'gift'} ${gift?.emoji || '🎁'}`,
        type: 'gift',
      }]);
    },
    'pk:invited': (invite) => setPkInvite(invite),
    'pk:accepted': (pk) => { setPkSession(pk); setPkInvite(null); },
    'pk:rejected': () => { alert('PK invite was declined'); setPkInvite(null); },
    'pk:score_update': ({ score_a, score_b }) => updatePkScore(score_a, score_b),
    'pk:ended': ({ winner_room_id }) => endPk(winner_room_id),
  };

  const { emit } = useSocket(roomId, socketHandlers);

  const handleStartStream = async () => {
    if (!title.trim()) return;
    setStarting(true);
    try {
      const { data } = await axios.post('/api/rooms/start', { title, category });
      setRoomId(data.room.id);
      setIsLive(true);
      setStreaming(true);

      // Start ZEGO after brief delay for DOM
      setTimeout(async () => {
        if (videoContainerRef.current) {
          const zp = await startLiveStream(videoContainerRef.current, String(data.room.id), String(user?.id), user?.username, 'Host');
          zegoRef.current = zp;
        }
      }, 200);
    } catch (err) {
      console.error('Failed to start stream:', err);
      alert('Failed to start stream. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const handleEndStream = async () => {
    if (!window.confirm('End your live stream?')) return;
    try {
      if (roomId) await axios.post(`/api/rooms/${roomId}/end`);
    } catch {}
    leaveRoom();
    setStreaming(false);
    reset();
    navigate('/');
  };

  const handleSendComment = (text) => {
    if (!text.trim() || !roomId) return;
    emit('room:comment', { roomId, content: text });
    setComments(prev => [...prev.slice(-19), {
      id: Date.now(),
      username: user?.username,
      content: text,
      type: 'comment',
    }]);
  };

  const handlePKInviteResponse = async (accept) => {
    if (!pkInvite) return;
    try {
      await axios.post(`/api/pk/${pkInvite.pk_id}/${accept ? 'accept' : 'reject'}`);
    } catch {}
    if (!accept) setPkInvite(null);
  };

  useEffect(() => {
    return () => {
      leaveRoom();
      setStreaming(false);
    };
  }, []);

  // PRE-LIVE setup screen
  if (!isLive) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 safe-top border-b border-[#1a1a1a]">
          <button onClick={() => navigate('/')} className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#aaa]">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-lg">Go Live</h1>
        </div>

        {/* Camera preview placeholder */}
        <div className="relative flex-1 bg-[#111] flex items-center justify-center overflow-hidden" style={{ maxHeight: '40vh' }}>
          <div className="flex flex-col items-center gap-3 text-[#555]">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
            <span className="text-sm">Camera preview</span>
          </div>
          {/* Avatar overlay */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
              className="w-10 h-10 rounded-full border-2 border-[#ff3366]"
              alt={user?.username}
            />
            <span className="text-white text-sm font-semibold">{user?.username}</span>
          </div>
        </div>

        {/* Setup form */}
        <div className="flex-1 px-4 py-6 space-y-5 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-2 uppercase tracking-wide">Stream Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's your stream about?"
              maxLength={60}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3.5 text-white placeholder-[#555] focus:outline-none focus:border-[#ff3366] focus:ring-1 focus:ring-[#ff3366]/40 transition-all"
            />
            <div className="text-right text-[#555] text-xs mt-1">{title.length}/60</div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[#aaa] text-xs font-medium mb-2 uppercase tracking-wide">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-[#ff3366] text-white'
                      : 'bg-[#1a1a1a] text-[#aaa] border border-[#2a2a2a] hover:border-[#ff3366]/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
            <h3 className="text-white text-sm font-semibold mb-2">Tips for a great stream</h3>
            <ul className="space-y-1.5">
              {['Good lighting makes a big difference', 'Interact with your viewers', 'Choose a catchy title'].map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-[#aaa] text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3366] flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Start button */}
          <button
            onClick={handleStartStream}
            disabled={!title.trim() || starting}
            className="w-full py-4 rounded-2xl font-bold text-white text-lg bg-gradient-to-r from-[#ff3366] to-[#ff6b35] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#ff3366]/30"
          >
            {starting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Starting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-white live-badge" />
                Start Streaming
              </span>
            )}
          </button>
        </div>
      </div>
    );
  }

  // LIVE view
  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ZEGO video container */}
      <div ref={videoContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />

      {/* PK invite notification */}
      {pkInvite && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 glass rounded-2xl p-6 w-80 text-center slide-up">
          <div className="text-4xl mb-3">⚔️</div>
          <h3 className="text-white font-bold text-lg mb-1">PK Battle Invite!</h3>
          <p className="text-[#aaa] text-sm mb-5">
            <span className="text-[#ff3366] font-semibold">{pkInvite.challenger_username}</span> wants to battle you!
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handlePKInviteResponse(false)}
              className="flex-1 py-3 rounded-xl bg-[#1a1a1a] text-[#aaa] font-semibold border border-[#2a2a2a]"
            >
              Decline
            </button>
            <button
              onClick={() => handlePKInviteResponse(true)}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white font-bold"
            >
              Accept ⚔️
            </button>
          </div>
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top px-4 pt-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* LIVE badge */}
          <div className="flex items-center gap-1.5 bg-[#ff3366] rounded-lg px-3 py-1.5 live-badge">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span className="text-white text-xs font-bold">LIVE</span>
          </div>
          {/* Viewer count */}
          <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5">
            <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
              <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
            </svg>
            <span className="text-white text-xs font-semibold">{viewerCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Gift total */}
          <div className="flex items-center gap-1 glass rounded-lg px-3 py-1.5">
            <span className="text-sm">💎</span>
            <span className="text-blue-300 text-xs font-bold">{giftTotal.toLocaleString()}</span>
          </div>
          {/* PK button */}
          <button
            onClick={() => setShowPKModal(true)}
            className="w-9 h-9 rounded-full glass flex items-center justify-center text-white hover:bg-white/10"
          >
            ⚔️
          </button>
          {/* End stream */}
          <button
            onClick={handleEndStream}
            className="flex items-center gap-1.5 bg-[#ff3366]/90 rounded-lg px-3 py-1.5"
          >
            <svg width="14" height="14" fill="white" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            <span className="text-white text-xs font-bold">End</span>
          </button>
        </div>
      </div>

      {/* Camera controls */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setMicOn(m => !m)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${micOn ? 'glass' : 'bg-[#ff3366]'}`}
        >
          {micOn ? (
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => setCamOn(c => !c)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${camOn ? 'glass' : 'bg-[#ff3366]'}`}
        >
          {camOn ? (
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
          ) : (
            <svg width="18" height="18" fill="white" viewBox="0 0 24 24">
              <path d="M21 6.5l-4-4-15 15 1.41 1.41 2.13-2.13A4.5 4.5 0 009 18h6c1.21 0 2.3-.47 3.12-1.24L21 19.5v-13z" opacity=".3" />
              <path d="M21 3.12L18.88 1 1 18.88 2.12 20 4.24 17.88A4.46 4.46 0 003 15V9c0-1.1.4-2.1 1.05-2.87L21 22.88 22.88 21 21 19.12V3.12zM15 9v4.12L9.88 8H15c0-1.1.9-2 2-2V3h-1.5L14 4.5v4.65L9 4.15V3H7.5L6 4.5V9H3v1h3v4c0 .55.1 1.08.26 1.58L21 3.12V3h-1.5L18 4.5V9h-3z" />
            </svg>
          )}
        </button>
        {/* Flip camera */}
        <button className="w-10 h-10 rounded-full glass flex items-center justify-center text-white">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* PK Battle overlay */}
      {pkSession && pkSession.status !== 'ended' && (
        <PKBattleView pkSession={pkSession} currentRoomId={roomId} isHost />
      )}

      {/* Gift animation */}
      {giftAnimation && (
        <GiftAnimation
          gift={giftAnimation.gift}
          sender={giftAnimation.sender}
          amount={giftAnimation.amount}
          onComplete={() => setGiftAnimation(null)}
        />
      )}

      {/* Bottom: chat overlay */}
      <div className="absolute bottom-4 left-0 right-0 z-20 px-4 safe-bottom">
        <ChatOverlay comments={comments} onSendComment={handleSendComment} isHost />
      </div>

      {/* PK Invite Modal */}
      {showPKModal && (
        <PKInviteModal
          roomId={roomId}
          onClose={() => setShowPKModal(false)}
          emit={emit}
        />
      )}
    </div>
  );
}
