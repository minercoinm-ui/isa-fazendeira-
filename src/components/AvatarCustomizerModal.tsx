import React, { useState } from 'react';
import { AVATAR_CATALOG, AvatarDefinition } from '../types/game';
import { soundManager } from '../audio/soundManager';
import { Avatar3DPreview } from './Avatar3DPreview';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSelectAvatar: (avatarId: string) => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSelectAvatar,
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentAvatar);

  if (!isOpen) return null;

  const currentDef: AvatarDefinition =
    AVATAR_CATALOG.find((a) => a.id === selectedId) || AVATAR_CATALOG[0];

  const handleConfirm = () => {
    soundManager.playLevelUp();
    onSelectAvatar(selectedId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
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
        <div className="flex items-center gap-3 pb-3 border-b border-amber-200 mb-3">
          <span className="text-3xl sm:text-4xl">👤</span>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-amber-950 flex items-center gap-2">
              Personalizar Personagem 3D
            </h3>
            <p className="text-xs text-amber-800 font-bold">
              Escolha entre os 12 avatares oficiais e gire o modelo em 360° para conferir o visual!
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3 overflow-hidden items-center">
          {/* Left: 12 Avatars Grid */}
          <div className="sm:col-span-7 grid grid-cols-3 gap-2 overflow-y-auto pr-1 max-h-72">
            {AVATAR_CATALOG.map((av) => {
              const isSelected = selectedId === av.id;
              return (
                <button
                  key={av.id}
                  onClick={() => {
                    soundManager.playPop();
                    setSelectedId(av.id);
                  }}
                  className={`p-2.5 rounded-2xl border-2 transition cursor-pointer text-center flex flex-col items-center ${
                    isSelected
                      ? 'bg-amber-300 border-amber-600 shadow font-black scale-102'
                      : 'bg-amber-50/70 border-amber-200 hover:border-amber-400 hover:bg-amber-100'
                  }`}
                >
                  <span className="text-2xl mb-0.5">{av.icon}</span>
                  <span className="text-xs font-bold text-amber-950 truncate w-full">{av.name}</span>
                  <span className="text-[10px] text-amber-700 truncate w-full">{av.title.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Right: 3D Rotatable Preview */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-amber-200/60 rounded-3xl border-2 border-amber-300 p-3 shadow-inner">
            <Avatar3DPreview avatarId={selectedId} width={200} height={220} />
            <div className="text-center mt-1">
              <span className="text-sm font-black text-amber-950 block">
                {currentDef.name} — {currentDef.title}
              </span>
              <p className="text-[11px] text-amber-800 font-bold max-w-[200px] mx-auto mt-0.5">
                {currentDef.desc}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-amber-200 mt-3 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              soundManager.playPop();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-black text-xs hover:bg-gray-100 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-sm rounded-2xl shadow-lg cursor-pointer transition flex items-center justify-center gap-2"
          >
            <span>Salvar este Personagem 3D</span>
            <span>✅</span>
          </button>
        </div>
      </div>
    </div>
  );
};
