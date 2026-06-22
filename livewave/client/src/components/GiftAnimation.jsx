import React, { useState, useEffect } from 'react';

export default function GiftAnimation({ gift, sender, amount, onComplete, onDone }) {
  const [phase, setPhase] = useState('in'); // 'in' | 'out'

  const done = onComplete || onDone;

  useEffect(() => {
    const showTimer = setTimeout(() => setPhase('out'), 2500);
    const doneTimer = setTimeout(() => { if (done) done(); }, 3000);
    return () => { clearTimeout(showTimer); clearTimeout(doneTimer); };
  }, []);

  // Handle both prop shapes: {gift, sender, amount} and legacy {emoji, name, tier, senderUsername, giftName, quantity}
  const emoji = gift?.emoji || gift?.icon || '🎁';
  const giftName = gift?.name || gift?.giftName || 'Gift';
  const tier = gift?.tier || 'basic';
  const senderName = sender?.username || gift?.senderUsername || 'Someone';
  const qty = amount || gift?.quantity || 1;

  const sizeClass = tier === 'premium' || tier === 'epic'
    ? 'text-7xl'
    : tier === 'rare'
    ? 'text-6xl'
    : 'text-5xl';

  const isEpicOrPremium = tier === 'epic' || tier === 'premium';

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-40 ${phase === 'out' ? 'gift-fade-out' : 'gift-bounce'}`}>
      {/* Confetti particles for epic/premium gifts */}
      {isEpicOrPremium && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full float-up"
              style={{
                left: `${10 + (i * 6) % 80}%`,
                top: `${20 + (i * 7) % 60}%`,
                background: ['#ff3366', '#ffd700', '#60a5fa', '#34d399', '#a78bfa', '#fb923c'][i % 6],
                animationDelay: `${(i * 0.08).toFixed(2)}s`,
                width: `${6 + (i % 4) * 3}px`,
                height: `${6 + (i % 4) * 3}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Gift card */}
      <div className="flex flex-col items-center gap-3">
        {/* Big emoji */}
        <div className={sizeClass} style={{ filter: isEpicOrPremium ? 'drop-shadow(0 0 20px rgba(255,211,0,0.6))' : 'none' }}>
          {emoji}
        </div>

        {/* Info card */}
        <div className="glass rounded-2xl px-5 py-3 text-center max-w-xs">
          <p className="text-[#ff3366] font-bold text-sm">{senderName}</p>
          <p className="text-white text-xs mt-0.5">
            sent {qty > 1 ? `${qty}×` : ''} <span className="gradient-text font-bold">{giftName}</span> {emoji}
          </p>
        </div>

        {/* Tier badge for special gifts */}
        {isEpicOrPremium && (
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            tier === 'premium' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/40' :
            'bg-purple-500/30 text-purple-300 border border-purple-500/40'
          }`}>
            {tier === 'premium' ? '✨ Legendary' : '💫 Epic'}
          </div>
        )}
      </div>
    </div>
  );
}
