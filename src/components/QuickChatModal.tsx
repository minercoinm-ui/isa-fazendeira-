import React from 'react';
import { PRESET_CHAT_MESSAGES } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface QuickChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => void;
}

export const QuickChatModal: React.FC<QuickChatModalProps> = ({
  isOpen,
  onClose,
  onSendMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
      <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-md w-full p-5 shadow-2xl relative">
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-amber-400 cursor-pointer"
        >
          ✕
        </button>

        <h3 className="text-xl font-black text-amber-950 flex items-center gap-2 mb-3">
          <span>💬</span> Mensagens Rápidas
        </h3>

        <p className="text-xs text-amber-800 font-semibold mb-3">
          Clique em uma mensagem para falar com os outros jogadores na fazenda:
        </p>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {PRESET_CHAT_MESSAGES.map((msg, idx) => (
            <button
              key={idx}
              onClick={() => {
                soundManager.playIsaHello();
                onSendMessage(msg);
                onClose();
              }}
              className="w-full text-left p-3 rounded-2xl bg-amber-50 hover:bg-amber-200/80 border-2 border-amber-200 hover:border-amber-400 text-sm font-bold text-amber-950 transition cursor-pointer flex items-center justify-between"
            >
              <span>{msg}</span>
              <span className="text-amber-500 font-black text-xs">Falar 📢</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
