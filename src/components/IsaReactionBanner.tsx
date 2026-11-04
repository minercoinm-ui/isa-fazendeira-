import React from 'react';
import isaImg from '../assets/isa_portrait.jpg';
import { IsaAnimationState } from '../types/game';

interface IsaReactionBannerProps {
  speech: string | null;
  animationState: IsaAnimationState;
  onDismiss: () => void;
}

export const IsaReactionBanner: React.FC<IsaReactionBannerProps> = ({
  speech,
  animationState,
  onDismiss,
}) => {
  if (!speech) return null;

  const stateLabels: Record<IsaAnimationState, { label: string; icon: string }> = {
    idle: { label: 'Falando com Carinho', icon: '🌻' },
    laughing: { label: 'Rindo de Alegria', icon: '😄' },
    jumping: { label: 'Pulando de Felicidade!', icon: '🦘' },
    clapping: { label: 'Batendo Palmas!', icon: '👏' },
    dancing: { label: 'Dançando na Fazenda!', icon: '💃' },
    waving: { label: 'Acenando para Você!', icon: '👋' },
    cheering: { label: 'Comemorando Conquista!', icon: '🎉' },
    surprised: { label: 'Ficou Maravilhada!', icon: '✨' },
    thanking: { label: 'Agradecendo com Amor!', icon: '❤️' },
  };

  const currentBadge = stateLabels[animationState] || stateLabels.idle;

  return (
    <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-40 max-w-lg w-[92vw] pointer-events-auto font-['Nunito',sans-serif] animate-in slide-in-from-top-4 duration-200">
      <div className="bg-white/95 border-3 border-pink-400 rounded-3xl p-3.5 shadow-2xl flex items-center gap-3 relative">
        <button
          onClick={onDismiss}
          className="absolute -top-2 -right-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-black shadow border border-white cursor-pointer"
        >
          ✕
        </button>

        {/* Isa Avatar */}
        <div className="relative shrink-0">
          <img
            src={isaImg}
            alt="Isa"
            className="w-14 h-14 rounded-full border-3 border-pink-400 shadow-md object-cover"
          />
          <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-black px-1.5 py-0.2 rounded-full border border-white shadow">
            ISA ⭐
          </span>
        </div>

        {/* Speech content & emotion tag */}
        <div className="flex-1 overflow-hidden pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs">{currentBadge.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-wider text-pink-700">
              Isa {currentBadge.label}
            </span>
          </div>

          <p className="text-sm font-black text-pink-950 leading-snug">
            &quot;{speech}&quot;
          </p>
        </div>
      </div>
    </div>
  );
};
