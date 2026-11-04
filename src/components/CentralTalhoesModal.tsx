import React, { useState } from 'react';
import { FarmLand, TalhaoCategory } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface CentralTalhoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lands: FarmLand[];
  playerCoins: number;
  playerId: string;
  onBuyLand: (landId: string) => void;
  onTeleportToLand: (x: number, z: number) => void;
  onOpenMyPlots: (landId: string) => void;
}

export const CentralTalhoesModal: React.FC<CentralTalhoesModalProps> = ({
  isOpen,
  onClose,
  lands,
  playerCoins,
  playerId,
  onBuyLand,
  onTeleportToLand,
  onOpenMyPlots,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedLandId, setSelectedLandId] = useState<string>(lands[0]?.id || 'talhao-001');

  if (!isOpen) return null;

  const categories: { id: string; label: string; icon: string }[] = [
    { id: 'todos', label: 'Todos os Talhões', icon: '🗺️' },
    { id: 'small', label: 'Pequeno', icon: '🌱' },
    { id: 'medium', label: 'Médio', icon: '🌾' },
    { id: 'large', label: 'Grande', icon: '🚜' },
    { id: 'special', label: 'Especial', icon: '⭐' },
    { id: 'river', label: 'Próximo ao Rio', icon: '🌊' },
    { id: 'lake', label: 'Próximo ao Lago', icon: '⛵' },
  ];

  const filteredLands = lands.filter((l) => {
    if (selectedCategory === 'todos') return true;
    return l.category === selectedCategory;
  });

  const currentLand = lands.find((l) => l.id === selectedLandId) || filteredLands[0] || lands[0];
  const isMine = currentLand && currentLand.ownerId === playerId;
  const isAvailable = currentLand && currentLand.status === 'available';
  const canAfford = currentLand && playerCoins >= currentLand.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-emerald-500 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-emerald-400 cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-emerald-200 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🗺️</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-950 flex items-center gap-2">
                Central de Talhões Agrícolas
              </h3>
              <p className="text-xs text-emerald-800 font-bold">
                Cadastramento e aquisição de terras rurais para plantio independente
              </p>
            </div>
          </div>

          <div className="bg-emerald-100 border-2 border-emerald-400 px-3.5 py-1 rounded-full text-emerald-950 font-black text-sm shrink-0">
            {playerCoins} 🪙
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5 pb-2 mb-3 border-b border-emerald-100">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundManager.playPop();
                setSelectedCategory(cat.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Main Content Split: List on Left, Details Card on Right */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 overflow-hidden">
          {/* Left: Lands Grid / List */}
          <div className="md:col-span-5 space-y-2 overflow-y-auto pr-1 max-h-[50vh] md:max-h-full">
            {filteredLands.map((land) => {
              const isSelected = land.id === currentLand?.id;
              const mine = land.ownerId === playerId;
              return (
                <button
                  key={land.id}
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedLandId(land.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl text-left border-2 transition cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-300 border-emerald-600 shadow font-black text-emerald-950'
                      : 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100 text-emerald-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black uppercase text-emerald-800 bg-white/70 px-1.5 py-0.2 rounded border border-emerald-300">
                        {land.code}
                      </span>
                      <span className="text-xs font-black truncate">{land.name}</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 block mt-0.5 font-bold">
                      {land.categoryLabel} • {land.areaM2} m² • {land.plotsCount} Canteiros
                    </span>
                  </div>

                  <div className="text-right shrink-0 ml-2">
                    {mine ? (
                      <span className="bg-amber-300 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500">
                        ⭐ Minha
                      </span>
                    ) : land.status === 'owned' ? (
                      <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Ocupado
                      </span>
                    ) : (
                      <span className="bg-emerald-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        {land.price} 🪙
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Selected Land Details */}
          {currentLand && (
            <div className="md:col-span-7 bg-emerald-50/80 border-3 border-emerald-300 rounded-3xl p-4 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div>
                    <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block">
                      {currentLand.code} — {currentLand.categoryLabel}
                    </span>
                    <h4 className="text-lg font-black text-emerald-950">{currentLand.name}</h4>
                  </div>
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full border ${
                      isMine
                        ? 'bg-amber-300 text-amber-950 border-amber-500'
                        : currentLand.status === 'owned'
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-emerald-200 text-emerald-950 border-emerald-400'
                    }`}
                  >
                    {isMine
                      ? '⭐ Sua Propriedade'
                      : currentLand.status === 'owned'
                      ? `Proprietário: ${currentLand.ownerName}`
                      : 'Disponível para Compra'}
                  </span>
                </div>

                <p className="text-xs text-emerald-900 font-semibold my-2.5">
                  {currentLand.description}
                </p>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs mb-3">
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">ÁREA TOTAL</span>
                    <span className="text-emerald-950 font-black text-sm">{currentLand.areaM2} m²</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">CANTEIROS</span>
                    <span className="text-emerald-950 font-black text-sm">{currentLand.plotsCount} slots</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">VALOR</span>
                    <span className="text-amber-600 font-black text-sm">{currentLand.price} 🪙</span>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-slate-500 font-bold block">COORDENADAS</span>
                    <span className="text-sky-800 font-black text-xs">x:{currentLand.x}, z:{currentLand.z}</span>
                  </div>
                </div>

                <div className="bg-white/90 p-3 rounded-2xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <p className="font-black text-emerald-950">🌾 Atividades Agrícolas no Talhão:</p>
                  <p>• Preparar e arar o solo individual.</p>
                  <p>• Plantar qualquer uma das 9 culturas (milho, soja, feijão, trigo, arroz, etc.).</p>
                  <p>• Regar, acompanhar crescimento offline e colher os frutos para venda no mercado.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-emerald-200 space-y-2">
                {isAvailable && (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        soundManager.playLevelUp();
                        onBuyLand(currentLand.id);
                      }
                    }}
                    disabled={!canAfford}
                    className={`w-full py-3 rounded-2xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                      canAfford
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <span>COMPRAR {currentLand.code} ({currentLand.price} 🪙)</span>
                    <span>🏡</span>
                  </button>
                )}

                {isMine && (
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onOpenMyPlots(currentLand.id);
                      onClose();
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-amber-950 font-black text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-2"
                  >
                    <span>🌾 Gerenciar Plantações do Talhão</span>
                    <span>➡️</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    soundManager.playFootstep();
                    onTeleportToLand(currentLand.x, currentLand.z);
                    onClose();
                  }}
                  className="w-full py-2 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 font-extrabold text-xs rounded-xl cursor-pointer transition text-center"
                >
                  📍 Caminhar até a entrada deste talhão no mapa 3D
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
