import React, { useState } from 'react';
import { FarmLand } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface LandMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  lands: FarmLand[];
  playerCoins: number;
  playerId: string;
  onBuyLand: (landId: string) => void;
  onAddConstruction: (landId: string, type: 'fence' | 'shed' | 'animal_pen' | 'garden_bed' | 'lantern', label: string) => void;
  onTeleportToLand: (x: number, z: number) => void;
}

export const LandMarketModal: React.FC<LandMarketModalProps> = ({
  isOpen,
  onClose,
  lands,
  playerCoins,
  playerId,
  onBuyLand,
  onAddConstruction,
  onTeleportToLand,
}) => {
  const [selectedLandId, setSelectedLandId] = useState<string>(lands[0]?.id || 'land-lake');

  if (!isOpen) return null;

  const currentLand = lands.find((l) => l.id === selectedLandId) || lands[0];
  const isMine = currentLand && currentLand.ownerId === playerId;
  const isAvailable = currentLand && currentLand.status === 'available';
  const canAfford = currentLand && playerCoins >= currentLand.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-emerald-500 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-emerald-400 cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-200">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🗺️</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-950">
                Expanda sua Fazenda!
              </h3>
              <p className="text-xs text-emerald-800 font-bold">
                Adquira novas terras exclusivas ao redor da fazenda da Isa com suas moedas!
              </p>
            </div>
          </div>

          <div className="bg-emerald-100 border-2 border-emerald-300 px-3.5 py-1.5 rounded-full text-emerald-950 font-black text-sm shrink-0">
            {playerCoins} 🪙
          </div>
        </div>

        {/* Land Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-4">
          {lands.map((land) => {
            const isSelected = land.id === selectedLandId;
            const mine = land.ownerId === playerId;
            return (
              <button
                key={land.id}
                onClick={() => {
                  soundManager.playPop();
                  setSelectedLandId(land.id);
                }}
                className={`p-2 rounded-xl text-center border-2 transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-400 border-emerald-700 shadow-md font-black text-emerald-950 scale-102'
                    : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900 font-bold'
                }`}
              >
                <span className="text-xl block mb-0.5">
                  {mine ? '⭐' : land.status === 'owned' ? '🔒' : '🌾'}
                </span>
                <span className="text-[11px] block truncate">{land.name}</span>
                <span className="text-[10px] text-emerald-700 block font-extrabold">
                  {mine ? 'Minha' : `${land.price} 🪙`}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Land Detail Card */}
        {currentLand && (
          <div className="bg-emerald-50/70 border-3 border-emerald-300 rounded-2xl p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-emerald-200">
              <div>
                <h4 className="text-lg font-black text-emerald-950 flex items-center gap-2">
                  <span>🏡</span> {currentLand.name}
                </h4>
                <p className="text-xs text-emerald-800 font-semibold">{currentLand.description}</p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span
                  className={`text-xs font-black px-3 py-1 rounded-full border ${
                    isMine
                      ? 'bg-amber-300 text-amber-950 border-amber-500'
                      : currentLand.status === 'owned'
                      ? 'bg-slate-200 text-slate-800 border-slate-400'
                      : 'bg-emerald-200 text-emerald-950 border-emerald-400'
                  }`}
                >
                  {isMine
                    ? '⭐ Sua Propriedade'
                    : currentLand.status === 'owned'
                    ? `Ocupado por ${currentLand.ownerName}`
                    : '🌾 Terreno Disponível'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs my-3">
              <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                <span className="text-slate-500 block text-[10px] font-bold">ÁREA TOTAL</span>
                <span className="font-black text-emerald-900 text-sm">{currentLand.areaM2} m²</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                <span className="text-slate-500 block text-[10px] font-bold">PREÇO</span>
                <span className="font-black text-amber-600 text-sm">{currentLand.price} 🪙</span>
              </div>
              <div className="bg-white/80 p-2 rounded-xl border border-emerald-200">
                <span className="text-slate-500 block text-[10px] font-bold">LOCALIZAÇÃO</span>
                <span className="font-black text-sky-800 text-xs">x: {currentLand.x}, z: {currentLand.z}</span>
              </div>
            </div>

            {/* Customization Options if Owned by Current Player */}
            {isMine && (
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <h5 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-2">
                  Personalizar Minha Propriedade:
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onAddConstruction(currentLand.id, 'fence', 'Cerca Branca');
                    }}
                    className="p-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 text-center cursor-pointer transition"
                  >
                    <span className="text-xl block">🪵</span>
                    Colocar Cercas
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onAddConstruction(currentLand.id, 'shed', 'Celeirozinho');
                    }}
                    className="p-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 text-center cursor-pointer transition"
                  >
                    <span className="text-xl block">🏚️</span>
                    Mini Celeiro
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onAddConstruction(currentLand.id, 'garden_bed', 'Canteiro Florido');
                    }}
                    className="p-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 text-center cursor-pointer transition"
                  >
                    <span className="text-xl block">🌻</span>
                    Flores & Canteiros
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      onAddConstruction(currentLand.id, 'lantern', 'Poste de Luz');
                    }}
                    className="p-2 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 text-center cursor-pointer transition"
                  >
                    <span className="text-xl block">🏮</span>
                    Poste / Lampião
                  </button>
                </div>
              </div>
            )}

            {/* Buy CTA */}
            {isAvailable && (
              <button
                onClick={() => {
                  if (canAfford) {
                    onBuyLand(currentLand.id);
                  }
                }}
                disabled={!canAfford}
                className={`w-full mt-3 py-3 rounded-2xl font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 ${
                  canAfford
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-xl'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                <span>COMPRAR ESTE TERRENO ({currentLand.price} 🪙)</span>
                <span>🏡</span>
              </button>
            )}

            {/* Walk to Land button */}
            <button
              onClick={() => {
                soundManager.playFootstep();
                onTeleportToLand(currentLand.x, currentLand.z);
                onClose();
              }}
              className="w-full mt-2 py-2 bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 text-emerald-900 font-extrabold text-xs rounded-xl cursor-pointer transition"
            >
              📍 Ir até a entrada deste terreno no mapa
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
