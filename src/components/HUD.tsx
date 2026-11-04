import React, { useMemo, useState } from 'react';
import { PlayerProfile, CommunityGoal, IsaMission, CropType } from '../types/game';
import { InteractionTarget } from '../game/GameEngine';
import { VirtualJoystick } from './VirtualJoystick';
import { soundManager } from '../audio/soundManager';
import { IsaReactionBanner } from './IsaReactionBanner';
import isaImg from '../assets/isa_portrait.jpg';
import type { IsaAssistantDiagnosis } from '../services/isaAssistantService';
import type { DayNightAtmosphere } from '../game/dayNightCycle';

interface HUDProps {
  player: PlayerProfile;
  communityGoal: CommunityGoal;
  activeMission?: IsaMission;
  isaDiagnosis?: IsaAssistantDiagnosis;
  interactionTarget: InteractionTarget | null;
  selectedSeed?: CropType;
  onSelectSeed?: (crop: CropType) => void;
  onInteract: () => void;
  onOpenInventory: () => void;
  onOpenShop: () => void;
  onOpenExpandFarm?: () => void;
  onOpenMarket: (tab?: 'orders' | 'buy' | 'sell' | 'create') => void;
  onOpenOrders: () => void;
  onOpenLands: () => void;
  onOpenCentralTalhoes?: () => void;
  onOpenMyPlots: () => void;
  onOpenHarvestConfig?: () => void;
  onOpenMyFarm: () => void;
  onOpenAvatarCustomizer: () => void;
  onOpenCommunityGoal: () => void;
  onOpenChat: () => void;
  onOpenIsaDialogue: () => void;
  onOpenAdmin: () => void;
  onJoystickMove: (vector: { x: number; y: number }) => void;
  playersOnlineCount: number;
  onlinePlayerNames: string[];
  isMuted: boolean;
  onToggleMute: () => void;
  floatingAlert?: string | null;
  isaSubtitles?: { text: string; animation: any } | null;
  onDismissSubtitles?: () => void;
  atmosphere?: DayNightAtmosphere;
  simulatedHour?: number | null;
  onSetSimulatedHour?: (hour: number | null) => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  communityGoal,
  activeMission,
  isaDiagnosis,
  interactionTarget,
  selectedSeed,
  onSelectSeed,
  onInteract,
  onOpenInventory,
  onOpenShop,
  onOpenExpandFarm,
  onOpenMarket,
  onOpenOrders,
  onOpenLands,
  onOpenCentralTalhoes,
  onOpenMyPlots,
  onOpenHarvestConfig,
  onOpenMyFarm,
  onOpenAvatarCustomizer,
  onOpenCommunityGoal,
  onOpenChat,
  onOpenIsaDialogue,
  onOpenAdmin,
  onJoystickMove,
  playersOnlineCount,
  onlinePlayerNames,
  isMuted,
  onToggleMute,
  floatingAlert,
  isaSubtitles,
  onDismissSubtitles,
  atmosphere,
  simulatedHour,
  onSetSimulatedHour,
}) => {
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [showPlayersList, setShowPlayersList] = useState(false);
  const [showTimePanel, setShowTimePanel] = useState(false);
  const [coinDelta, setCoinDelta] = useState<number | null>(null);
  const [isCoinBouncing, setIsCoinBouncing] = useState(false);
  const prevCoinsRef = React.useRef(player.coins);

  React.useEffect(() => {
    if (player.coins > prevCoinsRef.current) {
      const diff = player.coins - prevCoinsRef.current;
      setCoinDelta(diff);
      setIsCoinBouncing(true);
      const timer = setTimeout(() => {
        setIsCoinBouncing(false);
        setCoinDelta(null);
      }, 1500);
      prevCoinsRef.current = player.coins;
      return () => clearTimeout(timer);
    } else {
      prevCoinsRef.current = player.coins;
    }
  }, [player.coins]);

  const xpPercent = Math.min(100, Math.round((player.xp / player.nextLevelXp) * 100));

  const availableSeeds = useMemo(() => {
    return Object.entries(player.inventory)
      .filter(([key, item]) => key.endsWith('_seed') && (item?.count || 0) > 0)
      .map(([key, item]) => {
        const crop = key.replace('_seed', '') as CropType;
        return {
          id: key,
          cropType: crop,
          name: item.name,
          icon: item.icon,
          count: item.count,
        };
      });
  }, [player.inventory]);

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-3 md:p-5 z-20 overflow-hidden font-['Nunito',sans-serif]">
      {/* 1. TOP CLUSTER */}
      <div className="w-full flex items-start justify-between gap-2 pointer-events-none">
        {/* Left: Player Profile & Level */}
        <div className="flex items-center gap-3 bg-white/95 px-3.5 py-2 rounded-2xl shadow-lg border-2 border-amber-300 pointer-events-auto">
          <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-2xl border-2 border-white shadow-sm shrink-0">
            {player.avatar === 'leo' ? '👦' : player.avatar === 'nina' ? '👧' : player.avatar === 'theo' ? '🧢' : '🌸'}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-950 text-sm">{player.nickname}</span>
              <span className="bg-amber-500 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-xs">
                Nv. {player.level}
              </span>
            </div>

            {/* XP Bar */}
            <div className="w-24 sm:w-32 bg-amber-200 rounded-full h-2 mt-1 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-700 font-bold tabular-nums">
              {player.xp}/{player.nextLevelXp} XP
            </span>
          </div>
        </div>

        {/* Center: Ações Rápidas Fixas e Isa */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* 1. Ícone Fixo: LOJA DE SEMENTES */}
          <button
            onClick={() => {
              soundManager.playPop();
              onOpenShop();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl shadow-md border-2 border-amber-400 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs cursor-pointer transition transform active:scale-95 shrink-0"
            title="Abrir Loja de Sementes"
          >
            <span className="text-base sm:text-lg">🌱</span>
            <span className="hidden md:inline">LOJA DE SEMENTES</span>
            <span className="md:hidden">SEMENTES</span>
          </button>

          {/* 2. Ícone Fixo: EXPANDIR HORTA */}
          <button
            onClick={() => {
              soundManager.playPop();
              onOpenExpandFarm?.();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl shadow-md border-2 border-emerald-400 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs cursor-pointer transition transform active:scale-95 shrink-0"
            title="Expandir Horta com Novos Canteiros"
          >
            <span className="text-base sm:text-lg">🚜</span>
            <span className="hidden md:inline">EXPANDIR HORTA</span>
            <span className="md:hidden">EXPANDIR</span>
          </button>

          {/* Center: Isa & Missão Simples */}
          <button
            onClick={() => {
              soundManager.playPop();
              onOpenIsaDialogue();
            }}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-sm border border-amber-300 bg-white/95 text-amber-950 cursor-pointer transition transform active:scale-95 max-w-xs hover:bg-amber-50"
            title="Falar com a Isa"
          >
            <img
              src={isaImg}
              alt="Isa"
              className="w-7 h-7 rounded-full border border-amber-400 object-cover shrink-0 shadow-xs"
            />
            <div className="text-left overflow-hidden">
              <span className="text-xs font-bold text-amber-950 truncate block">
                {activeMission
                  ? `${activeMission.title} (${activeMission.currentCount}/${activeMission.requiredCount})`
                  : 'Falar com a Isa'}
              </span>
            </div>
          </button>
        </div>

        {/* Right: Coins & Online Counter */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Coins Pill */}
          <div
            className={`relative flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-2xl shadow-lg border-2 transition-all duration-300 text-amber-950 font-black text-sm ${
              isCoinBouncing
                ? 'border-yellow-400 bg-yellow-100 scale-110 shadow-yellow-300/50 shadow-xl'
                : 'border-amber-300'
            }`}
          >
            <span className={`text-lg transition-transform ${isCoinBouncing ? 'animate-bounce' : ''}`}>🪙</span>
            <span className="tabular-nums">{player.coins}</span>
            {coinDelta !== null && (
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-yellow-500 text-white font-extrabold text-[11px] px-2 py-0.5 rounded-full shadow-md animate-pulse whitespace-nowrap">
                +{coinDelta}
              </span>
            )}
          </div>

          {/* Online Players Pill */}
          <button
            onClick={() => {
              soundManager.playPop();
              setShowPlayersList(!showPlayersList);
              setShowTimePanel(false);
            }}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-2xl shadow-lg border-2 border-emerald-300 font-extrabold text-xs cursor-pointer transition"
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="tabular-nums">{playersOnlineCount}</span>
            <span className="hidden md:inline">Online</span>
          </button>

          {/* ☀️ Ciclo Dia/Noite */}
          {atmosphere && (
            <button
              onClick={() => {
                soundManager.playPop();
                setShowTimePanel(!showTimePanel);
                setShowPlayersList(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl shadow-md border font-black text-xs cursor-pointer transition transform active:scale-95 ${
                atmosphere.isNight
                  ? 'bg-indigo-950/90 text-amber-200 border-indigo-400 hover:bg-indigo-900'
                  : 'bg-white/95 text-amber-950 border-amber-300 hover:bg-amber-100'
              }`}
              title="Ciclo Dia e Noite"
            >
              <span className="text-sm">{atmosphere.phaseIcon}</span>
              <span className="tabular-nums">{atmosphere.formattedTime}</span>
            </button>
          )}
        </div>
      </div>

      {/* Online Players Dropdown Popup */}
      {showPlayersList && (
        <div className="absolute top-16 right-4 bg-white/95 border-3 border-emerald-400 rounded-2xl p-3 shadow-xl pointer-events-auto w-52 z-30">
          <div className="flex items-center justify-between pb-1 border-b border-emerald-200 mb-2">
            <span className="text-xs font-black text-emerald-950">Fazendeiros Conectados:</span>
            <button
              onClick={() => setShowPlayersList(false)}
              className="text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1.5 text-xs text-emerald-900 font-bold max-h-40 overflow-y-auto">
            <div className="flex items-center gap-1.5 text-amber-800">
              <span>⭐</span>
              <span>Isa (Anfitriã)</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700">
              <span>👤</span>
              <span>{player.nickname} (Você)</span>
            </div>
            {onlinePlayerNames.map((name, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span>🌱</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ☀️ Painel do Ciclo Dinâmico Dia & Noite */}
      {showTimePanel && atmosphere && (
        <div className="absolute top-16 right-4 bg-white/98 border-3 border-amber-400 rounded-3xl p-4 shadow-2xl pointer-events-auto w-80 sm:w-96 z-40 backdrop-blur-md">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-amber-200 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{atmosphere.phaseIcon}</span>
              <div>
                <h4 className="text-sm font-black text-amber-950 leading-tight">Ciclo de Iluminação 24h</h4>
                <p className="text-[11px] font-bold text-amber-700">
                  {simulatedHour !== null ? 'Modo de Pré-visualização' : 'Sincronizado com Horário Real'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTimePanel(false)}
              className="w-7 h-7 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 font-black text-xs flex items-center justify-center transition"
            >
              ✕
            </button>
          </div>

          {/* Cartão de Visão da Atmosfera Atual */}
          <div
            className={`p-3 rounded-2xl border-2 mb-3 transition-colors ${
              atmosphere.isNight
                ? 'bg-indigo-950 text-indigo-100 border-indigo-700'
                : 'bg-amber-50 text-amber-950 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-black tracking-wide uppercase opacity-75">
                {atmosphere.phaseLabel}
              </span>
              <span className="text-lg font-black tabular-nums">{atmosphere.formattedTime}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-bold opacity-90">
              <div className="flex items-center gap-1">
                <span>{atmosphere.isNight ? '🌙' : '☀️'}</span>
                <span>{atmosphere.isNight ? 'Lua & Céu Escuro' : 'Sol da Fazenda'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🏮</span>
                <span>{atmosphere.isNight ? 'Lampiões Acessos' : 'Lampiões em Repouso'}</span>
              </div>
            </div>
          </div>

          {/* Botão de Horário Real (Automático) */}
          <div className="mb-3">
            <button
              onClick={() => {
                soundManager.playPop();
                onSetSimulatedHour?.(null);
              }}
              className={`w-full py-2 px-3 rounded-2xl text-xs font-black border-2 transition flex items-center justify-center gap-2 ${
                simulatedHour === null
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 border-gray-300'
              }`}
            >
              <span>⏱️</span>
              <span>Modo Horário Real (Automático)</span>
              {simulatedHour === null && <span className="text-[10px] bg-white text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">Ativo</span>}
            </button>
          </div>

          {/* Atalhos de Fases do Dia */}
          <div className="mb-3">
            <span className="text-[11px] font-extrabold text-amber-900 block mb-1.5">
              Pré-visualizar Período do Dia:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: 'Amanhecer', icon: '🌅', hour: 6.0 },
                { label: 'Dia Ensolarado', icon: '☀️', hour: 12.0 },
                { label: 'Pôr do Sol', icon: '🌇', hour: 18.0 },
                { label: 'Noite Estrelada', icon: '🌙', hour: 22.5 },
              ].map((preset) => {
                const isActive = simulatedHour != null && Math.abs(simulatedHour - preset.hour) < 0.3;
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      soundManager.playPop();
                      onSetSimulatedHour?.(preset.hour);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black border-2 transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    <span>{preset.icon}</span>
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider de Horário Contínuo (0 a 24h) */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-extrabold text-amber-950 mb-1">
              <span>Ajuste Manual Livre (0h às 24h):</span>
              <span className="font-black text-amber-700 tabular-nums">
                {atmosphere.formattedTime}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="0.25"
              value={simulatedHour !== null ? simulatedHour : atmosphere.hour}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onSetSimulatedHour?.(val);
              }}
              className="w-full accent-amber-600 cursor-pointer h-2 bg-amber-200 rounded-lg"
            />
            <div className="flex justify-between text-[9px] font-bold text-amber-700/80 mt-1">
              <span>00:00 (Noite)</span>
              <span>06:00 (Alva)</span>
              <span>12:00 (Sol)</span>
              <span>18:00 (Tarde)</span>
              <span>24:00</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. FLOATING ALERT */}
      {floatingAlert && (
        <div className="self-center bg-amber-950/90 text-white font-bold text-xs px-4 py-1.5 rounded-full shadow-lg border border-amber-400/40 backdrop-blur-md pointer-events-none transition-all">
          {floatingAlert}
        </div>
      )}

      {/* 3. CONTEXTUAL PROMPT / INTERACTION BUTTON (Center Lower) */}
      {interactionTarget && (
        <div className="self-center flex flex-col items-center gap-2 mb-2 pointer-events-auto">
          {/* Barra rápida de seleção de sementes ao aproximar-se de talhão de plantio */}
          {interactionTarget.type === 'plot' && interactionTarget.label.includes('Plantar') && availableSeeds.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/95 px-3 py-1.5 rounded-2xl shadow-xl border-2 border-amber-400 max-w-[90vw] overflow-x-auto">
              <span className="text-[10px] font-black uppercase text-amber-900 mr-1 whitespace-nowrap">🌱 Semente:</span>
              {availableSeeds.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    soundManager.playPop();
                    onSelectSeed?.(s.cropType);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shrink-0 ${
                    selectedSeed === s.cropType
                      ? 'bg-amber-500 text-white shadow ring-2 ring-amber-300 font-black'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950'
                  }`}
                  title={`Equipar ${s.name} (${s.count} disponíveis)`}
                >
                  <span className="text-base">{s.icon}</span>
                  <span className="font-extrabold">{s.count}x</span>
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              soundManager.playPop();
              onInteract();
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black text-sm sm:text-base px-5 py-2.5 rounded-2xl shadow-xl border-2 border-white transform active:scale-95 transition cursor-pointer"
          >
            <span className="text-xl">{interactionTarget.icon}</span>
            <span>{interactionTarget.label}</span>
            <span className="text-[11px] bg-amber-950/80 text-white px-1.5 py-0.5 rounded-md ml-1 font-bold hidden sm:inline">
              [E]
            </span>
          </button>
        </div>
      )}

      {/* 4. BOTTOM CONTROLS & DOCK */}
      <div className="w-full flex items-end justify-between pointer-events-none">
        {/* Left: Mobile Touch Virtual Joystick */}
        <div className="pointer-events-auto pb-1">
          <VirtualJoystick onMove={onJoystickMove} />
        </div>

        {/* Center: Unified Collapsible Glass Control Dock */}
        <div className="flex flex-col items-center pointer-events-auto">
          {/* Dock Collapse / Expand Toggle */}
          <button
            onClick={() => {
              soundManager.playPop();
              setIsDockCollapsed(!isDockCollapsed);
            }}
            className="bg-amber-200/95 hover:bg-amber-300 text-amber-950 text-[11px] font-black px-3 py-1 rounded-t-xl border-t border-x border-amber-400 shadow cursor-pointer mb-[-1px] transition"
          >
            {isDockCollapsed ? '▴ Abrir Menu' : '▾ Esconder Menu'}
          </button>

          {!isDockCollapsed && (
            <div className="flex items-center gap-1 sm:gap-1.5 bg-white/95 px-2.5 py-2 rounded-2xl shadow-xl border-3 border-amber-400 max-w-[85vw] sm:max-w-none overflow-x-auto">
              {/* Minha Fazenda */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenMyFarm();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Minha Fazenda Principal"
              >
                <span className="text-xl">🏡</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Fazenda</span>
              </button>

              {/* Meus Talhões */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenMyPlots();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-200 text-emerald-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Gerenciar Meus Talhões Agrícolas"
              >
                <span className="text-xl">🌾</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Talhões</span>
              </button>

              {/* Distribuição da Colheita (Opções A, B, C) */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenHarvestConfig?.();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Configurar Distribuição da Colheita (Opção A: Barraca, B: Mochila, C: Distribuição %)"
              >
                <span className="text-xl">⚖️</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Colheita</span>
              </button>

              {/* Mercado */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenMarket('buy');
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Mercado & Feira"
              >
                <span className="text-xl">🏪</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Mercado</span>
              </button>

              {/* Pedidos dos Compradores */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenOrders();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-yellow-50 hover:bg-yellow-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0 relative"
                title="Pedidos de Compradores (NPCs)"
              >
                <span className="text-xl">📋</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Pedidos</span>
                <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </button>

              {/* Mochila */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenInventory();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Mochila e Inventário"
              >
                <span className="text-xl">🎒</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Mochila</span>
              </button>

              {/* Loja de Sementes */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenShop();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Abrir Loja de Sementes"
              >
                <span className="text-xl">🌱</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Sementes</span>
              </button>

              {/* Expandir Horta */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenExpandFarm?.();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Expandir Horta da Fazenda"
              >
                <span className="text-xl">🚜</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Expandir</span>
              </button>

              {/* Comprar Talhões (Central de Talhões) */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenCentralTalhoes?.();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Central de Talhões: Comprar novos lotes"
              >
                <span className="text-xl">🗺️</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Terras</span>
              </button>

              {/* Missões / Isa Administradora */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenIsaDialogue();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-pink-100 hover:bg-pink-200 text-pink-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0 relative"
                title="Isa Administradora: Missões, Estoque e Recomendações"
              >
                <span className="text-xl">⭐</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Isa</span>
                {isaDiagnosis?.overallStatus === 'critical_stockout' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 border-2 border-white animate-ping" />
                )}
                {isaDiagnosis?.overallStatus === 'attention_needed' && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" />
                )}
              </button>

              {/* Personalizar Avatar */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenAvatarCustomizer();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-blue-50 hover:bg-blue-200 text-blue-950 font-bold text-xs transition cursor-pointer min-w-12 sm:min-w-14 shrink-0"
                title="Trocar Avatar 3D (12 Personagens)"
              >
                <span className="text-xl">👤</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Avatar</span>
              </button>

              {/* Meta Coletiva */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenCommunityGoal();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-11 sm:min-w-12 shrink-0 relative"
                title="Meta Coletiva da Fazendinha"
              >
                <span className="text-xl">🌽</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Meta</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              </button>

              {/* Chat */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onOpenChat();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-11 sm:min-w-12 shrink-0"
                title="Chat Rápido Multiplayer"
              >
                <span className="text-xl">💬</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Falar</span>
              </button>

              {/* Som / Voz */}
              <button
                onClick={() => {
                  soundManager.playPop();
                  onToggleMute();
                }}
                className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-amber-50 hover:bg-amber-200 text-amber-950 font-bold text-xs transition cursor-pointer min-w-11 sm:min-w-12 shrink-0"
                title={isMuted ? 'Áudio desativado (clique para ativar voz e efeitos)' : 'Áudio e Voz ativados'}
              >
                <span className="text-xl">{isMuted ? '🔇' : '🔊'}</span>
                <span className="text-[10px] sm:text-[11px] whitespace-nowrap">{isMuted ? 'Mudo' : 'Som/Voz'}</span>
              </button>

              {/* PAINEL ADMIN: EXCLUSIVO DA PROPRIETÁRIA ISA (Nenhum jogador comum visualiza este botão) */}
              {player.role === 'isa_owner' && (
                <button
                  onClick={() => {
                    soundManager.playPop();
                    onOpenAdmin();
                  }}
                  className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-950 font-black text-xs transition cursor-pointer min-w-12 border-2 border-purple-400 animate-pulse shrink-0"
                  title="Painel Exclusivo da ISA (Proprietária Oficial)"
                >
                  <span className="text-xl">👑</span>
                  <span className="text-[10px] sm:text-[11px] whitespace-nowrap">Admin</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Big Action Button on Mobile */}
        <div className="pointer-events-auto pb-1">
          <button
            onClick={() => {
              soundManager.playPop();
              onInteract();
            }}
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 active:scale-95 text-amber-950 font-black shadow-2xl border-4 border-white flex flex-col items-center justify-center transition cursor-pointer"
          >
            <span className="text-2xl">{interactionTarget ? interactionTarget.icon : '🌾'}</span>
            <span className="text-[10px] font-extrabold uppercase mt-0.5">Ação</span>
          </button>
        </div>
      </div>
    </div>
  );
};
