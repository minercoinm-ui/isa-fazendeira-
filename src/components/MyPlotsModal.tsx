import React, { useState } from 'react';
import { FarmLand, FarmPlot, CropType, CROPS_CATALOG, InventoryItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface MyPlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ownedLands: FarmLand[];
  inventory: Record<string, InventoryItem>;
  selectedSeed: CropType;
  onSelectSeed: (seed: CropType) => void;
  onPlotAction: (landId: string, plotId: number, action: 'prepare' | 'plant' | 'water' | 'harvest', cropType?: CropType) => void;
  onAddConstruction: (landId: string, type: 'fence' | 'shed' | 'animal_pen' | 'garden_bed' | 'lantern', label: string) => void;
  onOpenCentralTalhoes: () => void;
}

export const MyPlotsModal: React.FC<MyPlotsModalProps> = ({
  isOpen,
  onClose,
  ownedLands,
  inventory,
  selectedSeed,
  onSelectSeed,
  onPlotAction,
  onAddConstruction,
  onOpenCentralTalhoes,
}) => {
  const [selectedLandId, setSelectedLandId] = useState<string>(ownedLands[0]?.id || '');

  if (!isOpen) return null;

  const currentLand = ownedLands.find((l) => l.id === selectedLandId) || ownedLands[0];

  const cropsList = Object.values(CROPS_CATALOG);

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

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-200 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl">🌾</span>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
                Meus Talhões Agrícolas
              </h3>
              <p className="text-xs text-amber-800 font-bold">
                Cultivo independente: are o solo, plante, regue e colha em suas propriedades
              </p>
            </div>
          </div>
        </div>

        {ownedLands.length === 0 ? (
          <div className="my-auto py-10 text-center space-y-3">
            <span className="text-5xl block mb-2">🚜</span>
            <h4 className="text-lg font-black text-amber-950">
              Você ainda não possui talhões de terra particulares!
            </h4>
            <p className="text-xs text-amber-800 max-w-md mx-auto font-bold">
              Visite a Central de Talhões para adquirir seu primeiro pedaço de terra rural e iniciar suas plantações independentes.
            </p>
            <button
              onClick={() => {
                soundManager.playPop();
                onOpenCentralTalhoes();
                onClose();
              }}
              className="mt-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black px-6 py-3 rounded-2xl shadow-lg cursor-pointer transition"
            >
              🗺️ Ir para a Central de Talhões
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Talhões Selector Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3 border-b border-amber-200">
              {ownedLands.map((land) => (
                <button
                  key={land.id}
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedLandId(land.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs cursor-pointer transition shrink-0 flex items-center gap-1.5 ${
                    land.id === currentLand?.id
                      ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <span>🏡</span>
                  <span>{land.code} — {land.name}</span>
                </button>
              ))}
            </div>

            {currentLand && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {/* Land summary banner */}
                <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-300 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-amber-950 text-sm block">
                      {currentLand.code} ({currentLand.categoryLabel})
                    </span>
                    <span className="text-amber-700 font-bold">
                      Área: {currentLand.areaM2} m² • Capacidade: {currentLand.plotsCount} canteiros
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        soundManager.playPlant();
                        onPlotAction(currentLand.id, 0, 'prepare');
                      }}
                      className="bg-amber-200 hover:bg-amber-300 text-amber-950 font-black px-3 py-1.5 rounded-xl border border-amber-400 cursor-pointer text-xs transition"
                    >
                      🚜 Arar / Preparar Terra
                    </button>
                  </div>
                </div>

                {/* Semente Ativa para Plantio */}
                <div>
                  <label className="block text-xs font-black uppercase text-amber-900 mb-1.5">
                    Escolha a Cultura para Plantar (9 Culturas Disponíveis):
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {cropsList.map((crop) => {
                      const isSelected = selectedSeed === crop.id;
                      const seedKey = `${crop.id}_seed`;
                      const stock = inventory[seedKey]?.count || 0;
                      return (
                        <button
                          key={crop.id}
                          onClick={() => {
                            soundManager.playPop();
                            onSelectSeed(crop.id);
                          }}
                          className={`p-2 rounded-xl text-center border-2 transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-300 border-amber-600 shadow-sm font-black'
                              : 'bg-white border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          <span className="text-2xl block mb-0.5">{crop.icon}</span>
                          <span className="text-xs font-bold text-amber-950 block truncate">{crop.name}</span>
                          <span className="text-[10px] text-amber-700 block font-black">
                            Qtd: {stock}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Canteiros de Plantio do Talhão */}
                <div>
                  <h5 className="text-xs font-black uppercase text-amber-900 mb-2">
                    Canteiros Agrícolas do Talhão:
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Array.from({ length: currentLand.plotsCount ?? 0 }).map((_, idx) => {
                      const plot = currentLand.plots?.find((p) => p.id === idx) || {
                        id: idx,
                        cropType: null,
                        plantedAt: null,
                        growthTime: 25,
                        watered: false,
                        stage: 0,
                      };

                      const hasCrop = !!plot.cropType;
                      const cropMeta = plot.cropType ? CROPS_CATALOG[plot.cropType] : null;

                      const stageLabel =
                        plot.stage >= 5
                          ? 'Pronto para Colheita! ✨'
                          : plot.stage === 4
                          ? (plot.watered ? 'Crescida (Estágio 4/5) 💧' : 'Crescida (Precisa de água!)')
                          : plot.stage === 3
                          ? (plot.watered ? 'Desenvolvendo (Estágio 3/5) 💧' : 'Desenvolvendo (Precisa de água!)')
                          : plot.stage === 2
                          ? (plot.watered ? 'Broto inicial (Estágio 2/5) 💧' : 'Broto inicial (Precisa de água!)')
                          : plot.stage === 1
                          ? (plot.watered ? 'Semente plantada (Estágio 1/5) 💧' : 'Semente (Precisa de água!)')
                          : 'Vazio';

                      const stageIcon =
                        plot.stage >= 5 && cropMeta
                          ? cropMeta.icon
                          : plot.stage === 4
                          ? '🪴'
                          : plot.stage === 3
                          ? '🌾'
                          : plot.stage === 2
                          ? '🌿'
                          : plot.stage === 1
                          ? '🌱'
                          : '🟤';

                      return (
                        <div
                          key={idx}
                          className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-2.5 flex flex-col justify-between text-center"
                        >
                          <span className="text-[10px] font-black uppercase text-amber-800 block">
                            Canteiro #{idx + 1}
                          </span>

                          <div className="my-1.5">
                            <span className="text-3xl block mb-0.5">
                              {stageIcon}
                            </span>
                            <span className="text-xs font-black text-amber-950 block truncate">
                              {cropMeta ? cropMeta.name : 'Terra Fértil'}
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold block">
                              {stageLabel}
                            </span>
                          </div>

                          <div className="space-y-1 mt-1">
                            {plot.stage === 0 && (
                              <button
                                onClick={() => {
                                  soundManager.playPlant();
                                  onPlotAction(currentLand.id, idx, 'plant', selectedSeed);
                                }}
                                className="w-full py-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-lg shadow cursor-pointer transition"
                              >
                                Plantar {CROPS_CATALOG[selectedSeed]?.name.split(' ')[0]}
                              </button>
                            )}

                            {plot.stage > 0 && plot.stage < 5 && !plot.watered && (
                              <button
                                onClick={() => {
                                  soundManager.playWater();
                                  onPlotAction(currentLand.id, idx, 'water');
                                }}
                                className="w-full py-1 bg-sky-500 hover:bg-sky-600 text-white font-black text-xs rounded-lg shadow cursor-pointer transition"
                              >
                                Regar 💧
                              </button>
                            )}

                            {plot.stage >= 5 && (
                              <button
                                onClick={() => {
                                  soundManager.playHarvest();
                                  soundManager.playCoin();
                                  onPlotAction(currentLand.id, idx, 'harvest');
                                }}
                                className="w-full py-1 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-lg shadow cursor-pointer transition animate-pulse"
                              >
                                Colher ✨
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Personalização & Construções */}
                <div className="pt-2 border-t border-amber-200">
                  <h5 className="text-xs font-black uppercase text-amber-900 mb-1.5">
                    Estruturas e Melhorias do Talhão:
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onAddConstruction(currentLand.id, 'fence', 'Cerca Rústica');
                      }}
                      className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 text-center cursor-pointer transition"
                    >
                      <span className="text-lg block">🪵</span>
                      Cercas
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onAddConstruction(currentLand.id, 'shed', 'Celeirozinho');
                      }}
                      className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 text-center cursor-pointer transition"
                    >
                      <span className="text-lg block">🏚️</span>
                      Mini Celeiro
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onAddConstruction(currentLand.id, 'garden_bed', 'Flores Campestres');
                      }}
                      className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 text-center cursor-pointer transition"
                    >
                      <span className="text-lg block">🌻</span>
                      Canteiro Florido
                    </button>
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onAddConstruction(currentLand.id, 'lantern', 'Lampião Solar');
                      }}
                      className="p-2 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 text-center cursor-pointer transition"
                    >
                      <span className="text-lg block">🏮</span>
                      Lampião
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
