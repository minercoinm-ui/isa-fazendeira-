import React, { useMemo, useState } from 'react';
import isaImg from '../assets/isa_portrait.jpg';
import { IsaMission, FarmPlot, InventoryItem, ProductId, MARKET_PRODUCT_INFO } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { isaVoiceManager } from '../audio/isaVoiceManager';
import { MarketStateSnapshot } from '../services/marketState';
import { isaAssistantService, IsaAssistantDiagnosis, MonitoredProduct } from '../services/isaAssistantService';

interface IsaDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: IsaMission[];
  onClaimReward: (missionId: string) => void;
  onGiveFreeSeeds: () => void;
  // Administradora Inteligente da Fazenda
  marketState?: MarketStateSnapshot | null;
  plots?: FarmPlot[];
  inventory?: Record<string, InventoryItem>;
  currentUserId?: string;
  onOpenMarketTab?: (tab: 'orders' | 'buy' | 'sell' | 'create', productId?: ProductId) => void;
  onOpenMyPlots?: () => void;
  initialTab?: 'admin' | 'recommendations' | 'stock' | 'missions';
}

export const IsaDialogueModal: React.FC<IsaDialogueModalProps> = ({
  isOpen,
  onClose,
  missions,
  onClaimReward,
  onGiveFreeSeeds,
  marketState = null,
  plots = [],
  inventory = {},
  currentUserId = '',
  onOpenMarketTab,
  onOpenMyPlots,
  initialTab = 'admin',
}) => {
  const [activeTab, setActiveTab] = useState<'admin' | 'recommendations' | 'stock' | 'missions'>(initialTab);
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'exhausted' | 'low' | 'normal'>('all');

  // Diagnóstico em tempo real da administradora
  const diagnosis: IsaAssistantDiagnosis = useMemo(() => {
    return isaAssistantService.diagnose(marketState, plots, inventory, currentUserId || marketState?.player?.id || '');
  }, [marketState, plots, inventory, currentUserId]);

  if (!isOpen) return null;

  const handlePlayIsaAdvice = () => {
    soundManager.playPop();
    isaVoiceManager.speak(diagnosis.primaryMessage.text, diagnosis.primaryMessage.animation, {
      priority: 'high',
      bypassCooldown: true,
    });
  };

  const filteredProducts = diagnosis.monitoredProducts.filter((p) => {
    if (selectedStockFilter === 'all') return true;
    return p.status === selectedStockFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-pink-400 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-pink-100 hover:bg-pink-200 text-pink-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-pink-400 cursor-pointer shadow-sm transition"
        >
          ✕
        </button>

        {/* Header da Isa com Avatar & Cargo */}
        <div className="flex items-center gap-3 sm:gap-4 pb-3 border-b border-pink-200 mb-3 pr-10">
          <div className="relative shrink-0">
            <img
              src={isaImg}
              alt="Isa Administradora"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-pink-400 shadow-md object-cover"
            />
            <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-white shadow">
              ADMIN ⭐
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg sm:text-2xl font-black text-pink-950 leading-tight">
                Isa — Administradora da Fazenda
              </h3>
              {diagnosis.overallStatus === 'critical_stockout' && (
                <span className="bg-rose-100 border border-rose-300 text-rose-800 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full animate-pulse">
                  ⚠️ Repor Estoque Urgente
                </span>
              )}
              {diagnosis.overallStatus === 'attention_needed' && (
                <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">
                  🌾 Atenção ao Estoque
                </span>
              )}
              {diagnosis.overallStatus === 'all_stocked' && (
                <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full">
                  ✅ Barraca Abastecida
                </span>
              )}
            </div>
            <p className="text-xs text-pink-800 font-bold mt-0.5">
              Sua assistente inteligente para cuidar das colheitas, dos animais e das vendas no mercado!
            </p>
          </div>
        </div>

        {/* Balão de fala inteligente da Isa com botão de ouvir voz */}
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border-2 border-pink-300 rounded-2xl p-3 mb-3 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl shrink-0">🌻</span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-700 block">
                Conselho da Isa Agora:
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-pink-950 italic">
                &quot;{diagnosis.primaryMessage.text}&quot;
              </p>
            </div>
          </div>
          <button
            onClick={handlePlayIsaAdvice}
            className="shrink-0 bg-pink-500 hover:bg-pink-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow border border-pink-600 cursor-pointer transition flex items-center gap-1 active:scale-95"
            title="Ouvir a Isa falar em voz alta"
          >
            <span>🔊</span>
            <span className="hidden sm:inline">Ouvir</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 sm:gap-2 mb-3 border-b border-pink-200 pb-2 overflow-x-auto shrink-0">
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('admin');
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-pink-500 text-white shadow border-2 border-pink-700'
                : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
            }`}
          >
            <span>📋</span>
            <span>Painel</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('recommendations');
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 relative ${
              activeTab === 'recommendations'
                ? 'bg-pink-500 text-white shadow border-2 border-pink-700'
                : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
            }`}
          >
            <span>🌾</span>
            <span>Recomendações ({diagnosis.recommendations.length})</span>
            {diagnosis.exhaustedProducts.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('stock');
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'stock'
                ? 'bg-pink-500 text-white shadow border-2 border-pink-700'
                : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
            }`}
          >
            <span>🏪</span>
            <span>Estoque da Barraca (13)</span>
          </button>

          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('missions');
            }}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
              activeTab === 'missions'
                ? 'bg-pink-500 text-white shadow border-2 border-pink-700'
                : 'bg-pink-50 text-pink-800 hover:bg-pink-100'
            }`}
          >
            <span>⭐</span>
            <span>Missões & Presente</span>
          </button>
        </div>

        {/* Tab 1: Painel da Administradora */}
        {activeTab === 'admin' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-2.5 text-center">
                <span className="text-xl">🏪</span>
                <span className="block text-base sm:text-lg font-black text-amber-950">
                  {diagnosis.totalStallUnits}
                </span>
                <span className="text-[10px] font-bold text-amber-800 uppercase">Itens na Barraca</span>
              </div>

              <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-2.5 text-center">
                <span className="text-xl">⚠️</span>
                <span className="block text-base sm:text-lg font-black text-rose-950">
                  {diagnosis.exhaustedProducts.length}
                </span>
                <span className="text-[10px] font-bold text-rose-800 uppercase">Esgotados (Zero)</span>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-2.5 text-center">
                <span className="text-xl">📉</span>
                <span className="block text-base sm:text-lg font-black text-yellow-950">
                  {diagnosis.lowProducts.length}
                </span>
                <span className="text-[10px] font-bold text-yellow-800 uppercase">Estoque Baixo (1-3)</span>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-2.5 text-center">
                <span className="text-xl">🌱</span>
                <span className="block text-base sm:text-lg font-black text-emerald-950">
                  {diagnosis.emptyPlotsCount}/{diagnosis.totalPlotsCount}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Talhões Livres</span>
              </div>
            </div>

            {/* Alerta de Clientes / NPCs descontentes */}
            {diagnosis.unreadMissedSaleNotifications > 0 && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3 flex items-start gap-3">
                <span className="text-2xl shrink-0">🔔</span>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-rose-950 uppercase tracking-wider">
                    Alerta de Demanda não Atendida:
                  </h4>
                  <p className="text-xs text-rose-900 mt-0.5">
                    Clientes NPCs visitaram sua barraca à procura de mercadorias que estavam esgotadas! Reabasteça
                    para proteger sua reputação comercial.
                  </p>
                </div>
                <button
                  onClick={() => {
                    soundManager.playPop();
                    setActiveTab('recommendations');
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer shrink-0"
                >
                  Ver O Que Plantar
                </button>
              </div>
            )}

            {/* Prioridades Imediatas */}
            <div className="bg-white border-2 border-pink-200 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-pink-900 flex items-center gap-1.5">
                  <span>📌</span>
                  <span>Ações Recomendadas pela Isa:</span>
                </h4>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="text-xs font-black text-pink-600 hover:text-pink-800 underline cursor-pointer"
                >
                  Ver todas ({diagnosis.recommendations.length})
                </button>
              </div>

              {diagnosis.recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-pink-50/70 border border-pink-200 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl shrink-0">{rec.icon}</span>
                    <div className="truncate">
                      <span className="font-black text-pink-950 block">{rec.productName}</span>
                      <span className="text-pink-800 text-[11px] block truncate">{rec.reason}</span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {rec.hasSeedsInBackpack ? (
                      <button
                        onClick={() => {
                          soundManager.playPop();
                          onClose();
                          onOpenMyPlots?.();
                        }}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow cursor-pointer"
                      >
                        🌱 Plantar
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          soundManager.playPop();
                          onClose();
                          onOpenMarketTab?.('buy', rec.productId);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] px-2.5 py-1 rounded-lg shadow cursor-pointer"
                      >
                        🪙 Sementes
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Atalhos Rápidos */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                onClick={() => {
                  soundManager.playPop();
                  onClose();
                  onOpenMarketTab?.('create');
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-2.5 px-3 rounded-xl border border-amber-600 shadow cursor-pointer text-center"
              >
                🏪 Abastecer Minha Barraca
              </button>

              <button
                onClick={() => {
                  soundManager.playPop();
                  onClose();
                  onOpenMyPlots?.();
                }}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2.5 px-3 rounded-xl border border-emerald-700 shadow cursor-pointer text-center"
              >
                🌱 Cuidar dos Talhões
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Recomendações de Plantio & Produção */}
        {activeTab === 'recommendations' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-pink-900 font-bold bg-pink-50 p-2.5 rounded-xl border border-pink-200">
              <span>
                Talhões Livres no Momento: <strong>{diagnosis.emptyPlotsCount}</strong> de {diagnosis.totalPlotsCount}
              </span>
              <span>Recomendações com base nas vendas e estoque</span>
            </div>

            {diagnosis.recommendations.length === 0 ? (
              <div className="text-center py-10 bg-emerald-50 rounded-2xl border-2 border-emerald-200 p-6">
                <span className="text-4xl">🌻</span>
                <h4 className="text-sm font-black text-emerald-950 mt-2">Tudo em Perfeita Ordem!</h4>
                <p className="text-xs text-emerald-800 mt-1 max-w-sm mx-auto">
                  Todos os produtos monitorados estão com estoque saudável na barraca. Bom trabalho, fazendeiro!
                </p>
              </div>
            ) : (
              diagnosis.recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-2xl border-2 transition ${
                    rec.priority === 'urgent'
                      ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-200'
                      : rec.priority === 'high'
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-pink-50/60 border-pink-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-3xl shrink-0">{rec.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-black text-sm text-pink-950">{rec.productName}</h5>
                          {rec.priority === 'urgent' && (
                            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md">
                              URGENTE: Procura de Clientes
                            </span>
                          )}
                          {rec.priority === 'high' && (
                            <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md">
                              ESGOTADO
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-pink-900 font-semibold mt-0.5">{rec.reason}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        Sugerido: {rec.suggestedPlantCount}x
                      </span>
                    </div>
                  </div>

                  {/* Dica da Ação */}
                  <div className="mt-2 pt-2 border-t border-pink-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <p className="text-pink-950 font-bold">{rec.actionTip}</p>

                    <div className="shrink-0 flex items-center gap-2">
                      {rec.isAnimalProduct ? (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onClose();
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          Ir aos Animais 🐮
                        </button>
                      ) : rec.hasSeedsInBackpack ? (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onClose();
                            onOpenMyPlots?.();
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          Plantar Agora 🌱
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onClose();
                            onOpenMarketTab?.('buy', rec.productId);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs px-3 py-1.5 rounded-xl shadow cursor-pointer"
                        >
                          Comprar Sementes 🪙
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Estoque da Barraca (13 Produtos Monitorados Individualmente) */}
        {activeTab === 'stock' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
            {/* Filtros de Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-black">
              <button
                onClick={() => setSelectedStockFilter('all')}
                className={`px-3 py-1 rounded-xl cursor-pointer ${
                  selectedStockFilter === 'all'
                    ? 'bg-pink-600 text-white'
                    : 'bg-pink-100 text-pink-900 hover:bg-pink-200'
                }`}
              >
                Todos ({diagnosis.monitoredProducts.length})
              </button>
              <button
                onClick={() => setSelectedStockFilter('exhausted')}
                className={`px-3 py-1 rounded-xl cursor-pointer flex items-center gap-1 ${
                  selectedStockFilter === 'exhausted'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                }`}
              >
                <span>🔴 Esgotado</span>
                <span>({diagnosis.exhaustedProducts.length})</span>
              </button>
              <button
                onClick={() => setSelectedStockFilter('low')}
                className={`px-3 py-1 rounded-xl cursor-pointer flex items-center gap-1 ${
                  selectedStockFilter === 'low'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                }`}
              >
                <span>🟡 Baixo</span>
                <span>({diagnosis.lowProducts.length})</span>
              </button>
              <button
                onClick={() => setSelectedStockFilter('normal')}
                className={`px-3 py-1 rounded-xl cursor-pointer flex items-center gap-1 ${
                  selectedStockFilter === 'normal'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                }`}
              >
                <span>🟢 Normal</span>
                <span>({diagnosis.normalProducts.length})</span>
              </button>
            </div>

            {/* Grid dos 13 produtos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredProducts.map((p) => {
                const isExhausted = p.status === 'exhausted';
                const isLow = p.status === 'low';

                return (
                  <div
                    key={p.productId}
                    className={`p-2.5 rounded-2xl border-2 flex items-center justify-between gap-2 ${
                      isExhausted
                        ? 'bg-rose-50/80 border-rose-300'
                        : isLow
                        ? 'bg-yellow-50/80 border-yellow-300'
                        : 'bg-emerald-50/60 border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0">{p.icon}</span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-pink-950 truncate">{p.name}</span>
                          {isExhausted && (
                            <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                              ZERADO
                            </span>
                          )}
                          {isLow && (
                            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                              BAIXO
                            </span>
                          )}
                          {!isExhausted && !isLow && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                              OK
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-pink-900 font-bold mt-0.5 space-x-1.5">
                          <span>Barraca: <strong>{p.stallStock} un</strong></span>
                          <span>•</span>
                          <span>Mochila: <strong>{p.backpackStock} un</strong></span>
                          {p.seedCountInBackpack > 0 && (
                            <>
                              <span>•</span>
                              <span>Sementes: <strong>{p.seedCountInBackpack}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {p.backpackStock > 0 ? (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onClose();
                            onOpenMarketTab?.('create', p.productId);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow cursor-pointer"
                          title="Colocar itens da mochila na barraca"
                        >
                          Abastecer
                        </button>
                      ) : p.seedCountInBackpack > 0 ? (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onClose();
                            onOpenMyPlots?.();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow cursor-pointer"
                          title="Plantar sementes na fazenda"
                        >
                          Plantar
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onClose();
                            onOpenMarketTab?.('buy', p.productId);
                          }}
                          className="bg-pink-500 hover:bg-pink-600 text-white font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow cursor-pointer"
                          title="Comprar sementes"
                        >
                          Semente
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Missões & Presentes da Isa (100% Preservado) */}
        {activeTab === 'missions' && (
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-pink-800">
              Missões e Tarefas da Fazendinha:
            </h4>

            {missions.map((m) => {
              const isFinished = m.currentCount >= m.requiredCount;
              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border-2 transition ${
                    m.claimed
                      ? 'bg-emerald-50 border-emerald-300 opacity-80'
                      : isFinished
                      ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-300'
                      : 'bg-pink-50/60 border-pink-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-black text-sm text-pink-950 flex items-center gap-1.5">
                        {m.claimed ? '✅' : isFinished ? '🎉' : '📌'} {m.title}
                      </h5>
                      <p className="text-xs text-pink-900 mt-0.5">{m.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        +{m.rewardCoins} 🪙 +{m.rewardXp} XP
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="flex-1 bg-pink-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFinished ? 'bg-emerald-500' : 'bg-pink-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (m.currentCount / m.requiredCount) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold text-pink-950">
                      {m.currentCount}/{m.requiredCount}
                    </span>

                    {isFinished && !m.claimed && (
                      <button
                        onClick={() => {
                          onClaimReward(m.id);
                        }}
                        className="ml-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black text-xs px-3 py-1.5 rounded-xl shadow border border-amber-600 cursor-pointer animate-bounce"
                      >
                        Resgatar Recompensa! 🎁
                      </button>
                    )}

                    {m.claimed && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Concluída
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Presente de Sementes da Isa */}
            <div className="mt-4 pt-3 border-t border-pink-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-pink-800 font-semibold text-center sm:text-left">
                Ficou sem sementes? A Isa te dá 3 sementes de milho de presente!
              </p>
              <button
                onClick={() => {
                  soundManager.playPop();
                  onGiveFreeSeeds();
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow border border-pink-700 cursor-pointer shrink-0"
              >
                🎁 Ganhar Sementes da Isa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
