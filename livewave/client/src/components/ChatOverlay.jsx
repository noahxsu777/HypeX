import React, { useRef, useEffect, useState } from 'react';

export default function ChatOverlay({ comments = [], onSendComment, isHost }) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || !onSendComment) return;
    onSendComment(text);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Comment list */}
      <div className="flex flex-col gap-1 overflow-hidden max-h-48">
        {comments.slice(-20).map((msg, idx) => (
          <div key={msg.id || idx} className="bullet-comment flex items-start gap-1.5">
            <img
              src={msg.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`}
              alt=""
              className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
              onError={e => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${msg.username}&backgroundColor=ff3366`; }}
            />
            <div className={`glass rounded-xl px-2.5 py-1 max-w-[85%] ${msg.type === 'gift' ? 'border border-yellow-500/30 bg-yellow-500/5' : ''}`}>
              <span className={`text-xs font-semibold ${msg.type === 'gift' ? 'text-yellow-400' : 'text-[#ff3366]'}`}>
                {msg.username}{' '}
              </span>
              <span className="text-white text-xs">{msg.content}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input field */}
      {onSendComment && (
        <div className={`flex items-center gap-2 transition-all ${focused ? 'opacity-100' : 'opacity-90'}`}>
          <div className={`flex-1 flex items-center glass rounded-full px-3 py-2 border transition-colors ${focused ? 'border-[#ff3366]/50' : 'border-transparent'}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Say something..."
              maxLength={100}
              className="flex-1 bg-transparent text-white text-sm placeholder-[#666] focus:outline-none min-w-0"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              input.trim()
                ? 'bg-[#ff3366] text-white active:scale-90'
                : 'bg-[#1a1a1a] text-[#444]'
            }`}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
