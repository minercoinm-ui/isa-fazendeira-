import React, { useState } from 'react';
import { FARM_EXPANSION_PACKAGES, FarmExpansionPackage } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface ExpandFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerCoins: number;
  unlockedPackageIds: string[];
  totalPlotsCount: number;
  onBuyExpansion: (pkg: FarmExpansionPackage) => Promise<boolean> | boolean;
}

export const ExpandFarmModal: React.FC<ExpandFarmModalProps> = ({
  isOpen,
  onClose,
  playerCoins,
  unlockedPackageIds,
  totalPlotsCount,
  onBuyExpansion,
}) => {
  const [confirmPkg, setConfirmPkg] = useState<FarmExpansionPackage | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirmPurchase = async () => {
    if (!confirmPkg || isProcessing) return;
    setIsProcessing(true);
    try {
      const success = await onBuyExpansion(confirmPkg);
      if (success) {
        soundManager.playCoin();
        setConfirmPkg(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto select-none font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-emerald-500 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            setConfirmPkg(null);
            onClose();
          }}
          className="absolute top-4 right-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-emerald-400 cursor-pointer transition transform active:scale-90"
          title="Fechar"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-emerald-200 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🚜</span>
            <div>
              <h3 className="text-xl font-black text-emerald-950 uppercase tracking-wide">
                Expandir Horta
              </h3>
              <p className="text-[11px] font-bold text-emerald-700">
                Amplie sua capacidade agrícola com novos canteiros férteis
              </p>
            </div>
          </div>

          <div className="bg-amber-100 border-2 border-amber-300 px-3 py-1.5 rounded-2xl text-amber-950 font-black text-xs shrink-0 shadow-xs">
            {playerCoins} 🪙
          </div>
        </div>

        {/* Capacity Overview Bar */}
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs font-black text-emerald-950 mb-1.5">
            <span className="flex items-center gap-1.5">
              <span>🌱</span> Capacidade de Plantio:
            </span>
            <span className="bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full tabular-nums">
              {totalPlotsCount} / 32 Canteiros Ativos
            </span>
          </div>
          <div className="w-full bg-emerald-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${Math.min(100, Math.round((totalPlotsCount / 32) * 100))}%` }}
            />
          </div>
          <p className="text-[10px] text-emerald-800 font-semibold mt-1">
            Cada pacote adiciona 4 novos canteiros 3D no mapa com suporte a irrigação e colheita.
          </p>
        </div>

        {/* Confirmation Dialog Overlay */}
        {confirmPkg && (
          <div className="mb-4 p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 shadow-md">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{confirmPkg.icon}</span>
              <div className="flex-1">
                <h4 className="text-sm font-black text-amber-950">
                  Confirmar Desbloqueio: {confirmPkg.name}?
                </h4>
                <p className="text-xs text-amber-900 mt-0.5">{confirmPkg.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900">
                    Custo: <span className="text-amber-700 font-black">{confirmPkg.price} 🪙</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmPkg(null)}
                      disabled={isProcessing}
                      className="px-3 py-1 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={isProcessing || playerCoins < confirmPkg.price}
                      className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer shadow flex items-center gap-1.5"
                    >
                      {isProcessing ? 'Desbloqueando...' : 'Confirmar Compra'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Packages List */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {FARM_EXPANSION_PACKAGES.map((pkg) => {
            const isUnlocked = unlockedPackageIds.includes(pkg.id);
            const canAfford = playerCoins >= pkg.price;

            return (
              <div
                key={pkg.id}
                className={`border-2 rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-emerald-50/60 border-emerald-300 opacity-90'
                    : canAfford
                    ? 'bg-white border-emerald-300 hover:border-emerald-500 shadow-sm'
                    : 'bg-gray-50 border-gray-200 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-2xl border border-emerald-300 shrink-0">
                    {pkg.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-black text-sm text-emerald-950">{pkg.name}</h5>
                      <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                        +{pkg.plotCount} Canteiros
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5 leading-snug">
                      {pkg.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs">
                      ✓ Desbloqueado
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        setConfirmPkg(pkg);
                      }}
                      disabled={!canAfford}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white transform active:scale-95'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <span>Comprar</span>
                      <span>({pkg.price} 🪙)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tip Footer */}
        <div className="mt-3.5 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-bold">
          <span>💡 Dica da Isa: Mais canteiros aceleram seu abastecimento no mercado!</span>
        </div>
      </div>
    </div>
  );
};
