import React, { useState, useMemo } from 'react';
import { CROPS_CATALOG, CropType } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { PlantingRecommendation } from '../services/isaAssistantService';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCoins: number;
  seedCosts: Partial<Record<CropType, number>>;
  playerInventory?: Record<string, { count?: number }>;
  recommendation?: PlantingRecommendation | null;
  onBuySeed: (cropType: CropType, cost: number, quantity?: number) => void;
  onBuyFeed: () => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  playerCoins,
  seedCosts,
  playerInventory = {},
  recommendation,
  onBuySeed,
  onBuyFeed,
}) => {
  // Quantidade selecionada individualmente por cultura
  const [quantities, setQuantities] = useState<Record<CropType, number>>({
    corn: 1,
    soy: 1,
    bean: 1,
    wheat: 1,
    rice: 1,
    tomato: 1,
    carrot: 1,
    strawberry: 1,
    pumpkin: 1,
    lettuce: 1,
  });

  const [activeTab, setActiveTab] = useState<'seeds' | 'animals'>('seeds');
  const [isBuying, setIsBuying] = useState(false);

  if (!isOpen) return null;

  const handleQuantityChange = (crop: CropType, delta: number, maxAffordable: number) => {
    soundManager.playPop();
    setQuantities((prev) => {
      const current = prev[crop] || 1;
      const next = Math.max(1, Math.min(maxAffordable || 99, current + delta));
      return { ...prev, [crop]: next };
    });
  };

  const handleSetExactQuantity = (crop: CropType, qty: number, maxAffordable: number) => {
    soundManager.playPop();
    const bounded = Math.max(1, Math.min(maxAffordable || 99, qty));
    setQuantities((prev) => ({ ...prev, [crop]: bounded }));
  };

  const handleBuy = (crop: CropType, unitCost: number, qty: number) => {
    if (isBuying) return;
    setIsBuying(true);
    try {
      soundManager.playCoin();
      onBuySeed(crop, unitCost, qty);
    } finally {
      setTimeout(() => setIsBuying(false), 250);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto select-none font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Botão Fechar */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-amber-400 cursor-pointer transition transform active:scale-90"
          title="Fechar Loja"
        >
          ✕
        </button>

        {/* Header Principal */}
        <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🌱</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-950 uppercase tracking-wide">
                Loja de Sementes
              </h3>
              <p className="text-[11px] font-bold text-amber-800">
                Sementes certificadas para plantio na fazenda
              </p>
            </div>
          </div>

          <div className="bg-amber-100 border-2 border-amber-300 px-3.5 py-1.5 rounded-2xl text-amber-950 font-black text-sm shrink-0 shadow-xs">
            Saldo: {playerCoins} 🪙
          </div>
        </div>

        {/* 🌱 Recomendação Inteligente da Isa */}
        {recommendation && (
          <div className="bg-gradient-to-r from-emerald-50 via-amber-50 to-emerald-50 border-2 border-emerald-300 rounded-2xl p-3 mb-3 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">💡</span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                  Recomendação da Isa
                </span>
              </div>
              <span className="text-[10px] font-black bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full">
                {recommendation.priority === 'urgent' ? '🚨 Alta Procura' : '⭐ Sugestão Estratégica'}
              </span>
            </div>
            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              {recommendation.reason}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <span className="text-lg">{recommendation.icon}</span>
                <span>
                  Sugerido:{' '}
                  <span className="font-black text-emerald-700">
                    {recommendation.suggestedPlantCount}x {recommendation.productName}
                  </span>
                </span>
              </div>

              {(() => {
                const totalCost = recommendation.suggestedPlantCount * recommendation.seedCost;
                const canAffordRec = playerCoins >= totalCost && recommendation.suggestedPlantCount > 0;
                return (
                  <button
                    onClick={() => {
                      if (canAffordRec && recommendation.productId in CROPS_CATALOG) {
                        handleBuy(
                          recommendation.productId as CropType,
                          recommendation.seedCost,
                          recommendation.suggestedPlantCount
                        );
                      }
                    }}
                    disabled={!canAffordRec || isBuying}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      canAffordRec
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white transform active:scale-95'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Comprar Recomendação ({totalCost} 🪙)</span>
                  </button>
                );
              })()}
            </div>
          </div>
        )}

        {/* Abas Rápidas: Sementes ou Cuidados */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setActiveTab('seeds')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
              activeTab === 'seeds'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            🌾 Sementes Frescas (10 Culturas)
          </button>
          <button
            onClick={() => setActiveTab('animals')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
              activeTab === 'animals'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            🐮 Ração para Animais
          </button>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'seeds' ? (
          <div className="space-y-2.5 max-h-[48vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {Object.values(CROPS_CATALOG).map((crop) => {
                const baseCost = typeof seedCosts[crop.id] === 'number' ? seedCosts[crop.id]! : crop.seedCost;
                const maxAffordable = Math.max(1, Math.floor(playerCoins / Math.max(1, baseCost)));
                const currentQty = quantities[crop.id] || 1;
                const totalCost = baseCost * currentQty;
                const canAfford = playerCoins >= totalCost && playerCoins >= baseCost;
                const inInventory = playerInventory[`${crop.id}_seed`]?.count || 0;

                return (
                  <div
                    key={crop.id}
                    className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-3 flex flex-col justify-between hover:border-amber-300 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span className="text-2xl shrink-0">{crop.icon}</span>
                          <div>
                            <h5 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
                              {crop.name}
                              <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.2 rounded-md">
                                {baseCost} 🪙
                              </span>
                            </h5>
                            <p className="text-[11px] text-amber-800 leading-tight mt-0.5">
                              {crop.description}
                            </p>
                          </div>
                        </div>

                        {/* Estoque atual na mochila */}
                        <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shrink-0">
                          Mochila: {inInventory}x
                        </span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-700 font-bold">
                        <span>⏱️ Cresce em {crop.growthTime}s</span>
                        <span>•</span>
                        <span>⭐ +{crop.xpReward} XP</span>
                      </div>
                    </div>

                    {/* Controles de Quantidade e Botão de Compra */}
                    <div className="mt-3 pt-2.5 border-t border-amber-200/80">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-black text-amber-900">Quantidade:</span>
                        
                        {/* Seletor Stepper [-] [qty] [+] */}
                        <div className="flex items-center gap-1 bg-white border border-amber-300 rounded-xl px-1.5 py-0.5 shadow-xs">
                          <button
                            onClick={() => handleQuantityChange(crop.id, -1, maxAffordable)}
                            className="w-5 h-5 flex items-center justify-center font-black text-amber-900 hover:bg-amber-100 rounded cursor-pointer"
                            title="Diminuir"
                          >
                            -
                          </button>
                          <span className="w-7 text-center font-black text-xs text-amber-950 tabular-nums">
                            {currentQty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(crop.id, +1, maxAffordable)}
                            className="w-5 h-5 flex items-center justify-center font-black text-amber-900 hover:bg-amber-100 rounded cursor-pointer"
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>

                        {/* Atalhos Rápidos */}
                        <div className="flex items-center gap-1 text-[10px] font-black">
                          {[1, 5, 10].map((preset) => (
                            <button
                              key={preset}
                              onClick={() => handleSetExactQuantity(crop.id, preset, maxAffordable)}
                              className={`px-1.5 py-0.5 rounded-lg border ${
                                currentQty === preset
                                  ? 'bg-amber-500 text-white border-amber-600'
                                  : 'bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200'
                              } cursor-pointer`}
                            >
                              {preset}x
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Botão de Compra */}
                      <button
                        onClick={() => handleBuy(crop.id, baseCost, currentQty)}
                        disabled={!canAfford || isBuying}
                        className={`w-full py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-600 text-white transform active:scale-95'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <span>Comprar {currentQty}x Sementes</span>
                        <span>({totalCost} 🪙)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-amber-50/70 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌾</span>
                <div>
                  <h5 className="font-black text-sm text-amber-950">
                    Saco de Feno & Ração Especial
                  </h5>
                  <p className="text-xs text-amber-800">
                    Alimente vacas, galinhas e porquinhos para produzir leite fresco e ovos.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  if (playerCoins >= 15) {
                    soundManager.playCoin();
                    onBuyFeed();
                  }
                }}
                disabled={playerCoins < 15}
                className={`py-2 px-4 rounded-xl text-xs font-black transition cursor-pointer shrink-0 shadow-sm ${
                  playerCoins >= 15
                    ? 'bg-amber-500 hover:bg-amber-600 text-white transform active:scale-95'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Comprar (15 🪙)
              </button>
            </div>
          </div>
        )}

        {/* Rodapé informativo */}
        <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800 font-bold">
          <span>🌾 Sementes compradas vão diretamente para sua mochila para plantio imediato.</span>
        </div>
      </div>
    </div>
  );
};
