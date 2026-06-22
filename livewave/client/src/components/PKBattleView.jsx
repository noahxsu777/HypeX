import React, { useEffect, useState } from 'react';

const PK_DURATION = 300; // 5 minutes default

export default function PKBattleView({ pkSession, currentRoomId, isHost }) {
  const [timeLeft, setTimeLeft] = useState(PK_DURATION);
  const [showWinner, setShowWinner] = useState(false);

  const total = (pkSession?.score_a || 0) + (pkSession?.score_b || 0);
  const pctA = total === 0 ? 50 : Math.round(((pkSession?.score_a || 0) / total) * 100);
  const pctB = 100 - pctA;

  // Countdown timer
  useEffect(() => {
    if (pkSession?.status === 'ended') {
      setShowWinner(true);
      return;
    }

    // Calculate remaining from server start time if available
    if (pkSession?.started_at) {
      const elapsed = Math.floor((Date.now() - new Date(pkSession.started_at).getTime()) / 1000);
      const remaining = Math.max(0, PK_DURATION - elapsed);
      setTimeLeft(remaining);
    }

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pkSession?.status, pkSession?.started_at]);

  // Watch for ended status
  useEffect(() => {
    if (pkSession?.status === 'ended') {
      setShowWinner(true);
    }
  }, [pkSession?.status]);

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');

  const winnerIsA = pkSession?.winner_room_id && pkSession.winner_room_id === pkSession?.room_a_id;
  const hostAName = pkSession?.host_a_username || 'Host A';
  const hostBName = pkSession?.host_b_username || 'Host B';

  return (
    <div className="absolute inset-x-0 top-16 z-20 px-3 pointer-events-none">
      {/* PK Score Bar */}
      <div className="glass rounded-2xl p-3">
        {/* Host names + VS */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-white text-xs font-bold truncate max-w-[38%]">{hostAName}</span>
          <div className="flex items-center gap-1.5 bg-[#ff3366]/20 border border-[#ff3366]/40 rounded-full px-2 py-0.5">
            <span className="text-white text-[10px] font-black">⚔️</span>
            <span className="text-[#ff3366] text-[10px] font-black">PK</span>
          </div>
          <span className="text-white text-xs font-bold truncate max-w-[38%] text-right">{hostBName}</span>
        </div>

        {/* Score bars */}
        <div className="flex h-7 rounded-full overflow-hidden relative">
          {/* Team A bar */}
          <div
            className="pk-bar h-full bg-gradient-to-r from-[#ff3366] to-[#ff6b35] flex items-center justify-end pr-2 transition-all duration-500"
            style={{ width: `${pctA}%` }}
          >
            {pctA > 15 && (
              <span className="text-white text-[10px] font-bold">{pctA}%</span>
            )}
          </div>
          {/* Team B bar */}
          <div
            className="pk-bar h-full bg-gradient-to-l from-[#3b82f6] to-[#6366f1] flex items-center justify-start pl-2 transition-all duration-500"
            style={{ width: `${pctB}%` }}
          >
            {pctB > 15 && (
              <span className="text-white text-[10px] font-bold">{pctB}%</span>
            )}
          </div>
          {/* Center divider */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/40 z-10" />
        </div>

        {/* Scores + timer */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <span className="text-[#ff3366] text-sm font-black">{(pkSession?.score_a || 0).toLocaleString()}</span>
            <span className="text-[#ff3366] text-xs">💎</span>
          </div>

          {/* Countdown */}
          <div className="bg-black/50 rounded-full px-3 py-1">
            <span className={`text-sm font-mono font-bold ${timeLeft <= 30 ? 'text-[#ff3366]' : 'text-white'}`}>
              {mins}:{secs}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-blue-400 text-xs">💎</span>
            <span className="text-blue-400 text-sm font-black">{(pkSession?.score_b || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Winner banner */}
      {showWinner && pkSession?.winner_room_id && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 pointer-events-auto">
          <div className="winner-pop flex flex-col items-center gap-3 p-8 rounded-3xl glass text-center">
            <span className="text-6xl">🏆</span>
            <div>
              <p className="text-white/60 text-sm">Winner</p>
              <p className="text-white font-black text-2xl mt-1">
                {winnerIsA ? hostAName : hostBName}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-center">
                <div className="text-[#ff3366] font-bold text-lg">{(pkSession?.score_a || 0).toLocaleString()}</div>
                <div className="text-[#666] text-xs">{hostAName}</div>
              </div>
              <div className="text-[#555] text-xl">vs</div>
              <div className="text-center">
                <div className="text-blue-400 font-bold text-lg">{(pkSession?.score_b || 0).toLocaleString()}</div>
                <div className="text-[#666] text-xs">{hostBName}</div>
              </div>
            </div>
            <p className="text-[#aaa] text-sm">PK Battle ended</p>
          </div>
        </div>
      )}
    </div>
  );
}
