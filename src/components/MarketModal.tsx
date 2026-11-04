import React, { useState } from 'react';
import { ProductId, MARKET_PRODUCT_INFO, MarketListing, InventoryItem } from '../types/game';
import type { MarketStateSnapshot } from '../services/marketState';
import { soundManager } from '../audio/soundManager';

interface MarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCoins: number;
  inventory: Record<string, InventoryItem>;
  marketListings: MarketListing[];
  marketState: MarketStateSnapshot | null;
  onBuyListing: (listingId: string, quantity: number) => void;
  onInstantSell: (productId: ProductId, quantity: number) => void;
  onCreateListing: (productId: ProductId, quantity: number, pricePerUnit: number) => Promise<boolean> | boolean;
}

export const MarketModal: React.FC<MarketModalProps> = ({
  isOpen,
  onClose,
  playerCoins,
  inventory,
  marketListings,
  marketState,
  onBuyListing,
  onInstantSell,
  onCreateListing,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'buy' | 'sell' | 'create'>('orders');
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Creation form state
  const [selectedProductToSell, setSelectedProductToSell] = useState<ProductId>('corn');
  const [sellQty, setSellQty] = useState(1);
  const [customPrice, setCustomPrice] = useState(25);

  if (!isOpen) return null;

  const categories = ['Todos', 'Grãos', 'Legumes', 'Frutas', 'Hortaliças', 'Granja', 'Laticínios', 'Pecuária'];

  // Filter listings
  const filteredListings = marketListings.filter((l) => {
    const meta = MARKET_PRODUCT_INFO[l.productId as ProductId];
    const matchesCategory = categoryFilter === 'Todos' || (l.category || meta?.category) === categoryFilter;
    const matchesSearch = l.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const availableCropItems = Object.entries(inventory)
    .filter(([_, item]) => (item.category === 'crop' || item.category === 'product') && item.count > 0)
    .map(([key, item]) => ({ key, ...item }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-amber-400 cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🏪</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-950">
                Mercado da Fazendinha
              </h3>
              <p className="text-xs text-amber-800 font-bold flex items-center gap-2 flex-wrap">
                <span>{marketState?.stall?.stall_name ?? 'Barraca da Fazenda'}</span>
                <span>•</span>
                <span className="text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 font-black">
                  ⭐ Reputação: {marketState?.reputation ? Number(marketState.reputation.reputation_score).toFixed(0) : '100'}%
                </span>
                {marketState?.notifications && marketState.notifications.filter(n => !n.read).length > 0 && (
                  <span className="text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 font-black animate-pulse">
                    🔔 {marketState.notifications.filter(n => !n.read).length} alerta(s) de estoque
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="bg-amber-100 border-2 border-amber-300 px-3.5 py-1.5 rounded-full text-amber-950 font-black text-sm shrink-0">
            {playerCoins} 🪙
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1.5 sm:gap-2 mb-3 border-b border-amber-200 pb-2 overflow-x-auto">
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('orders');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>📦</span>
            <span>Histórico do Mercado ({marketState?.transactions.length ?? 0})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('buy');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'buy'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>🛒</span>
            <span>Feira dos Jogadores ({marketListings.length})</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('sell');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'sell'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>💰</span>
            <span>Venda Rápida (Seu Zé)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('create');
            }}
            className={`px-3 sm:px-4 py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>📢</span>
            <span>Anunciar Produto</span>
          </button>
        </div>

        {/* Histórico confirmado pelo Supabase */}
        {activeTab === 'orders' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 text-xs text-amber-900 font-bold">
              Esta lista mostra somente transações retornadas pelo banco para a sua conta.
            </div>
            <div className="space-y-2">
              {!marketState?.transactions.length ? (
                <div className="p-6 text-center text-xs text-amber-800 font-bold bg-amber-50 rounded-2xl">
                  Nenhuma transação registrada para esta conta.
                </div>
              ) : (
                marketState.transactions.map((transaction, index) => {
                  const productId = typeof transaction.product_id === 'string' ? transaction.product_id : '';
                  const product = marketState.products.find((entry) => entry.product_id === productId);
                  const productMeta = MARKET_PRODUCT_INFO[productId as ProductId];
                  const quantity = Number(transaction.quantity) || 0;
                  const total = Number(transaction.total_amount) || 0;
                  const isSale = transaction.seller_id === marketState.player.id;
                  const counterpartyValue = isSale ? transaction.buyer_name : transaction.seller_name;
                  const counterparty = typeof counterpartyValue === 'string' ? counterpartyValue : 'Comprador';
                  const createdAt = typeof transaction.created_at === 'string' ? new Date(transaction.created_at) : null;
                  const dateLabel = createdAt && !Number.isNaN(createdAt.getTime())
                    ? createdAt.toLocaleString('pt-BR')
                    : 'Data não disponível';
                  const productName = product?.name || productMeta?.name || productId || 'Produto';
                  const icon = product?.icon || productMeta?.icon || '📦';

                  return (
                    <article key={String(transaction.id || `${productId}-${index}`)} className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="shrink-0 text-2xl">{icon}</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-black text-amber-950">
                            {isSale ? 'Venda confirmada' : 'Compra confirmada'} · {productName}
                          </p>
                          <p className="truncate text-[11px] font-semibold text-amber-800">
                            {isSale ? 'Comprador' : 'Vendedor'}: {counterparty} · {quantity} un.
                          </p>
                          <p className="text-[10px] text-amber-700">{dateLabel}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-black ${isSale ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                        {isSale ? '+' : '-'}{total} moedas
                      </span>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FEIRA P2P (JOGADORES) */}
        {activeTab === 'buy' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* Category filter pills & search */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundManager.playPop();
                    setCategoryFilter(cat);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-amber-500 text-white shadow'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredListings.length === 0 ? (
                <div className="col-span-full py-10 text-center text-amber-800 font-bold text-sm">
                  Nenhum anúncio listado nesta categoria no momento. Seja o primeiro a anunciar sua safra!
                </div>
              ) : (
                filteredListings.map((listing) => {
                  const canAfford = playerCoins >= listing.pricePerUnit;
                  return (
                    <div
                      key={listing.id}
                      className="bg-amber-50/80 border-2 border-amber-200 hover:border-amber-400 rounded-2xl p-3 flex flex-col justify-between transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-3xl shrink-0">{listing.icon}</span>
                        <div className="flex-1 overflow-hidden">
                          <h5 className="font-black text-sm text-amber-950 truncate">
                            {listing.productName}
                          </h5>
                          <span className="text-xs text-amber-700 font-bold block">
                            Vendedor: {listing.sellerName}
                          </span>
                          <span className="text-xs text-emerald-700 font-black">
                            Disponível: {listing.quantity} un.
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-amber-950 bg-amber-200 px-2 py-0.5 rounded-lg block">
                            {listing.pricePerUnit} 🪙 /un
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
                        <span className="text-xs text-amber-800 font-extrabold">
                          Total: {listing.pricePerUnit} 🪙
                        </span>
                        <button
                          onClick={() => {
                            if (canAfford) {
                              onBuyListing(listing.id, 1);
                            }
                          }}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                            canAfford
                              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <span>Comprar 1x</span>
                          <span>🛒</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VENDA RÁPIDA (SEU ZÉ) */}
        {activeTab === 'sell' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <p className="text-xs text-amber-800 font-bold">
              Venda sua produção diretamente para o balcão do Seu Zé no Mercado e receba as moedas na hora!
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {availableCropItems.length === 0 ? (
                <div className="col-span-full py-10 text-center text-amber-800 font-bold text-sm">
                  Sua mochila está vazia de colheitas e produtos no momento! Vá plantar ou ordenhar animais na fazenda!
                </div>
              ) : (
                availableCropItems.map((item) => (
                  <div
                    key={item.key}
                    className="bg-amber-50/80 border-2 border-amber-200 rounded-2xl p-3 flex flex-col justify-between text-center"
                  >
                    <div>
                      <span className="text-3xl block mb-1">{item.icon}</span>
                      <h5 className="font-black text-xs text-amber-950">{item.name}</h5>
                      <span className="text-xs font-bold text-amber-700 bg-amber-200/70 px-2 py-0.5 rounded-full inline-block mt-1">
                        Estoque: {item.count}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onInstantSell(item.key as ProductId, 1);
                      }}
                      className="mt-2 w-full py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white shadow cursor-pointer transition"
                    >
                      Vender 1x (+{item.value} 🪙)
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CRIAR ANÚNCIO P2P */}
        {activeTab === 'create' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <p className="text-xs text-amber-800 font-bold">
              Defina a quantidade e o preço para anunciar seus produtos na feira para outros jogadores comprarem:
            </p>

            <div>
              <label className="block text-xs font-black uppercase text-amber-800 mb-1">
                Selecione o Produto para Anunciar:
              </label>
              <select
                value={selectedProductToSell}
                onChange={(e) => {
                  const pId = e.target.value as ProductId;
                  setSelectedProductToSell(pId);
                  setCustomPrice(MARKET_PRODUCT_INFO[pId]?.defaultPrice || 25);
                }}
                className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-2.5 font-bold text-amber-950 text-sm focus:outline-none"
              >
                {Object.entries(MARKET_PRODUCT_INFO).map(([pId, meta]) => (
                  <option key={pId} value={pId}>
                    {meta.icon} {meta.name} (Sua mochila: {inventory[pId]?.count || 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase text-amber-800 mb-1">
                  Quantidade:
                </label>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, inventory[selectedProductToSell]?.count || 1)}
                  value={sellQty}
                  onChange={(e) => setSellQty(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-2.5 font-bold text-amber-950 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-800 mb-1">
                  Preço por Unidade (🪙):
                </label>
                <input
                  type="number"
                  min={1}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl p-2.5 font-bold text-amber-950 text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="bg-amber-100 p-3 rounded-2xl border border-amber-300 flex items-center justify-between text-xs font-black text-amber-950">
              <span>Valor Total do Lote:</span>
              <span>{sellQty * customPrice} Moedas 🪙</span>
            </div>

            <button
              onClick={async () => {
                const stock = inventory[selectedProductToSell]?.count || 0;
                if (stock < sellQty) {
                  soundManager.playPop();
                  alert(`Você não tem quantidade suficiente de ${selectedProductToSell} na mochila!`);
                  return;
                }
                const created = await onCreateListing(selectedProductToSell, sellQty, customPrice);
                if (created) setActiveTab('buy');
              }}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl shadow-lg cursor-pointer transition"
            >
              📢 Publicar Anúncio no Mercado!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
