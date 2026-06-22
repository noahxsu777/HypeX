import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import BottomNav from '../components/BottomNav';

const COIN_PACKAGES = [
  { id: 1, coins: 100, price: 0.99, bonus: 0, badge: null },
  { id: 2, coins: 500, price: 4.99, bonus: 50, badge: 'Popular' },
  { id: 3, coins: 1000, price: 9.99, bonus: 150, badge: 'Best Value' },
  { id: 4, coins: 2500, price: 24.99, bonus: 500, badge: null },
  { id: 5, coins: 5000, price: 49.99, bonus: 1200, badge: 'Pro' },
  { id: 6, coins: 10000, price: 99.99, bonus: 3000, badge: 'VIP' },
];

const GIFT_CATALOG = [
  { emoji: '🌹', name: 'Rose', coins: 10, category: 'Basic' },
  { emoji: '🍭', name: 'Candy', coins: 20, category: 'Basic' },
  { emoji: '🎂', name: 'Cake', coins: 50, category: 'Basic' },
  { emoji: '💐', name: 'Bouquet', coins: 100, category: 'Special' },
  { emoji: '💍', name: 'Ring', coins: 200, category: 'Special' },
  { emoji: '🎸', name: 'Guitar', coins: 299, category: 'Special' },
  { emoji: '🚀', name: 'Rocket', coins: 500, category: 'Premium' },
  { emoji: '🦁', name: 'Lion', coins: 888, category: 'Premium' },
  { emoji: '🏆', name: 'Trophy', coins: 1000, category: 'Premium' },
  { emoji: '💎', name: 'Diamond', coins: 2000, category: 'Legendary' },
  { emoji: '🌟', name: 'Star', coins: 3000, category: 'Legendary' },
  { emoji: '👑', name: 'Crown', coins: 5000, category: 'Legendary' },
];

const CATEGORY_COLORS = {
  Basic: 'text-gray-400',
  Special: 'text-blue-400',
  Premium: 'text-purple-400',
  Legendary: 'text-yellow-400',
};

export default function GiftStore() {
  const navigate = useNavigate();
  const { user, updateCoins } = useAuthStore();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState('coins');

  const handlePurchase = async (pkg) => {
    setPurchasing(true);
    setSelectedPackage(pkg.id);
    // TODO: integrate Stripe
    await new Promise(r => setTimeout(r, 1000));
    alert(`Payment integration coming soon!\nYou selected: ${pkg.coins + pkg.bonus} coins for $${pkg.price}`);
    setPurchasing(false);
    setSelectedPackage(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#1a1a1a] safe-top">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-[#1a1a1a] flex items-center justify-center text-[#aaa]">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-white font-bold text-lg flex-1">Gift Store</h1>
          {/* Balances */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-full px-3 py-1.5">
              <span className="text-sm">🪙</span>
              <span className="coin-color text-xs font-bold">{(user?.coins || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-full px-3 py-1.5">
              <span className="text-sm">💎</span>
              <span className="diamond-color text-xs font-bold">{(user?.diamonds || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1a1a1a]">
          {[
            { id: 'coins', label: '🪙 Buy Coins' },
            { id: 'gifts', label: '🎁 Gift Catalog' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'text-[#ff3366] border-b-2 border-[#ff3366]'
                  : 'text-[#666]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5">
        {activeTab === 'coins' ? (
          <>
            {/* Promo banner */}
            <div className="mb-5 rounded-2xl overflow-hidden bg-gradient-to-r from-[#ff3366] to-[#ff6b35] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs mb-0.5">First purchase</p>
                  <h3 className="text-white font-bold text-lg">Double Coins!</h3>
                  <p className="text-white/70 text-xs mt-0.5">Get 2x on your first purchase</p>
                </div>
                <span className="text-5xl">🎉</span>
              </div>
            </div>

            {/* Coin packages */}
            <h2 className="text-white font-bold mb-3">Choose a Package</h2>
            <div className="grid grid-cols-2 gap-3">
              {COIN_PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => handlePurchase(pkg)}
                  disabled={purchasing && selectedPackage === pkg.id}
                  className={`relative bg-[#1a1a1a] border rounded-2xl p-4 text-left transition-all active:scale-95 ${
                    pkg.badge === 'Best Value'
                      ? 'border-[#ff3366]/60 ring-1 ring-[#ff3366]/30'
                      : 'border-[#2a2a2a] hover:border-[#ff3366]/40'
                  }`}
                >
                  {pkg.badge && (
                    <div className={`absolute -top-2 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pkg.badge === 'Best Value' ? 'bg-[#ff3366] text-white' :
                      pkg.badge === 'Popular' ? 'bg-blue-500 text-white' :
                      pkg.badge === 'VIP' ? 'bg-yellow-500 text-black' :
                      'bg-purple-500 text-white'
                    }`}>
                      {pkg.badge}
                    </div>
                  )}
                  <div className="text-2xl mb-2">🪙</div>
                  <div className="text-white font-bold text-lg">
                    {pkg.coins.toLocaleString()}
                    {pkg.bonus > 0 && (
                      <span className="text-green-400 text-xs font-normal ml-1">+{pkg.bonus}</span>
                    )}
                  </div>
                  <div className="text-[#aaa] text-xs mb-3">
                    {pkg.bonus > 0 ? `${(pkg.coins + pkg.bonus).toLocaleString()} total` : 'coins'}
                  </div>
                  <div className="w-full py-2 rounded-xl bg-gradient-to-r from-[#ff3366] to-[#ff6b35] text-white text-sm font-bold text-center">
                    {purchasing && selectedPackage === pkg.id ? (
                      <svg className="animate-spin w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                    ) : `$${pkg.price}`}
                  </div>
                </button>
              ))}
            </div>

            {/* Info */}
            <div className="mt-5 p-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
              <h3 className="text-white text-sm font-semibold mb-2">How coins work</h3>
              <ul className="space-y-1.5 text-[#666] text-xs">
                <li className="flex items-start gap-2">
                  <span className="text-[#ff3366] mt-0.5">•</span>
                  Coins are used to send gifts to your favorite streamers
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff3366] mt-0.5">•</span>
                  Gifts convert to diamonds for the streamer
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#ff3366] mt-0.5">•</span>
                  Coins are non-refundable once purchased
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-white font-bold mb-4">All Gifts</h2>
            {['Basic', 'Special', 'Premium', 'Legendary'].map(cat => {
              const catGifts = GIFT_CATALOG.filter(g => g.category === cat);
              return (
                <div key={cat} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className={`text-sm font-bold ${CATEGORY_COLORS[cat]}`}>{cat}</h3>
                    <div className="flex-1 h-px bg-[#1a1a1a]" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {catGifts.map(gift => (
                      <div key={gift.name} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-center">
                        <div className="text-3xl mb-1">{gift.emoji}</div>
                        <div className="text-white text-xs font-semibold">{gift.name}</div>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-yellow-400 text-xs">🪙</span>
                          <span className="coin-color text-xs font-bold">{gift.coins}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
