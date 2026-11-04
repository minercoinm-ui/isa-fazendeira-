import React, { useState } from 'react';
import { InventoryItem } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: Record<string, InventoryItem>;
  onSellItem: (itemId: string, count: number) => void;
  selectedSeed: string;
  onSelectSeed: (seedId: string) => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  inventory,
  onSellItem,
  selectedSeed,
  onSelectSeed,
}) => {
  const [activeTab, setActiveTab] = useState<'seeds' | 'crops' | 'products'>('seeds');

  if (!isOpen) return null;

  const items = Object.values(inventory);
  const seedItems = items.filter((i) => i.category === 'seed');
  const cropItems = items.filter((i) => i.category === 'crop');
  const productItems = items.filter((i) => i.category === 'product');

  const currentList =
    activeTab === 'seeds' ? seedItems : activeTab === 'crops' ? cropItems : productItems;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
      <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-amber-400 cursor-pointer"
        >
          ✕
        </button>

        <h3 className="text-2xl font-black text-amber-950 flex items-center gap-2 mb-4">
          <span>🎒</span> Mochila & Inventário
        </h3>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-4 border-b border-amber-200 pb-2">
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('seeds');
            }}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm cursor-pointer transition ${
              activeTab === 'seeds'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🌱 Sementes ({seedItems.reduce((acc, i) => acc + i.count, 0)})
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('crops');
            }}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm cursor-pointer transition ${
              activeTab === 'crops'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🌽 Colheitas ({cropItems.reduce((acc, i) => acc + i.count, 0)})
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setActiveTab('products');
            }}
            className={`px-3 py-1.5 rounded-xl font-extrabold text-xs sm:text-sm cursor-pointer transition ${
              activeTab === 'products'
                ? 'bg-amber-400 text-amber-950 shadow border-2 border-amber-600'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🥛 Produtos ({productItems.reduce((acc, i) => acc + i.count, 0)})
          </button>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto p-1">
          {currentList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-amber-800 font-bold text-sm">
              Nenhum item nesta categoria ainda. Vá à Loja ou colha na horta!
            </div>
          ) : (
            currentList.map((item) => {
              const isSelectedSeed = activeTab === 'seeds' && selectedSeed === item.id.replace('_seed', '');
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border-2 flex flex-col justify-between ${
                    isSelectedSeed
                      ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-300'
                      : 'bg-amber-50/60 border-amber-200'
                  }`}
                >
                  <div className="text-center mb-2">
                    <span className="text-4xl block mb-1">{item.icon}</span>
                    <h5 className="font-extrabold text-xs text-amber-950">{item.name}</h5>
                    <span className="text-xs font-black text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full inline-block mt-1">
                      Qtd: {item.count}
                    </span>
                  </div>

                  {activeTab === 'seeds' && (
                    <button
                      onClick={() => {
                        soundManager.playPop();
                        onSelectSeed(item.id.replace('_seed', ''));
                      }}
                      disabled={item.count <= 0}
                      className={`w-full py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                        isSelectedSeed
                          ? 'bg-emerald-600 text-white'
                          : item.count > 0
                          ? 'bg-amber-400 hover:bg-amber-500 text-amber-950'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isSelectedSeed ? 'Equipada 🌱' : 'Equipar'}
                    </button>
                  )}

                  {activeTab !== 'seeds' && (
                    <button
                      onClick={() => {
                        onSellItem(item.id, 1);
                      }}
                      disabled={item.count <= 0}
                      className="w-full py-1.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      Vender (+{item.value} 🪙)
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
