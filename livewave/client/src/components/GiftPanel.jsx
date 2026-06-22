import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const FALLBACK_CATALOG = [
  { id: 1, name: 'Rose', emoji: '🌹', coin_value: 10, tier: 'basic' },
  { id: 2, name: 'Candy', emoji: '🍭', coin_value: 20, tier: 'basic' },
  { id: 3, name: 'Cake', emoji: '🎂', coin_value: 50, tier: 'basic' },
  { id: 4, name: 'Bouquet', emoji: '💐', coin_value: 100, tier: 'rare' },
  { id: 5, name: 'Ring', emoji: '💍', coin_value: 200, tier: 'rare' },
  { id: 6, name: 'Guitar', emoji: '🎸', coin_value: 299, tier: 'rare' },
  { id: 7, name: 'Rocket', emoji: '🚀', coin_value: 500, tier: 'epic' },
  { id: 8, name: 'Lion', emoji: '🦁', coin_value: 888, tier: 'epic' },
  { id: 9, name: 'Trophy', emoji: '🏆', coin_value: 1000, tier: 'epic' },
  { id: 10, name: 'Diamond', emoji: '💎', coin_value: 2000, tier: 'premium' },
  { id: 11, name: 'Star', emoji: '🌟', coin_value: 3000, tier: 'premium' },
  { id: 12, name: 'Crown', emoji: '👑', coin_value: 5000, tier: 'premium' },
];

export default function GiftPanel({ roomId, onClose, onGiftSent }) {
  const { user, updateCoins } = useAuthStore();
  const [catalog, setCatalog] = useState([]);
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/gifts/catalog')
      .then(({ data }) => setCatalog(data.catalog || data || []))
      .catch(() => setCatalog(FALLBACK_CATALOG));
  }, []);

  const sendGift = useCallback(async () => {
    if (!selected || sending) return;
    setSending(true);
    setError('');
    try {
      const { data } = await axios.post('/api/gifts/send', {
        roomId,
        giftId: selected.id,
        quantity: qty,
      });
      updateCoins(data.coins_remaining ?? ((user?.coins || 0) - selected.coin_value * qty));
      onGiftSent(selected, qty);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send gift');
    } finally {
      setSending(false);
    }
  }, [selected, qty, roomId, sending, user, updateCoins, onGiftSent]);

  const totalCost = selected ? selected.coin_value * qty : 0;
  const canAfford = (user?.coins || 0) >= totalCost;

  const TIER_COLORS = {
    basic: null,
    rare: 'bg-blue-500/20 text-blue-300',
    epic: 'bg-purple-500/20 text-purple-300',
    premium: 'bg-yellow-500/20 text-yellow-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div
        className="bg-[#111] rounded-t-2xl slide-up max-h-[72vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#222]">
          <h3 className="text-white font-bold text-base">Send a Gift 🎁</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-full px-3 py-1">
              <span className="text-sm">🪙</span>
              <span className="coin-color text-sm font-bold">{(user?.coins || 0).toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-[#1a1a1a] text-[#aaa] hover:text-white">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Gift grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {catalog.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin w-6 h-6 text-[#ff3366]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2.5">
              {catalog.map(gift => (
                <button
                  key={gift.id}
                  onClick={() => { setSelected(gift); setQty(1); setError(''); }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                    selected?.id === gift.id
                      ? 'border-[#ff3366] bg-[#ff3366]/10 shadow-sm shadow-[#ff3366]/20'
                      : 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#ff3366]/30'
                  }`}
                >
                  <span className="text-3xl">{gift.emoji}</span>
                  <span className="text-white text-[10px] font-semibold truncate w-full text-center">{gift.name}</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-yellow-400 text-[10px]">🪙</span>
                    <span className="coin-color text-[10px] font-bold">{gift.coin_value}</span>
                  </div>
                  {gift.tier && gift.tier !== 'basic' && TIER_COLORS[gift.tier] && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${TIER_COLORS[gift.tier]}`}>
                      {gift.tier}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Send bar */}
        <div className="px-4 pb-safe pb-6 pt-3 border-t border-[#222]">
          {error && (
            <p className="text-red-400 text-xs text-center mb-2 bg-red-400/10 rounded-lg py-1.5 px-3">{error}</p>
          )}

          {selected ? (
            <div className="flex items-center gap-3">
              {/* Qty selector */}
              <div className="flex items-center bg-[#1a1a1a] rounded-xl p-1 gap-1">
                {[1, 5, 10, 99].map(n => (
                  <button
                    key={n}
                    onClick={() => setQty(n)}
                    className={`w-10 h-9 rounded-lg text-xs font-bold transition-all ${
                      qty === n
                        ? 'bg-[#ff3366] text-white shadow-sm'
                        : 'text-[#666] hover:text-white'
                    }`}
                  >
                    {n === 99 ? 'MAX' : `×${n}`}
                  </button>
                ))}
              </div>

              {/* Send button */}
              <button
                onClick={sendGift}
                disabled={sending || !canAfford}
                className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all ${
                  canAfford
                    ? 'bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white shadow-lg shadow-[#ff3366]/25 active:scale-95'
                    : 'bg-[#2a2a2a] text-[#555] cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <svg className="animate-spin w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : !canAfford ? (
                  'Not enough coins'
                ) : (
                  `Send ${selected.emoji} ×${qty}  🪙${totalCost.toLocaleString()}`
                )}
              </button>
            </div>
          ) : (
            <p className="text-center text-[#555] text-sm py-2">Select a gift to send</p>
          )}
        </div>
      </div>
    </div>
  );
}
