import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import useRoomStore from '../store/roomStore';
import useSocket from '../hooks/useSocket';
import useZegoCloud from '../hooks/useZegoCloud';
import ChatOverlay from '../components/ChatOverlay';
import GiftPanel from '../components/GiftPanel';
import GiftAnimation from '../components/GiftAnimation';
import PKBattleView from '../components/PKBattleView';

export default function LiveRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentRoom, setCurrentRoom, pkSession, setPkSession, updatePkScore, endPk } = useRoomStore();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftAnimation, setGiftAnimation] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [floatingHearts, setFloatingHearts] = useState([]);

  const videoContainerRef = useRef(null);
  const { startLiveStream, leaveRoom } = useZegoCloud();
  const zegoStarted = useRef(false);

  // Fetch room details
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await axios.get(`/api/rooms/${roomId}`);
        setRoom(data);
        setCurrentRoom(data);
        setViewerCount(data.viewer_count || 0);
        if (data.pk_session) setPkSession(data.pk_session);
      } catch (err) {
        console.error('Failed to fetch room:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomId]);

  // Start ZEGO stream as audience
  useEffect(() => {
    if (!room || !videoContainerRef.current || zegoStarted.current) return;
    zegoStarted.current = true;
    startLiveStream(videoContainerRef.current, roomId, String(user?.id), user?.username, 'Audience');
    return () => leaveRoom();
  }, [room]);

  // Socket events
  const socketHandlers = {
    'room:viewer_joined': ({ count }) => setViewerCount(count),
    'room:viewer_left': ({ count }) => setViewerCount(count),
    'room:new_comment': (comment) => {
      setComments(prev => [...prev.slice(-19), comment]);
    },
    'room:gift_received': ({ gift, sender, amount }) => {
      setGiftAnimation({ gift, sender, amount });
      setComments(prev => [...prev.slice(-19), {
        id: Date.now(),
        username: sender?.username || 'Someone',
        content: `sent ${amount}x ${gift?.name || 'gift'} ${gift?.emoji || '🎁'}`,
        type: 'gift',
      }]);
    },
    'pk:score_update': ({ score_a, score_b }) => updatePkScore(score_a, score_b),
    'pk:ended': ({ winner_room_id }) => endPk(winner_room_id),
    'pk:accepted': (pk) => setPkSession(pk),
  };

  const { emit } = useSocket(roomId, socketHandlers);

  const handleSendComment = (text) => {
    if (!text.trim()) return;
    emit('room:comment', { roomId, content: text });
    setComments(prev => [...prev.slice(-19), {
      id: Date.now(),
      username: user?.username,
      content: text,
      type: 'comment',
    }]);
  };

  const handleGiftSent = (gift, qty) => {
    setGiftAnimation({ gift, sender: user, amount: qty });
    setShowGiftPanel(false);
  };

  const handleLike = () => {
    setLiked(true);
    setLikeCount(c => c + 1);
    emit('room:like', { roomId });
    // Floating heart
    const id = Date.now();
    setFloatingHearts(prev => [...prev, { id, x: Math.random() * 30 - 15 }]);
    setTimeout(() => setFloatingHearts(prev => prev.filter(h => h.id !== id)), 1500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: room?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10 text-[#ff3366]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-[#aaa]">Joining stream...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* ZEGO Video Container */}
      <div ref={videoContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Gradient overlays for UI readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 safe-top px-4 pt-3 pb-2 flex items-start justify-between">
        {/* Host info */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/profile/${room?.host_id}`)}
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#ff3366] flex-shrink-0"
          >
            <img
              src={room?.host_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room?.host_username}`}
              alt={room?.host_username}
              className="w-full h-full object-cover"
              onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${room?.host_username}&backgroundColor=ff3366`; }}
            />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">{room?.host_username}</span>
              <span className="live-badge bg-[#ff3366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">LIVE</span>
            </div>
            <div className="flex items-center gap-1 text-[#ccc] text-xs">
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
              </svg>
              <span>{viewerCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* PK Battle View */}
      {pkSession && pkSession.status !== 'ended' && (
        <PKBattleView pkSession={pkSession} currentRoomId={roomId} />
      )}

      {/* Gift Animation */}
      {giftAnimation && (
        <GiftAnimation
          gift={giftAnimation.gift}
          sender={giftAnimation.sender}
          amount={giftAnimation.amount}
          onComplete={() => setGiftAnimation(null)}
        />
      )}

      {/* Bottom area */}
      <div className="absolute bottom-0 left-0 right-0 z-20 safe-bottom px-4 pb-4">
        {/* Chat overlay */}
        <div className="mb-3">
          <ChatOverlay comments={comments} onSendComment={handleSendComment} />
        </div>
      </div>

      {/* Right side action buttons */}
      <div className="absolute right-4 bottom-32 z-20 flex flex-col items-center gap-5">
        {/* Like button */}
        <div className="relative flex flex-col items-center">
          {/* Floating hearts */}
          {floatingHearts.map(h => (
            <div
              key={h.id}
              className="absolute bottom-8 text-2xl pointer-events-none float-up"
              style={{ left: `calc(50% + ${h.x}px)`, transform: 'translateX(-50%)' }}
            >
              ❤️
            </div>
          ))}
          <button
            onClick={handleLike}
            className={`flex flex-col items-center gap-1 transition-transform active:scale-90 ${liked ? 'scale-110' : ''}`}
          >
            <div className={`w-12 h-12 rounded-full bg-black/50 flex items-center justify-center ${liked ? 'text-[#ff3366]' : 'text-white'}`}>
              <svg width="24" height="24" fill={liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-white text-xs font-medium">{likeCount > 0 ? likeCount : ''}</span>
          </button>
        </div>

        {/* Gift button */}
        <button
          onClick={() => setShowGiftPanel(true)}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-2xl">
            🎁
          </div>
          <span className="text-white text-xs font-medium">Gift</span>
        </button>

        {/* Share button */}
        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1"
        >
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </div>
          <span className="text-white text-xs font-medium">Share</span>
        </button>
      </div>

      {/* Gift Panel */}
      {showGiftPanel && (
        <GiftPanel
          roomId={roomId}
          onClose={() => setShowGiftPanel(false)}
          onGiftSent={handleGiftSent}
        />
      )}
    </div>
  );
}
