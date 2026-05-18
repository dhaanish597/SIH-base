'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../../providers';
import { ShoppingBag, Coins, Check, Sparkles, Lock, Loader2, X, ShoppingCart } from 'lucide-react';

type ShopItem = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  priceCoins: number;
  unlockLevel: number | null;
  imageUrl: string | null;
  owned: boolean;
  equipped: boolean;
};

export default function ShopPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch('/api/shop', { credentials: 'include' });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const buy = async (item: ShopItem) => {
    if (busy) return;
    setBusy(item.id);
    const r = await fetch('/api/shop/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ itemId: item.id }),
    });
    if (r.ok) {
      showToast(`Purchased "${item.name}"!`, true);
      await load();
      // refresh() removed — user stats update on next full reload
    } else {
      const err = await r.json().catch(() => ({}));
      showToast(err.error || 'Purchase failed', false);
    }
    setBusy(null);
  };

  const equip = async (item: ShopItem) => {
    if (busy) return;
    setBusy(item.id);
    const r = await fetch('/api/shop/equip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ itemId: item.id }),
    });
    if (r.ok) {
      showToast(`Equipped "${item.name}"!`, true);
      await load();
    } else {
      showToast('Equip failed', false);
    }
    setBusy(null);
  };

  const categories = [...new Set(items.map((i) => i.category))].sort();
  const filteredItems = activeCategory ? items.filter((i) => i.category === activeCategory) : items;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium shadow-elevated animate-slide-down
            ${toast.ok ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
          role="status"
          aria-live="polite"
        >
          {toast.ok ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            Avatar Shop
          </h1>
          <p className="text-sm text-gray-400 mt-1">Spend your hard-earned coins on avatar items</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-2xl text-sm font-bold tabular-nums">
          <Coins className="w-4 h-4" />
          {user?.totalCoins ?? 0} coins
        </div>
      </header>

      {/* Category filter tabs */}
      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={`badge whitespace-nowrap transition-all duration-200 ${!activeCategory ? 'badge-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`badge whitespace-nowrap capitalize transition-all duration-200 ${activeCategory === cat ? 'badge-primary' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Items grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-56" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No items available in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 stagger-children">
          {filteredItems.map((item) => {
            const locked = item.unlockLevel && (user?.level ?? 1) < item.unlockLevel;
            const canAfford = (user?.totalCoins ?? 0) >= item.priceCoins;

            return (
              <div
                key={item.id}
                className={`card overflow-hidden flex flex-col group ${locked ? 'opacity-50' : ''}`}
              >
                {/* Image area */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-20 w-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                  ) : (
                    <Sparkles className="w-10 h-10 text-indigo-300 group-hover:scale-110 transition-transform duration-300" />
                  )}

                  {/* Status overlays */}
                  {locked && (
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="flex items-center gap-1 text-xs font-medium text-white bg-black/40 px-2.5 py-1 rounded-full">
                        <Lock className="w-3 h-3" /> Lv.{item.unlockLevel}
                      </div>
                    </div>
                  )}
                  {item.equipped && (
                    <div className="absolute top-2 right-2">
                      <span className="badge badge-success text-[10px]"><Check className="w-2.5 h-2.5" /> Equipped</span>
                    </div>
                  )}

                  {/* Price tag */}
                  {!item.owned && !locked && (
                    <div className="absolute top-2 left-2">
                      <span className={`badge text-[10px] ${canAfford ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        <Coins className="w-2.5 h-2.5" /> {item.priceCoins}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-3 flex-1 flex flex-col">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  {item.description && (
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 flex-1">{item.description}</p>
                  )}

                  {/* Action */}
                  <div className="mt-2.5">
                    {locked ? (
                      <p className="text-[10px] text-red-400 font-medium">Unlock at Level {item.unlockLevel}</p>
                    ) : item.equipped ? null : item.owned ? (
                      <button
                        onClick={() => equip(item)}
                        disabled={!!busy}
                        className="w-full btn-secondary text-xs py-1.5"
                      >
                        {busy === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Equip'}
                      </button>
                    ) : (
                      <button
                        onClick={() => buy(item)}
                        disabled={!!busy || !canAfford}
                        className="w-full btn-primary text-xs py-1.5"
                      >
                        {busy === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : (
                          <>
                            <Coins className="w-3 h-3" />
                            Buy · {item.priceCoins}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
