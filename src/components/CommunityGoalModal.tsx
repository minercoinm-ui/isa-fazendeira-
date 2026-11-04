import React from 'react';
import { CommunityGoal } from '../types/game';
import { soundManager } from '../audio/soundManager';

interface CommunityGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: CommunityGoal;
  onClaimCommunityReward: () => void;
  claimed: boolean;
}

export const CommunityGoalModal: React.FC<CommunityGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onClaimCommunityReward,
  claimed,
}) => {
  if (!isOpen) return null;

  const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const isDone = goal.current >= goal.target || goal.completed;

  const handleClaim = () => {
    onClaimCommunityReward();
  };

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

        <div className="text-center mb-4">
          <span className="text-4xl inline-block mb-1">🌽</span>
          <h3 className="text-2xl font-black text-amber-950">
            {goal.title}
          </h3>
          <p className="text-sm text-amber-800 font-semibold mt-1">
            Todos os fazendeiros conectados contribuem colhendo milho na fazendinha da Isa!
          </p>
        </div>

        {/* Live Progress Card */}
        <div className="bg-amber-50 border-3 border-amber-300 rounded-2xl p-4 shadow-inner mb-4">
          <div className="flex items-center justify-between text-sm font-black text-amber-950 mb-2">
            <span>Progresso da Comunidade:</span>
            <span>
              {goal.current} / {goal.target} Espigas ({percent}%)
            </span>
          </div>

          <div className="w-full bg-amber-200 rounded-full h-4 overflow-hidden p-0.5 border border-amber-400">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isDone
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>🎁 Recompensa Coletiva:</span>
            <span className="bg-amber-200 px-2.5 py-1 rounded-full text-amber-950 font-black">
              +{goal.rewardCoins} Moedas 🪙 +{goal.rewardXp} XP ⭐
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isDone && !claimed && (
          <button
            onClick={handleClaim}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-lg shadow-xl cursor-pointer animate-bounce"
          >
            🎉 Meta Concluída! Resgatar Recompensa!
          </button>
        )}

        {isDone && claimed && (
          <div className="text-center py-2 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-sm border border-emerald-300">
            ✅ Recompensa já resgatada por você! Parabéns a todos!
          </div>
        )}

        {!isDone && (
          <div className="text-center py-2 bg-amber-100 text-amber-900 rounded-xl font-bold text-xs border border-amber-300">
            Colha mais milho dourado na horta para avançar o objetivo coletivo!
          </div>
        )}
      </div>
    </div>
  );
};
