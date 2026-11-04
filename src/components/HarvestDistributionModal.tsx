import React, { useState, useEffect } from 'react';
import { CropInfo, CROPS_CATALOG, CropType } from '../types/game';
import { soundManager } from '../audio/soundManager';

export type HarvestMode = 'A' | 'B' | 'C';

export interface HarvestPreference {
  mode: HarvestMode;
  marketPercent: number;
  inventoryPercent: number;
  autoApply: boolean;
}

export const DEFAULT_HARVEST_PREFERENCE: HarvestPreference = {
  mode: 'C',
  marketPercent: 70,
  inventoryPercent: 30,
  autoApply: false,
};

const STORAGE_KEY = 'isa_farm_harvest_distribution_pref';

export function loadHarvestPreference(): HarvestPreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.mode === 'A' || parsed.mode === 'B' || parsed.mode === 'C')) {
        return {
          mode: parsed.mode,
          marketPercent: Math.max(0, Math.min(100, Number(parsed.marketPercent) || 70)),
          inventoryPercent: Math.max(0, Math.min(100, Number(parsed.inventoryPercent) || 30)),
          autoApply: !!parsed.autoApply,
        };
      }
    }
  } catch {
    // ignore
  }
  return DEFAULT_HARVEST_PREFERENCE;
}

export function saveHarvestPreference(pref: HarvestPreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  } catch {
    // ignore
  }
}

interface HarvestDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropType: CropType;
  totalYield: number;
  onConfirm: (pref: HarvestPreference) => void;
}

export const HarvestDistributionModal: React.FC<HarvestDistributionModalProps> = ({
  isOpen,
  onClose,
  cropType,
  totalYield,
  onConfirm,
}) => {
  const [pref, setPref] = useState<HarvestPreference>(loadHarvestPreference());
  const crop: CropInfo = CROPS_CATALOG[cropType] || CROPS_CATALOG.corn;

  useEffect(() => {
    if (isOpen) {
      setPref(loadHarvestPreference());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModeChange = (mode: HarvestMode) => {
    soundManager.playPop();
    if (mode === 'A') {
      setPref((prev) => ({ ...prev, mode: 'A', marketPercent: 100, inventoryPercent: 0 }));
    } else if (mode === 'B') {
      setPref((prev) => ({ ...prev, mode: 'B', marketPercent: 0, inventoryPercent: 100 }));
    } else {
      setPref((prev) => ({ ...prev, mode: 'C', marketPercent: 70, inventoryPercent: 30 }));
    }
  };

  const handleSliderChange = (marketPct: number) => {
    const clampedMarket = Math.max(0, Math.min(100, marketPct));
    setPref((prev) => ({
      ...prev,
      mode: 'C',
      marketPercent: clampedMarket,
      inventoryPercent: 100 - clampedMarket,
    }));
  };

  // Cálculo atômico sem perda e sem duplicação
  const marketUnits =
    pref.mode === 'A'
      ? totalYield
      : pref.mode === 'B'
      ? 0
      : Math.round(totalYield * (pref.marketPercent / 100));
  const inventoryUnits = totalYield - marketUnits;

  const handleExecute = () => {
    soundManager.playHarvest();
    saveHarvestPreference(pref);
    onConfirm(pref);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-amber-400 cursor-pointer transition"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-amber-200 mb-4">
          <span className="text-4xl p-2 bg-amber-100 rounded-2xl border-2 border-amber-300">
            {crop.icon}
          </span>
          <div>
            <span className="bg-amber-100 text-amber-900 font-black text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Planejamento da Produção
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-amber-950">
              Distribuição da Colheita
            </h3>
            <p className="text-xs text-amber-800 font-bold">
              {totalYield}x {crop.name} colhidos na roça da Isa
            </p>
          </div>
        </div>

        {/* 3 Opções de Distribuição */}
        <div className="space-y-2.5 mb-4">
          {/* OPÇÃO A */}
          <button
            type="button"
            onClick={() => handleModeChange('A')}
            className={`w-full text-left p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
              pref.mode === 'A'
                ? 'bg-amber-100/90 border-amber-500 shadow-md ring-2 ring-amber-400'
                : 'bg-stone-50 border-stone-200 hover:bg-amber-50'
            }`}
          >
            <span className="text-2xl p-1.5 bg-white rounded-xl border border-amber-300 shrink-0">
              🏪
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-950 text-sm">
                  Opção A — Abastecer Automaticamente
                </span>
                <span className="text-xs font-black text-amber-700 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                  100% Barraca
                </span>
              </div>
              <p className="text-xs text-stone-600 font-bold mt-0.5">
                Transfere toda a colheita para as prateleiras da sua barraca comercial para os clientes e NPCs comprarem.
              </p>
            </div>
          </button>

          {/* OPÇÃO B */}
          <button
            type="button"
            onClick={() => handleModeChange('B')}
            className={`w-full text-left p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
              pref.mode === 'B'
                ? 'bg-emerald-100/90 border-emerald-500 shadow-md ring-2 ring-emerald-400'
                : 'bg-stone-50 border-stone-200 hover:bg-emerald-50'
            }`}
          >
            <span className="text-2xl p-1.5 bg-white rounded-xl border border-emerald-300 shrink-0">
              🎒
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-black text-emerald-950 text-sm">
                  Opção B — Guardar no Inventário Pessoal
                </span>
                <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
                  100% Mochila
                </span>
              </div>
              <p className="text-xs text-stone-600 font-bold mt-0.5">
                Os produtos permanecem guardados na sua mochila particular para uso futuro ou alimentação dos animais.
              </p>
            </div>
          </button>

          {/* OPÇÃO C */}
          <div
            className={`w-full p-3.5 rounded-2xl border-2 transition ${
              pref.mode === 'C'
                ? 'bg-yellow-50 border-amber-500 shadow-md ring-2 ring-amber-400'
                : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div
              onClick={() => handleModeChange('C')}
              className="flex items-start gap-3 cursor-pointer"
            >
              <span className="text-2xl p-1.5 bg-white rounded-xl border border-amber-300 shrink-0">
                ⚖️
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-950 text-sm">
                    Opção C — Distribuir a Produção
                  </span>
                  <span className="text-xs font-black text-amber-800 bg-white px-2 py-0.5 rounded-full border border-amber-300">
                    {pref.marketPercent}% / {pref.inventoryPercent}%
                  </span>
                </div>
                <p className="text-xs text-stone-600 font-bold mt-0.5">
                  Divide os produtos colhidos entre a barraca e sua mochila na proporção desejada.
                </p>
              </div>
            </div>

            {pref.mode === 'C' && (
              <div className="mt-3 pt-3 border-t border-amber-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span>🏪 Barraca: {pref.marketPercent}%</span>
                  <span>🎒 Mochila: {pref.inventoryPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pref.marketPercent}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-amber-200 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Resumo da Distribuição desta Colheita */}
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 mb-4 flex items-center justify-around text-center">
          <div>
            <span className="text-xs font-black text-amber-800 uppercase block">Para a Barraca:</span>
            <span className="text-xl font-black text-amber-950 flex items-center justify-center gap-1">
              🏪 {marketUnits}x {crop.name}
            </span>
            <span className="text-[10px] text-amber-700 font-bold">
              a {crop.sellValue} 🪙 cada
            </span>
          </div>

          <div className="w-px h-8 bg-amber-300" />

          <div>
            <span className="text-xs font-black text-amber-800 uppercase block">Para a Mochila:</span>
            <span className="text-xl font-black text-amber-950 flex items-center justify-center gap-1">
              🎒 {inventoryUnits}x {crop.name}
            </span>
            <span className="text-[10px] text-amber-700 font-bold">
              Uso particular
            </span>
          </div>
        </div>

        {/* Checkbox para Lembrar Preferência */}
        <label className="flex items-center gap-2.5 text-xs text-amber-950 font-bold mb-4 cursor-pointer select-none bg-stone-50 p-2.5 rounded-xl border border-stone-200">
          <input
            type="checkbox"
            checked={pref.autoApply}
            onChange={(e) => setPref((prev) => ({ ...prev, autoApply: e.target.checked }))}
            className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
          />
          <span>
            Lembrar esta preferência e aplicar automaticamente nas próximas colheitas (pode ser alterada a qualquer momento).
          </span>
        </label>

        {/* Botão de Ação */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-2xl transition cursor-pointer text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExecute}
            className="flex-2 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-amber-950 font-black rounded-2xl shadow-lg transition cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            <span>🌾</span>
            <span>Confirmar e Colher</span>
          </button>
        </div>
      </div>
    </div>
  );
};
