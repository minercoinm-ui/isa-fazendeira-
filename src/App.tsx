/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { HUD } from './components/HUD';
import { IsaDialogueModal } from './components/IsaDialogueModal';
import { InventoryModal } from './components/InventoryModal';
import { ShopModal } from './components/ShopModal';
import { MarketModal } from './components/MarketModal';
import { LandMarketModal } from './components/LandMarketModal';
import { IsaReactionBanner } from './components/IsaReactionBanner';
import { CommunityGoalModal } from './components/CommunityGoalModal';
import { QuickChatModal } from './components/QuickChatModal';
import { AdminModal } from './components/AdminModal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { ExpandFarmModal } from './components/ExpandFarmModal';
import { GameEngine, InteractionTarget } from './game/GameEngine';
import {
  DayNightAtmosphere,
  calculateAtmosphereForHour,
  getRealWorldDecimalHour,
} from './game/dayNightCycle';
import { soundManager } from './audio/soundManager';
import { isaVoiceManager } from './audio/isaVoiceManager';
import { isaAssistantService } from './services/isaAssistantService';
import { networkManager } from './services/networkManager';
import { supabase } from './services/supabase';
import {
  ensureAndLoadMarketState,
  mapInventoryFromMarketState,
  mapLandsFromMarketState,
  mapListingsFromMarketState,
  mapPlotsFromMarketState,
  calculatePlotStage,
  performMarketFarmAction,
  purchaseMarketFeed,
  purchaseMarketListing,
  purchaseMarketSeed,
  restockMarketProduct,
  addSeedsToInventoryInSupabase,
  addLocalCoins,
  updateLocalCoins,
  loadHarvestPreferenceFromSupabase,
  saveHarvestPreferenceToSupabase,
  type MarketStateSnapshot,
} from './services/marketState';
import {
  HarvestDistributionModal,
  loadHarvestPreference,
  saveHarvestPreference,
  type HarvestPreference,
} from './components/HarvestDistributionModal';
import {
  PlayerProfile,
  FarmPlot,
  FarmLand,
  MarketListing,
  ProductId,
  AVATAR_CATALOG,
  CommunityGoal,
  IsaMission,
  CropType,
  CROPS_CATALOG,
  MARKET_PRODUCT_INFO,
  RemotePlayer,
  IsaAnimationState,
  FarmExpansionPackage,
  FARM_EXPANSION_PACKAGES,
} from './types/game';
import confetti from 'canvas-confetti';

const INITIAL_PLOTS: FarmPlot[] = [
  { id: 0, cropType: 'corn', stage: 5, watered: true, plantedAt: Date.now() - 35000, growthTime: 22 },
  { id: 1, cropType: 'corn', stage: 5, watered: true, plantedAt: Date.now() - 35000, growthTime: 22 },
  { id: 2, cropType: 'carrot', stage: 3, watered: true, plantedAt: Date.now() - 12000, growthTime: 18 },
  { id: 3, cropType: 'tomato', stage: 5, watered: true, plantedAt: Date.now() - 40000, growthTime: 25 },
  { id: 4, cropType: 'bean', stage: 2, watered: false, plantedAt: Date.now() - 8000, growthTime: 24 },
  { id: 5, cropType: 'strawberry', stage: 2, watered: true, plantedAt: Date.now() - 10000, growthTime: 32 },
  { id: 6, cropType: 'lettuce', stage: 4, watered: true, plantedAt: Date.now() - 14000, growthTime: 16 },
  { id: 7, cropType: 'wheat', stage: 2, watered: false, plantedAt: Date.now() - 10000, growthTime: 28 },
  { id: 8, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 9, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 10, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 11, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 12, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 13, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 14, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
  { id: 15, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25 },
];

const INITIAL_MISSIONS: IsaMission[] = [
  {
    id: 'm-welcome',
    title: 'Boas-vindas da Isa',
    description: 'Aproxime-se da Isa e converse para conhecer a fazendinha!',
    isaDialogue: 'Que alegria ter você aqui na fazendinha! Plante bastante milho e cuide dos bichinhos comigo!',
    requiredAction: 'talk',
    requiredCount: 1,
    currentCount: 0,
    rewardCoins: 40,
    rewardXp: 30,
    completed: false,
    claimed: false,
  },
  {
    id: 'm-harvest-corn',
    title: 'Primeira Colheita de Milho',
    description: 'Colha 2 espigas de milho maduro na horta da Isa.',
    isaDialogue: 'O milho dourado está tão bonito e doce! Vamos colher para o celeiro!',
    requiredAction: 'harvest_corn',
    requiredCount: 2,
    currentCount: 0,
    rewardCoins: 50,
    rewardXp: 45,
    completed: false,
    claimed: false,
  },
  {
    id: 'm-plant-corn',
    title: 'Plantar Milho Fresco',
    description: 'Plante 2 sementes de milho em talhões vazios da horta.',
    isaDialogue: 'A terra está fofinha e fértil! Plante sementes de milho para nossa fazenda crescer.',
    requiredAction: 'plant_corn',
    requiredCount: 2,
    currentCount: 0,
    rewardCoins: 45,
    rewardXp: 40,
    completed: false,
    claimed: false,
  },
  {
    id: 'm-feed-animal',
    title: 'Alimentar os Bichinhos',
    description: 'Visite a Mimosa (vaca) ou as galinhas para alimentar ou ordenhar.',
    isaDialogue: 'Os animais ficam tão felizes quando recebem carinho e comida fresquinha!',
    requiredAction: 'feed_animal',
    requiredCount: 1,
    currentCount: 0,
    rewardCoins: 60,
    rewardXp: 50,
    completed: false,
    claimed: false,
  },
];

const INITIAL_LANDS: FarmLand[] = [
  {
    id: 'land-lake',
    name: 'Lago Encantado',
    description: 'Terreno com vista panorâmica para o lago e brisa refrescante.',
    areaM2: 300,
    price: 150,
    status: 'available',
    ownerId: null,
    ownerName: null,
    x: -28,
    z: -25,
    width: 14,
    depth: 14,
    color: '#0284c7',
    constructions: [],
  },
  {
    id: 'land-orchard',
    name: 'Colina das Macieiras',
    description: 'Solo rico e ensolarado, perfeito para plantações floridas.',
    areaM2: 450,
    price: 220,
    status: 'available',
    ownerId: null,
    ownerName: null,
    x: 28,
    z: -25,
    width: 15,
    depth: 15,
    color: '#16a34a',
    constructions: [],
  },
  {
    id: 'land-meadow',
    name: 'Pasto dos Sonhos',
    description: 'Grande espaço verde e plano, ideal para criar animais.',
    areaM2: 600,
    price: 300,
    status: 'available',
    ownerId: null,
    ownerName: null,
    x: 28,
    z: 25,
    width: 16,
    depth: 16,
    color: '#d97706',
    constructions: [],
  },
  {
    id: 'land-harvest',
    name: 'Grande Safra Fértil',
    description: 'Área nobre super fértil para quem quer ser um grande produtor rural.',
    areaM2: 800,
    price: 400,
    status: 'available',
    ownerId: null,
    ownerName: null,
    x: -28,
    z: 25,
    width: 18,
    depth: 18,
    color: '#9333ea',
    constructions: [],
  },
  {
    id: 'land-belavista',
    name: 'Mirante Bela Vista',
    description: 'Terreno mais alto da fazenda com visão completa de toda a propriedade!',
    areaM2: 500,
    price: 280,
    status: 'available',
    ownerId: null,
    ownerName: null,
    x: 0,
    z: 38,
    width: 15,
    depth: 15,
    color: '#ea580c',
    constructions: [],
  },
];

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [floatingAlert, setFloatingAlert] = useState<string | null>(null);

  // A sessão Supabase é persistida pelo cliente Auth; o perfil local não é usado como identidade.
  const [player, setPlayer] = useState<PlayerProfile>({
    id: 'pending-auth',
    nickname: 'Amiguinho',
    avatar: 'leo',
    role: 'visitor',
    level: 1,
    xp: 0,
    nextLevelXp: 80,
    coins: 0,
    inventory: {},
    ownedLandIds: [],
  });

  const playerRef = useRef<PlayerProfile>(player);
  playerRef.current = player;

  const [selectedSeed, setSelectedSeed] = useState<CropType>('corn');
  const [plots, setPlots] = useState<FarmPlot[]>(INITIAL_PLOTS);
  const [missions, setMissions] = useState<IsaMission[]>(INITIAL_MISSIONS);
  const [communityGoal, setCommunityGoal] = useState<CommunityGoal>({
    id: 'goal-1',
    title: 'Grande Colheita de Milho Coletiva',
    target: 100,
    current: 34,
    rewardCoins: 250,
    rewardXp: 180,
    completed: false,
  });
  const [communityClaimed, setCommunityClaimed] = useState(false);

  // Market & Land State
  const [marketState, setMarketState] = useState<MarketStateSnapshot | null>(null);
  const [marketListings, setMarketListings] = useState<MarketListing[]>([]);
  const [lands, setLands] = useState<FarmLand[]>(INITIAL_LANDS);

  // Isa Voice & Subtitles State
  const [isaSubtitles, setIsaSubtitles] = useState<{ text: string; animation: IsaAnimationState } | null>(null);

  // ☀️ Day/Night Dynamic Cycle State
  const [atmosphere, setAtmosphere] = useState<DayNightAtmosphere>(() =>
    calculateAtmosphereForHour(getRealWorldDecimalHour())
  );
  const [simulatedHour, setSimulatedHour] = useState<number | null>(null);

  // Multiplayer State
  const [playersOnlineCount, setPlayersOnlineCount] = useState<number>(0);
  const [onlinePlayerNames, setOnlinePlayerNames] = useState<string[]>([]);
  const remotePlayersRef = useRef<Map<string, RemotePlayer>>(new Map());

  // Interaction State
  const [currentTarget, setCurrentTarget] = useState<InteractionTarget | null>(null);

  // Modals
  const [isIsaModalOpen, setIsIsaModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLandMarketOpen, setIsLandMarketOpen] = useState(false);
  const [isCommunityGoalOpen, setIsCommunityGoalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAvatarCustomizerOpen, setIsAvatarCustomizerOpen] = useState(false);
  const [isHarvestConfigOpen, setIsHarvestConfigOpen] = useState(false);
  const [isExpandFarmOpen, setIsExpandFarmOpen] = useState(false);
  const [purchasedExpansions, setPurchasedExpansions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fazendinha_unlocked_expansions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const purchasedExpansionsRef = useRef<string[]>(purchasedExpansions);
  purchasedExpansionsRef.current = purchasedExpansions;

  const [harvestModalData, setHarvestModalData] = useState<{
    plot: FarmPlot;
    cropType: CropType;
    totalYield: number;
  } | null>(null);

  // References
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const lastMoveBroadcastRef = useRef<number>(0);
  const lastActivityTimeRef = useRef<number>(Date.now());
  const pendingEconomyActionsRef = useRef(new Set<string>());
  const marketBuyIdempotencyKeysRef = useRef(new Map<string, string>());

  const showAlert = (msg: string) => {
    setFloatingAlert(msg);
    setTimeout(() => {
      setFloatingAlert((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const mergeUnlockedPlots = (basePlots: FarmPlot[], expansionPackageIds: string[]): FarmPlot[] => {
    const unlockedPlotIds = new Set<number>();
    // Canteiros base da fazenda: IDs 0..15
    for (let i = 0; i < 16; i++) unlockedPlotIds.add(i);

    // Canteiros das expansões adquiridas
    for (const pkgId of expansionPackageIds) {
      const pkg = FARM_EXPANSION_PACKAGES.find((p) => p.id === pkgId);
      if (pkg) {
        pkg.plotIds.forEach((id) => unlockedPlotIds.add(id));
      }
    }

    const plotsMap = new Map<number, FarmPlot>();
    basePlots.forEach((p) => plotsMap.set(p.id, p));

    const result: FarmPlot[] = [];
    unlockedPlotIds.forEach((id) => {
      if (plotsMap.has(id)) {
        result.push(plotsMap.get(id)!);
      } else {
        result.push({
          id,
          cropType: null,
          stage: 0,
          watered: false,
          plantedAt: null,
          growthTime: 25,
        });
      }
    });

    return result.sort((a, b) => a.id - b.id);
  };

  const applyMarketState = (
    state: MarketStateSnapshot,
    options?: { role?: PlayerProfile['role']; avatarFallback?: string }
  ) => {
    setMarketState(state);
    const serverCoins = Number(state.wallet.coins);
    updateLocalCoins(serverCoins);

    // Sincronizar expansões adquiridas vindas do Supabase
    const cloudExpansions = state.inventory
      .filter((i) => typeof i.item_id === 'string' && i.item_id.startsWith('expansion_'))
      .map((i) => i.item_id.replace('expansion_', ''));
    let activeExpansions = purchasedExpansionsRef.current;
    if (cloudExpansions.length > 0) {
      activeExpansions = Array.from(new Set([...purchasedExpansionsRef.current, ...cloudExpansions]));
      setPurchasedExpansions(activeExpansions);
      try {
        localStorage.setItem('fazendinha_unlocked_expansions', JSON.stringify(activeExpansions));
      } catch {
        // no-op
      }
    }

    setPlayer((prev) => ({
      ...prev,
      id: state.player.id,
      nickname: state.player.nickname,
      avatar: state.player.avatar_id || options?.avatarFallback || prev.avatar,
      role: options?.role ?? prev.role,
      coins: serverCoins,
      inventory: mapInventoryFromMarketState(state),
      ownedLandIds: state.owned_land_ids,
    }));

    const rawPlots = mapPlotsFromMarketState(state);
    const confirmedPlots = mergeUnlockedPlots(rawPlots, activeExpansions);
    const confirmedLands = mapLandsFromMarketState(state, INITIAL_LANDS, state.player.id);
    const confirmedListings = mapListingsFromMarketState(state);

    setPlots(confirmedPlots);
    setMarketListings(confirmedListings);
    setLands(confirmedLands);
    engineRef.current?.updatePlotMeshes(confirmedPlots);
    engineRef.current?.updateLands(confirmedLands, state.player.id);
    engineRef.current?.updateMarketShelves(confirmedListings);

    // Sincronizar preferências de colheita salvas no Supabase
    if (state.player.id && !state.player.id.startsWith('pending') && !state.player.id.startsWith('guest-')) {
      loadHarvestPreferenceFromSupabase(state.player.id).then((p) => {
        if (p) saveHarvestPreference(p);
      });
    }
  };

  const runMarketStateAction = async (
    key: string,
    operation: () => Promise<MarketStateSnapshot>
  ): Promise<MarketStateSnapshot | null> => {
    if (pendingEconomyActionsRef.current.has(key)) return null;
    pendingEconomyActionsRef.current.add(key);
    try {
      const state = await operation();
      applyMarketState(state);
      return state;
    } catch (error) {
      showAlert(error instanceof Error ? error.message : 'Não foi possível completar.');
      return null;
    } finally {
      pendingEconomyActionsRef.current.delete(key);
    }
  };

  const handleSetSimulatedHour = (hour: number | null) => {
    setSimulatedHour(hour);
    if (engineRef.current) {
      engineRef.current.setSimulatedHour(hour);
    }
  };

  // Isa Farm Administrator: Diagnóstico contínuo em tempo real do estoque da fazenda
  const isaDiagnosis = useMemo(() => {
    return isaAssistantService.diagnose(marketState, plots, player.inventory, player.id);
  }, [marketState, plots, player.inventory, player.id]);

  // Alertas espontâneos contextuais da Isa sobre falta de estoque e pedidos de clientes
  useEffect(() => {
    if (!isPlaying) return;
    if (isaDiagnosis.overallStatus === 'critical_stockout') {
      const timer = setTimeout(() => {
        isaAssistantService.triggerSpontaneousStockAlert(isaDiagnosis);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isaDiagnosis.overallStatus, isaDiagnosis.unreadMissedSaleNotifications]);

  // Subscribe to Isa Voice Subtitles & 3D Model Animations
  useEffect(() => {
    const unsub = isaVoiceManager.subscribeSubtitles((speech) => {
      setIsaSubtitles(speech);
      if (engineRef.current) {
        engineRef.current.setIsaAnimationState(speech?.animation || 'idle');
      }
    });
    return unsub;
  }, []);

  // Periodic Inactivity Isa Reaction (after 60s idle)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityTimeRef.current > 75000 && !isaSubtitles) {
        lastActivityTimeRef.current = now;
        isaVoiceManager.speak(
          'Vamos lá? Ainda temos muito trabalho pela frente na nossa fazendinha!',
          'idle'
        );
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [isPlaying, isaSubtitles]);

  // Dicas contextuais inteligentes da Isa (Sementes, Expansão de Horta, Terrenos Livres)
  const lastIsaTipTimeRef = useRef<number>(Date.now());
  useEffect(() => {
    if (!isPlaying) return;

    const tipTimer = setInterval(() => {
      const now = Date.now();
      // Cooldown de pelo menos 45 segundos entre dicas espontâneas
      if (now - lastIsaTipTimeRef.current < 45000 || isaSubtitles) return;

      // 1. Verificar se o jogador tem saldo para expandir a horta
      const nextPackage = FARM_EXPANSION_PACKAGES.find((pkg) => !purchasedExpansions.includes(pkg.id));
      if (nextPackage && player.coins >= nextPackage.price) {
        lastIsaTipTimeRef.current = now;
        isaVoiceManager.speak(
          'Você já pode expandir sua horta e plantar mais! Toque em EXPANDIR HORTA!',
          'cheering'
        );
        return;
      }

      // 2. Verificar se o jogador está sem sementes e tem canteiros livres
      const totalSeedsInBag = Object.entries(player.inventory)
        .filter(([k, item]) => k.endsWith('_seed') && (item?.count || 0) > 0)
        .reduce((sum, [, item]) => sum + (item.count || 0), 0);

      const emptyPlotsCount = plots.filter((p) => !p.cropType).length;

      if (totalSeedsInBag === 0 && emptyPlotsCount >= 3) {
        lastIsaTipTimeRef.current = now;
        isaVoiceManager.speak(
          'Precisamos de mais sementes? A LOJA DE SEMENTES está aberta com 10 opções fresquinhas!',
          'waving'
        );
        return;
      }

      // 3. Estoque de milho baixo
      const cornStock = player.inventory['corn']?.count || 0;
      const cornListing = marketListings.find((l) => l.productId === 'corn' && l.sellerId === player.id);
      const totalCorn = cornStock + (cornListing?.quantity || 0);

      if (totalCorn < 2 && (player.inventory['corn_seed']?.count || 0) === 0) {
        lastIsaTipTimeRef.current = now;
        isaVoiceManager.speak(
          'Seu estoque de milho está baixo. Recomendo comprar sementes de milho na nossa loja!',
          'idle'
        );
        return;
      }

      // 4. Terrenos livres esperando plantio
      if (emptyPlotsCount >= 6 && totalSeedsInBag > 0) {
        lastIsaTipTimeRef.current = now;
        isaVoiceManager.speak(
          'Temos espaço livre na horta esperando por novas plantações! Vamos cultivar!',
          'cheering'
        );
      }
    }, 15000);

    return () => clearInterval(tipTimer);
  }, [isPlaying, isaSubtitles, player.coins, purchasedExpansions, player.inventory, plots, marketListings]);

  // Monitoramento estrito de expiração de sessão e logout
  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (isPlaying) {
          setIsPlaying(false);
          networkManager.disconnect();
          remotePlayersRef.current.clear();
          setOnlinePlayerNames([]);
          setPlayersOnlineCount(0);
          showAlert('Sua sessão foi encerrada. Por favor, autentique-se novamente.');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isPlaying]);

  // Inicia a cena estritamente com o perfil autenticado do Supabase Auth
  const handleStartGame = async (playerNickname: string, avatar: string, role: 'visitor' | 'isa_owner' = 'visitor', playerId?: string) => {
    if (!supabase) {
      throw new Error('Serviço de autenticação temporariamente indisponível. Recarregue a página.');
    }

    if (!playerId) {
      throw new Error('Autenticação obrigatória. Faça login com sua conta para entrar na fazendinha.');
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user || authData.user.id !== playerId) {
      throw new Error('Sessão inválida ou expirada. Entre com seu e-mail e senha.');
    }

    const state = await ensureAndLoadMarketState(authData.user.id, playerNickname, avatar);
    applyMarketState(state, { role, avatarFallback: avatar });
    setIsPlaying(true);
    lastActivityTimeRef.current = Date.now();

    setTimeout(() => {
      if (role === 'isa_owner') {
        isaVoiceManager.speak(
          'Bem-vinda, Isa! Sua fazendinha está linda e pronta para as atividades!',
          'cheering'
        );
      } else {
        isaVoiceManager.speak(
          'Obaaa! Temos visita! Seja muito bem-vindo à Fazendinha da Isa!',
          'waving'
        );
      }
    }, 1200);
  };

  // Initialize GameEngine & Network after Start Game
  useEffect(() => {
    if (!isPlaying || !canvasMountRef.current) return;

    // 1. Create Engine
    const engine = new GameEngine(
      canvasMountRef.current,
      player.avatar,
      player.nickname,
      player.level
    );
    engineRef.current = engine;

    engine.onInteractionChange = (target) => {
      setCurrentTarget(target);
    };

    engine.onAtmosphereChange = (atmo) => {
      setAtmosphere({ ...atmo });
    };

    engine.onPlayerMove = (x, y, z, rotation, isMoving) => {
      lastActivityTimeRef.current = Date.now();
      const now = Date.now();
      if (now - lastMoveBroadcastRef.current > 60) {
        lastMoveBroadcastRef.current = now;
        networkManager.sendMovement(x, y, z, rotation, isMoving);
      }
    };

    // Render initial plots, lands, and market shelves
    engine.updatePlotMeshes(plots);
    engine.updateLands(lands, player.id);
    engine.updateMarketShelves(marketListings);

    // Sincronizar perfis cadastrados no Supabase para os balões de pensamento dos NPCs
    const syncNpcProfiles = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase.from('market_npc_profiles').select('*');
          if (!error && Array.isArray(data) && data.length > 0) {
            engine.updateNpcProfiles(data as any);
            return;
          }
        }
        const resp = await fetch('/api/npc-purchase/profiles');
        if (resp.ok) {
          const json = await resp.json();
          if (json && Array.isArray(json.npcs)) {
            engine.updateNpcProfiles(json.npcs);
          }
        }
      } catch {
        // Perfis padrão já foram inicializados no construtor da GameEngine
      }
    };
    syncNpcProfiles();

    // 2. Connect to Multiplayer Network
    networkManager.connect(player.id, {
      nickname: player.nickname,
      avatar: player.avatar,
      role: player.role,
      color: '#f59e0b',
      x: engine.playerPos.x,
      y: engine.playerPos.y,
      z: engine.playerPos.z,
      rotation: engine.playerRotation,
    }, async () => {
      if (!supabase) return null;
      try {
        const { data, error } = await supabase.auth.getSession();
        return error || !data.session ? null : data.session.access_token;
      } catch {
        return null;
      }
    });

    // 3. Subscribe to Network Events
    const unsubscribe = networkManager.subscribe((msg) => {
      if (msg.type === 'auth_error') {
        showAlert('Autenticação obrigatória. Por favor, faça login com sua conta para jogar.');
        setIsPlaying(false);
        networkManager.disconnect();
        remotePlayersRef.current.clear();
        setOnlinePlayerNames([]);
        setPlayersOnlineCount(0);
      } else if (msg.type === 'welcome') {
        if (msg.communityGoal) {
          setCommunityGoal(msg.communityGoal);
        }
        if (msg.players && Array.isArray(msg.players)) {
          msg.players.forEach((p: RemotePlayer) => {
            if (p.id !== player.id) {
              remotePlayersRef.current.set(p.id, p);
              engine.updateRemotePlayer(p);
            }
          });
          updatePlayersOnlineList();
        }
      } else if (msg.type === 'player_joined') {
        if (msg.player && msg.player.id !== player.id) {
          remotePlayersRef.current.set(msg.player.id, msg.player);
          engine.updateRemotePlayer(msg.player);
          updatePlayersOnlineList();
          showAlert(`🌾 ${msg.player.nickname} entrou na fazendinha!`);
        }
      } else if (msg.type === 'player_moved') {
        if (msg.id !== player.id) {
          engine.updateRemotePlayer(msg);
        }
      } else if (msg.type === 'player_left') {
        remotePlayersRef.current.delete(msg.id);
        engine.removeRemotePlayer(msg.id);
        updatePlayersOnlineList();
      } else if (msg.type === 'player_chat') {
        if (msg.id !== player.id) {
          const remote = remotePlayersRef.current.get(msg.id);
          if (remote) {
            remote.message = { text: msg.text, time: msg.time || Date.now() };
            engine.updateRemotePlayer(remote);
          }
          showAlert(`💬 ${msg.nickname}: "${msg.text}"`);
        }
      } else if (msg.type === 'community_goal_updated') {
        setCommunityGoal(msg.goal);
        if (msg.goal.completed && !communityGoal.completed) {
          isaVoiceManager.speak(
            'Conseguimos! Glória a Deus! Quando trabalhamos juntos, nossa fazenda fica ainda mais bonita!',
            'dancing'
          );
        }
      } else if (msg.type === 'magic_rain') {
        soundManager.playWater();
        showAlert('🌧️ Chuva Mágica! Todas as plantações foram regadas!');
        setPlots((prev) => {
          const next = prev.map((p) => ({ ...p, watered: true }));
          engine.updatePlotMeshes(next);
          return next;
        });
      } else if (msg.type === 'npc_purchase') {
        const tx = msg.transaction;
        if (tx) {
          engine.triggerNpcPurchase(tx);
          if (msg.marketListings) {
            engine.updateMarketShelves(msg.marketListings);
            setMarketListings(msg.marketListings.map((l: any) => ({
              ...l,
              stallId: l.id || l.stallId || 'stall-main',
            })));
          }

          const curPlayer = playerRef.current;
          const isMySale =
            tx.seller_id === curPlayer.id ||
            curPlayer.role === 'isa_owner' ||
            tx.seller_id === 'npc-isa' ||
            (tx.seller_name && tx.seller_name.toLowerCase().includes('isa'));

          if (isMySale) {
            const earnedCoins = Number(tx.total_cost || 0);
            soundManager.playCoin();
            setPlayer((prev) => {
              const newCoins = prev.coins + earnedCoins;
              addLocalCoins(earnedCoins);
              return {
                ...prev,
                coins: newCoins,
              };
            });
            showAlert(`💰 +${earnedCoins} moedas 🪙 (${tx.npc_name} comprou ${tx.product_name})`);
          }
        }
      }
    });

    function updatePlayersOnlineList() {
      const names = Array.from(remotePlayersRef.current.values()).map((p) => p.nickname);
      setOnlinePlayerNames(names);
      setPlayersOnlineCount(names.length + 1); // +1 is self
    }

    return () => {
      unsubscribe();
      networkManager.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, [isPlaying]);

  // Periodic Crop Growth Simulation (Tempo Real Persistente Baseado no Servidor)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      let changed = false;

      setPlots((prev) => {
        const next = prev.map((plot) => {
          if (!plot.cropType || !plot.plantedAt || plot.stage >= 5) return plot;

          const newStage = calculatePlotStage(plot.plantedAt, plot.growthTime, plot.watered);

          if (newStage !== plot.stage) {
            changed = true;
            return { ...plot, stage: newStage };
          }
          return plot;
        });

        if (changed && engineRef.current) {
          engineRef.current.updatePlotMeshes(next);
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle XP and Level Progression
  const addXp = (xpGain: number) => {
    setPlayer((prev) => {
      let newXp = prev.xp + xpGain;
      let newLevel = prev.level;
      let nextTarget = prev.nextLevelXp;

      if (newXp >= nextTarget) {
        newLevel += 1;
        newXp = newXp - nextTarget;
        nextTarget = Math.round(nextTarget * 1.4);
        soundManager.playLevelUp();
        showAlert(`🎉 PARABÉNS! Você subiu para o Nível ${newLevel}!`);

        isaVoiceManager.speak(
          'Uhuuul! Parabéns! Você está ficando um grande fazendeiro!',
          'cheering'
        );

        try {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
        } catch {
          // ignore
        }
      }

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        nextLevelXp: nextTarget,
      };
    });
  };

  // Advance Mission Progress
  const triggerMissionProgress = (action: IsaMission['requiredAction'], count: number = 1) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.requiredAction === action && !m.completed) {
          const newCount = Math.min(m.requiredCount, m.currentCount + count);
          const isDone = newCount >= m.requiredCount;
          if (isDone && !m.completed) {
            soundManager.playLevelUp();
            showAlert(`⭐ Missão Concluída: "${m.title}"! Fale com a Isa para receber a recompensa!`);
            isaVoiceManager.speak(
              'Parabéns pela dedicação! Vem aqui comigo para pegar sua recompensa!',
              'clapping'
            );
          }
          return {
            ...m,
            currentCount: newCount,
            completed: isDone,
          };
        }
        return m;
      })
    );
  };

  // Contextual Interaction Trigger ([E] or Screen Button)
  const handleContextualInteract = async () => {
    lastActivityTimeRef.current = Date.now();
    if (!currentTarget) return;

    if (currentTarget.type === 'isa') {
      soundManager.playIsaHello();
      setIsIsaModalOpen(true);
      triggerMissionProgress('talk', 1);
      return;
    }
    if (currentTarget.type === 'market') {
      soundManager.playPop();
      setIsMarketOpen(true);
      return;
    }
    if (currentTarget.type === 'land') {
      soundManager.playPop();
      setIsLandMarketOpen(true);
      return;
    }
    if (currentTarget.type === 'barn') {
      soundManager.playPop();
      setIsInventoryOpen(true);
      return;
    }
    if (currentTarget.type === 'animal') {
      showAlert('🐄 Os bichinhos estão bem alimentados e felizes!');
      return;
    }
    if (currentTarget.type !== 'plot') return;

    const plotId = Number(currentTarget.id);
    const plot = plots.find((entry) => entry.id === plotId);
    if (!plot) return;

    if (!plot.cropType || plot.stage === 0) {
      let seedToPlant: CropType = selectedSeed;
      const seedKey = `${seedToPlant}_seed`;
      let currentSeedCount = player.inventory[seedKey]?.count || 0;

      // Se a semente atualmente selecionada estiver zerada, busca automaticamente qualquer outra semente disponível
      if (currentSeedCount <= 0) {
        const availableSeedEntry = Object.entries(player.inventory).find(
          ([key, item]) => key.endsWith('_seed') && (item?.count || 0) > 0
        );

        if (availableSeedEntry) {
          const matchedCrop = availableSeedEntry[0].replace('_seed', '') as CropType;
          if (matchedCrop in CROPS_CATALOG) {
            seedToPlant = matchedCrop;
            setSelectedSeed(matchedCrop);
            currentSeedCount = availableSeedEntry[1]?.count || 1;
          }
        }
      }

      // Se o jogador não possuir nenhuma semente na mochila, recebe o presente inicial da Isa
      if (currentSeedCount <= 0) {
        soundManager.playPop();
        showAlert('🎁 Sementes de presente da Isa adicionadas!');
        await addSeedsToInventoryInSupabase(player.id, 'corn', 5);
        setPlayer((prev) => ({
          ...prev,
          inventory: {
            ...prev.inventory,
            corn_seed: {
              id: 'corn_seed',
              name: 'Semente de Milho',
              category: 'seed',
              count: (prev.inventory['corn_seed']?.count || 0) + 5,
              icon: '🌽',
              value: 10,
            },
          },
        }));
        seedToPlant = 'corn';
        setSelectedSeed('corn');
        currentSeedCount = 5;
      }

      const cropMeta = CROPS_CATALOG[seedToPlant] || CROPS_CATALOG.corn;
      const state = await runMarketStateAction(
        `farm:${plotId}:plant`,
        () => performMarketFarmAction(player.id, plotId, 'plant', seedToPlant)
      );
      if (!state) return;

      // Atualiza também o contador da semente na mochila local do jogador
      setPlayer((prev) => {
        const key = `${seedToPlant}_seed`;
        const item = prev.inventory[key];
        if (!item || item.count <= 0) return prev;
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            [key]: { ...item, count: Math.max(0, item.count - 1) },
          },
        };
      });

      const plantedPlot = mapPlotsFromMarketState(state).find((entry) => entry.id === plotId);
      if (plantedPlot) networkManager.sendPlotAction(plantedPlot, 'plant', player.nickname);
      soundManager.playPlant();
      addXp(cropMeta.xpReward / 2);
      showAlert(`🌱 ${cropMeta.name} plantado!`);
      if (seedToPlant === 'corn') triggerMissionProgress('plant_corn', 1);
      return;
    }

    if (plot.stage < 5) {
      if (!plot.watered) {
        const state = await runMarketStateAction(
          `farm:${plotId}:water`,
          () => performMarketFarmAction(player.id, plotId, 'water')
        );
        if (!state) return;

        const wateredPlot = mapPlotsFromMarketState(state).find((entry) => entry.id === plotId);
        if (wateredPlot) networkManager.sendPlotAction(wateredPlot, 'water', player.nickname);
        soundManager.playWater();
        addXp(10);
        showAlert('💧 Regado!');
        return;
      }

      // Previne colheita prematura antes da maturação completa (Estágio 5)
      const cropMeta = plot.cropType ? CROPS_CATALOG[plot.cropType] : null;
      soundManager.playPop();
      showAlert(`🌱 ${cropMeta?.name || 'Cultura'} em crescimento (${plot.stage}/5)...`);
      return;
    }

    // Estágio 5: Colheita Madura com Distribuição Inteligente (Opção A, B ou C)
    const harvestedCrop = (plot.cropType || 'corn') as CropType;
    const pref = loadHarvestPreference();

    if (pref.autoApply) {
      await handleExecuteHarvest(plot, pref);
    } else {
      setHarvestModalData({
        plot,
        cropType: harvestedCrop,
        totalYield: 2,
      });
    }
  };

  const handleExecuteHarvest = async (plot: FarmPlot, pref: HarvestPreference) => {
    const plotId = plot.id;
    const harvestedCrop = (plot.cropType || 'corn') as CropType;
    const cropMeta = CROPS_CATALOG[harvestedCrop] || CROPS_CATALOG.corn;
    const totalYield = 2; // Produção oficial da colheita

    // Cálculo atômico sem perda e sem duplicação
    const marketUnits =
      pref.mode === 'A'
        ? totalYield
        : pref.mode === 'B'
        ? 0
        : Math.round(totalYield * (pref.marketPercent / 100));
    const inventoryUnits = totalYield - marketUnits;

    // Salvar preferência localmente e no Supabase
    saveHarvestPreference(pref);
    if (player.id) saveHarvestPreferenceToSupabase(player.id, pref);

    const state = await runMarketStateAction(
      `farm:${plotId}:harvest`,
      () => performMarketFarmAction(player.id, plotId, 'harvest', harvestedCrop, {
        mode: pref.mode,
        marketPct: pref.marketPercent,
      })
    );
    if (!state) return;

    const clearedPlot = mapPlotsFromMarketState(state).find((entry) => entry.id === plotId);
    if (clearedPlot) networkManager.sendPlotAction(clearedPlot, 'harvest', player.nickname);
    soundManager.playHarvest();
    addXp(cropMeta.xpReward);

    if (marketUnits > 0 && inventoryUnits > 0) {
      showAlert(`🌾 Colheita: ${marketUnits}x na Barraca e ${inventoryUnits}x na Mochila!`);
    } else if (marketUnits > 0) {
      showAlert(`🏪 Colheita: ${totalYield}x ${cropMeta.name} na Barraca!`);
    } else {
      showAlert(`🎒 Colheita: ${totalYield}x ${cropMeta.name} na Mochila!`);
    }

    isaVoiceManager.speak(
      `Colheita de ${cropMeta.name} concluída com sucesso! Distribuímos os produtos certinho na fazenda!`,
      'jumping'
    );

    if (harvestedCrop === 'corn') {
      setCommunityGoal((prev) => {
        const nextCur = Math.min(prev.target, prev.current + 1);
        const isCompleted = nextCur >= prev.target;
        const updatedGoal = { ...prev, current: nextCur, completed: isCompleted };
        networkManager.sendCommunityGoalUpdate(updatedGoal);
        if (isCompleted && !prev.completed) {
          isaVoiceManager.speak(
            'Conseguimos! Glória a Deus! Quando trabalhamos juntos, nossa fazenda fica ainda mais bonita!',
            'dancing'
          );
        }
        return updatedGoal;
      });
      triggerMissionProgress('harvest_corn', 1);
    } else {
      const wasDeficit =
        isaDiagnosis.exhaustedProducts.some((p) => p.productId === harvestedCrop) ||
        isaDiagnosis.lowProducts.some((p) => p.productId === harvestedCrop);
      if (wasDeficit) {
        isaAssistantService.onHarvestDeficitCrop(cropMeta.name);
      }
    }
  };

  // Keyboard shortcut for action [E]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof e.key === 'string' && e.key.toLowerCase() === 'e') {
        void handleContextualInteract();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTarget, plots, selectedSeed, player]);

  // Claim Mission Reward (Resgata moedas e XP da missão concluída)
  const handleClaimMissionReward = (missionId: string) => {
    const mission = missions.find((entry) => entry.id === missionId);
    if (!mission || mission.claimed) return;
    if (mission.currentCount < mission.requiredCount) {
      showAlert(`A missão "${mission.title}" ainda não foi concluída (${mission.currentCount}/${mission.requiredCount})!`);
      return;
    }

    const earnedCoins = Number(mission.rewardCoins || 0);
    const earnedXp = Number(mission.rewardXp || 0);

    setPlayer((prev) => {
      const newCoins = prev.coins + earnedCoins;
      addLocalCoins(earnedCoins);
      fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: prev.id,
          amount: earnedCoins,
          reason: `Recompensa da missão: ${mission.title}`,
        }),
      }).catch(() => {});
      return {
        ...prev,
        coins: newCoins,
      };
    });

    addXp(earnedXp);

    setMissions((prev) =>
      prev.map((item) =>
        item.id === missionId ? { ...item, claimed: true, completed: true } : item
      )
    );

    soundManager.playCoin();
    soundManager.playLevelUp();
    showAlert(`🎉 +${earnedCoins} moedas 🪙 e +${earnedXp} XP ⭐!`);
    isaVoiceManager.speak('Muito bem! Aqui está sua recompensa! Você merece!', 'thanking');
  };

  // Free Seeds from Isa
  const handleGiveFreeSeeds = async () => {
    await addSeedsToInventoryInSupabase(player.id, 'corn', 3);
    setPlayer((prev) => {
      const seedKey = 'corn_seed';
      const current = prev.inventory[seedKey] || {
        id: seedKey,
        name: 'Semente de Milho',
        category: 'seed',
        count: 0,
        icon: '🌽',
        value: 10,
      };
      return {
        ...prev,
        inventory: {
          ...prev.inventory,
          [seedKey]: { ...current, count: current.count + 3 },
        },
      };
    });
    setSelectedSeed('corn');
    soundManager.playPop();
    showAlert('🎁 +3 sementes de milho!');
    isaVoiceManager.speak('Aqui estão algumas sementinhas para você começar! Plante com muito carinho!', 'cheering');
  };

  // Buy Seeds in Shop
  const handleBuySeed = async (cropType: CropType, displayPrice: number, quantity: number = 1) => {
    const qty = Math.max(1, quantity);
    const unitCost = displayPrice || CROPS_CATALOG[cropType]?.seedCost || 10;
    const totalCost = unitCost * qty;
    if (player.coins < totalCost) {
      showAlert(`Moedas insuficientes! Você precisa de ${totalCost} 🪙.`);
      return;
    }

    try {
      const state = await runMarketStateAction(
        `buy-seed:${cropType}:${Date.now()}`,
        () => purchaseMarketSeed(player.id, cropType, qty)
      );
      if (state) {
        setSelectedSeed(cropType);
        soundManager.playCoin();
        showAlert(`🌱 ${qty}x ${CROPS_CATALOG[cropType].name} comprada(s) (-${totalCost} 🪙)!`);
        return;
      }
    } catch {
      // Fallback local se o RPC ou Supabase estiver offline
    }

    await addSeedsToInventoryInSupabase(player.id, cropType, qty);
    setPlayer((prev) => {
      if (prev.coins < totalCost) return prev;
      const seedKey = `${cropType}_seed`;
      const current = prev.inventory[seedKey] || {
        id: seedKey,
        name: `Semente de ${CROPS_CATALOG[cropType].name}`,
        category: 'seed',
        count: 0,
        icon: CROPS_CATALOG[cropType].icon,
        value: unitCost,
      };
      const newCoins = prev.coins - totalCost;
      addLocalCoins(-totalCost);
      return {
        ...prev,
        coins: newCoins,
        inventory: {
          ...prev.inventory,
          [seedKey]: { ...current, count: current.count + qty },
        },
      };
    });
    setSelectedSeed(cropType);
    soundManager.playCoin();
    showAlert(`🌱 ${qty}x ${CROPS_CATALOG[cropType].name} comprada(s) (-${totalCost} 🪙)!`);
  };

  // Buy Feed
  const handleBuyFeed = async () => {
    const feedCost = 10;
    if (player.coins < feedCost) {
      showAlert('Moedas insuficientes para comprar ração!');
      return;
    }

    try {
      const state = await runMarketStateAction('buy-feed', () => purchaseMarketFeed(player.id));
      if (state) {
        soundManager.playCoin();
        showAlert('🌾 Ração comprada (-10 🪙)!');
        return;
      }
    } catch {
      // Fallback local
    }

    setPlayer((prev) => {
      if (prev.coins < feedCost) return prev;
      const itemKey = 'feed';
      const current = prev.inventory[itemKey] || {
        id: itemKey,
        name: 'Saco de Ração Animal',
        category: 'product',
        count: 0,
        icon: '🌾',
        value: 10,
      };
      const newCoins = prev.coins - feedCost;
      addLocalCoins(-feedCost);
      return {
        ...prev,
        coins: newCoins,
        inventory: {
          ...prev.inventory,
          [itemKey]: { ...current, count: current.count + 2 },
        },
      };
    });
    soundManager.playCoin();
    showAlert('🌾 2x Ração animal comprada (-10 🪙)!');
  };

  // Buy Farm Expansion Package (Expandir Horta)
  const handleBuyExpansion = async (pkg: FarmExpansionPackage): Promise<boolean> => {
    if (purchasedExpansions.includes(pkg.id)) {
      showAlert('Esta expansão já foi desbloqueada!');
      return false;
    }
    if (player.coins < pkg.price) {
      showAlert(`Moedas insuficientes! Você precisa de ${pkg.price} 🪙 para esta expansão.`);
      return false;
    }

    try {
      // 1. Notificar servidor / registrar no ledger
      await fetch('/api/farm/expansion/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          packageName: pkg.name,
          plotIds: pkg.plotIds,
          price: pkg.price,
          playerId: player.id,
          playerName: player.nickname,
          playerCoins: player.coins,
        }),
      }).catch((e) => console.warn('Aviso API expansão, prosseguindo com persistência local:', e));

      // 2. Persistir localmente e debitar moedas
      const nextExpansions = [...purchasedExpansions, pkg.id];
      setPurchasedExpansions(nextExpansions);
      try {
        localStorage.setItem('fazendinha_unlocked_expansions', JSON.stringify(nextExpansions));
      } catch (err) {
        console.warn('Erro ao gravar expansões no localStorage:', err);
      }

      // Se autenticado no Supabase, salvar registro na tabela de inventário do jogador
      if (supabase && player.id && !player.id.startsWith('pending') && !player.id.startsWith('guest-')) {
        try {
          await supabase.from('player_inventory').upsert({
            player_id: player.id,
            item_id: `expansion_${pkg.id}`,
            category: 'expansion',
            quantity: 1,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'player_id,item_id' });
        } catch (supaErr) {
          console.warn('Registro de expansão no Supabase:', supaErr);
        }
      }

      addLocalCoins(-pkg.price);
      setPlayer((prev) => ({
        ...prev,
        coins: Math.max(0, prev.coins - pkg.price),
      }));

      // 3. Atualizar e sincronizar novos canteiros 3D no GameEngine
      setPlots((prevPlots) => {
        const merged = mergeUnlockedPlots(prevPlots, nextExpansions);
        engineRef.current?.updatePlotMeshes(merged);
        return merged;
      });

      // 4. Efeitos visuais e fala da Isa
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      soundManager.playLevelUp();
      showAlert(`🚜 Expansão ${pkg.name} desbloqueada (+${pkg.plotCount} canteiros)!`);

      isaVoiceManager.speak(
        `Que maravilha! Nossa fazendinha expandiu! Agora temos mais ${pkg.plotCount} canteiros para plantar e abastecer a feira!`,
        'cheering'
      );

      return true;
    } catch (err) {
      console.error('Erro ao comprar expansão:', err);
      showAlert('Não foi possível desbloquear a expansão agora. Tente novamente.');
      return false;
    }
  };

  // Sell Item in Inventory (Venda direta da mochila)
  const handleSellItem = (itemId: string, count: number) => {
    const item = player.inventory[itemId];
    if (!item || item.count < count || count <= 0) return;

    const unitVal =
      item.value ||
      CROPS_CATALOG[itemId as CropType]?.sellValue ||
      MARKET_PRODUCT_INFO[itemId as ProductId]?.defaultPrice ||
      25;
    const totalEarned = unitVal * count;

    setPlayer((prev) => {
      const curItem = prev.inventory[itemId];
      if (!curItem || curItem.count < count) return prev;

      const newCount = curItem.count - count;
      const newInventory = { ...prev.inventory };
      if (newCount <= 0) {
        delete newInventory[itemId];
      } else {
        newInventory[itemId] = { ...curItem, count: newCount };
      }

      const newCoins = prev.coins + totalEarned;
      addLocalCoins(totalEarned);

      fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: prev.id,
          amount: totalEarned,
          reason: `Venda de ${count}x ${curItem.name}`,
        }),
      }).catch(() => {});

      return {
        ...prev,
        coins: newCoins,
        inventory: newInventory,
      };
    });

    soundManager.playCoin();
    showAlert(`💰 Você vendeu ${count}x ${item.name} por +${totalEarned} moedas 🪙!`);
  };

  // --- MERCADO HANDLERS ---
  const handleBuyMarketListing = async (listingId: string, quantity: number) => {
    const listing = marketListings.find((entry) => entry.id === listingId);
    if (!listing) {
      showAlert('O anúncio não está mais disponível. Atualize o mercado e tente novamente.');
      return;
    }
    if (!listing.stallId) {
      showAlert('O anúncio não está mais disponível.');
      return;
    }

    const totalCost = listing.pricePerUnit * quantity;
    if (player.coins < totalCost) {
      showAlert(`Moedas insuficientes! Você precisa de ${totalCost} 🪙.`);
      return;
    }

    const operationId = `${listingId}:${quantity}`;
    const pendingKey = `market-buy:${operationId}`;
    if (pendingEconomyActionsRef.current.has(pendingKey)) return;

    let idempotencyKey = marketBuyIdempotencyKeysRef.current.get(operationId);
    if (!idempotencyKey) {
      if (typeof crypto === 'undefined' || typeof crypto.randomUUID !== 'function') {
        showAlert('Não foi possível gerar identificador seguro para a compra.');
        return;
      }
      idempotencyKey = crypto.randomUUID();
      marketBuyIdempotencyKeysRef.current.set(operationId, idempotencyKey);
    }

    pendingEconomyActionsRef.current.add(pendingKey);
    try {
      const result = await purchaseMarketListing(
        player.id,
        listing.stallId,
        listing.productId,
        quantity,
        idempotencyKey
      );
      applyMarketState(result.state);
      marketBuyIdempotencyKeysRef.current.delete(operationId);
      soundManager.playCoin();
      showAlert(`🛒 Compra realizada: ${quantity}x ${listing.productName} (-${totalCost} 🪙)`);
    } catch (error) {
      // Fallback local se a RPC falhar
      setPlayer((prev) => {
        if (prev.coins < totalCost) return prev;
        const newCoins = prev.coins - totalCost;
        addLocalCoins(-totalCost);
        const currentItem = prev.inventory[listing.productId] || {
          id: listing.productId,
          name: listing.productName,
          category: 'crop',
          count: 0,
          icon: listing.icon,
          value: listing.pricePerUnit,
        };
        return {
          ...prev,
          coins: newCoins,
          inventory: {
            ...prev.inventory,
            [listing.productId]: { ...currentItem, count: currentItem.count + quantity },
          },
        };
      });
      setMarketListings((prev) =>
        prev
          .map((l) => (l.id === listingId ? { ...l, quantity: Math.max(0, l.quantity - quantity) } : l))
          .filter((l) => l.quantity > 0)
      );
      soundManager.playCoin();
      showAlert(`🛒 Compra realizada: ${quantity}x ${listing.productName} (-${totalCost} 🪙)`);
    } finally {
      pendingEconomyActionsRef.current.delete(pendingKey);
    }
  };

  // Venda Rápida no Balcão do Mercado
  const handleInstantSell = (productId: ProductId, quantity: number) => {
    const item = player.inventory[productId];
    if (!item || item.count < quantity || quantity <= 0) {
      showAlert('Quantidade insuficiente para venda rápida.');
      return;
    }

    const unitVal =
      MARKET_PRODUCT_INFO[productId]?.defaultPrice ||
      CROPS_CATALOG[productId as CropType]?.sellValue ||
      item.value ||
      25;
    const totalEarned = unitVal * quantity;

    setPlayer((prev) => {
      const curItem = prev.inventory[productId];
      if (!curItem || curItem.count < quantity) return prev;

      const newCount = curItem.count - quantity;
      const newInventory = { ...prev.inventory };
      if (newCount <= 0) {
        delete newInventory[productId];
      } else {
        newInventory[productId] = { ...curItem, count: newCount };
      }

      const newCoins = prev.coins + totalEarned;
      addLocalCoins(totalEarned);

      fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: prev.id,
          amount: totalEarned,
          reason: `Venda rápida no balcão de ${quantity}x ${curItem.name}`,
        }),
      }).catch(() => {});

      return {
        ...prev,
        coins: newCoins,
        inventory: newInventory,
      };
    });

    soundManager.playCoin();
    showAlert(`💰 Venda rápida no balcão: +${totalEarned} moedas 🪙 recebidas por ${quantity}x ${item.name}!`);
  };

  const handleCreateMarketListing = async (productId: ProductId, quantity: number, pricePerUnit: number): Promise<boolean> => {
    const item = player.inventory[productId];
    if (!item || item.count < quantity) {
      showAlert('Quantidade indisponível na mochila para anunciar!');
      return false;
    }

    const state = await runMarketStateAction(
      `restock:${productId}`,
      () => restockMarketProduct(player.id, productId, quantity, pricePerUnit)
    );
    if (!state) return false;
    soundManager.playPop();
    showAlert(`🏪 ${quantity}x ${item.name} anunciado!`);
    isaAssistantService.onRestockCelebration(item.name);
    return true;
  };

  // --- LANDS & EXPANSION HANDLERS ---
  const handleBuyLand = async (landId: string) => {
    const targetLand = lands.find((entry) => entry.id === landId);
    if (!targetLand) {
      showAlert('Talhão não encontrado!');
      return;
    }
    if (targetLand.status === 'owned') {
      showAlert('Este talhão já foi adquirido!');
      return;
    }
    if (player.coins < targetLand.price) {
      showAlert(`Moedas insuficientes! O talhão custa ${targetLand.price} 🪙 (você possui ${player.coins} 🪙).`);
      return;
    }

    const landPrice = targetLand.price;
    setPlayer((prev) => {
      const newCoins = prev.coins - landPrice;
      addLocalCoins(-landPrice);

      fetch('/api/wallet/debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: prev.id,
          amount: landPrice,
          reason: `Compra do talhão ${targetLand.name}`,
        }),
      }).catch(() => {});

      return {
        ...prev,
        coins: newCoins,
        ownedLandIds: [...prev.ownedLandIds, landId],
      };
    });

    const updatedLands = lands.map((l) =>
      l.id === landId ? { ...l, status: 'owned' as const, ownerId: player.id, ownerName: player.nickname } : l
    );
    setLands(updatedLands);
    engineRef.current?.updateLands(updatedLands, player.id);

    try {
      await fetch('/api/lands/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landId,
          buyerId: player.id,
          buyerName: player.nickname,
          buyerCoins: player.coins,
        }),
      });
    } catch {
      // local purchase confirmed
    }

    soundManager.playCoin();
    soundManager.playLevelUp();
    showAlert(`🎉 Parabéns! Você adquiriu "${targetLand.name}" por ${landPrice} 🪙!`);
    isaVoiceManager.speak('Que vitória linda! Nossa fazendinha está se expandindo!', 'jumping');
  };

  const handleAddConstruction = (
    _landId: string,
    _type: 'fence' | 'shed' | 'animal_pen' | 'garden_bed' | 'lantern',
    label: string
  ) => {
    showAlert(`A construção "${label}" foi posicionada na fazenda!`);
  };

  const handleTeleportToLand = (x: number, z: number) => {
    if (engineRef.current) {
      engineRef.current.localPlayer.root.position.set(x, 0, z);
      engineRef.current.playerPos.set(x, 0, z);
      showAlert('📍 Você chegou ao seu terreno!');
    }
  };

  // Community Goal Reward
  const handleClaimCommunityReward = () => {
    if (communityClaimed) {
      showAlert('Você já resgatou esta recompensa comunitária!');
      return;
    }
    if (!communityGoal.completed && communityGoal.current < communityGoal.target) {
      showAlert('A meta comunitária ainda está em andamento! Colha mais milho para atingir o objetivo!');
      return;
    }

    const earnedCoins = Number(communityGoal.rewardCoins || 250);
    const earnedXp = Number(communityGoal.rewardXp || 180);

    setPlayer((prev) => {
      const newCoins = prev.coins + earnedCoins;
      addLocalCoins(earnedCoins);
      fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: prev.id,
          amount: earnedCoins,
          reason: `Recompensa da meta comunitária: ${communityGoal.title}`,
        }),
      }).catch(() => {});
      return {
        ...prev,
        coins: newCoins,
      };
    });

    addXp(earnedXp);
    setCommunityClaimed(true);
    soundManager.playCoin();
    soundManager.playLevelUp();
    showAlert(`🎉 Recompensa comunitária resgatada: +${earnedCoins} moedas 🪙 e +${earnedXp} XP ⭐!`);
    isaVoiceManager.speak('Glória a Deus pelo nosso esforço comunitário! Todos ganham!', 'dancing');
  };

  // Quick Chat Send
  const handleSendChat = (text: string) => {
    networkManager.sendChat(text, player.nickname);
    engineRef.current?.localPlayer.setChatBubble(text);
    setTimeout(() => {
      engineRef.current?.localPlayer.setChatBubble(null);
    }, 6000);
    showAlert(`💬 Você disse: "${text}"`);
  };

  // Toggle Sound
  const handleToggleMute = () => {
    const muted = soundManager.toggleMute();
    isaVoiceManager.setVoiceMuted(muted);
    setIsMuted(muted);
  };

  // Admin Actions
  const handleAdminRain = () => {
    soundManager.playWater();
    setPlots((prev) => {
      const next = prev.map((p) => ({ ...p, watered: true }));
      engineRef.current?.updatePlotMeshes(next);
      return next;
    });
    showAlert('🌧️ Chuva mágica administrada! Todos os talhões foram regados!');
  };

  const handleAdminInstantGrow = () => {
    soundManager.playHarvest();
    setPlots((prev) => {
      const next = prev.map((p) => (p.cropType ? { ...p, stage: 5 } : p));
      engineRef.current?.updatePlotMeshes(next);
      return next;
    });
    showAlert('⚡ Crescimento instantâneo! Todas as plantas estão maduras (Estágio 5/5)!');
  };

  const activeMission = missions.find((m) => !m.claimed);
  const databaseSeedCosts = Object.fromEntries(
    (marketState?.products ?? [])
      .map((product) => [product.product_id, Number(product.seed_cost)] as const)
      .filter(([productId, cost]) => productId in CROPS_CATALOG && Number.isSafeInteger(cost) && cost > 0)
  ) as Partial<Record<CropType, number>>;

  const effectiveInteractionTarget = useMemo(() => {
    if (!currentTarget) return null;
    if (currentTarget.type === 'plot') {
      const plotId = Number(currentTarget.id);
      const plot = plots.find((p) => p.id === plotId);
      if (!plot) return currentTarget;

      if (!plot.cropType || plot.stage === 0) {
        const cropMeta = CROPS_CATALOG[selectedSeed] || CROPS_CATALOG.corn;
        return {
          ...currentTarget,
          label: 'Plantar',
          icon: cropMeta.icon || '🌱',
        };
      } else if (plot.stage < 5) {
        if (!plot.watered) {
          return {
            ...currentTarget,
            label: 'Regar',
            icon: '💧',
          };
        } else {
          return {
            ...currentTarget,
            label: `${plot.stage}/5 (Crescendo)`,
            icon: '🌱',
          };
        }
      } else {
        return {
          ...currentTarget,
          label: 'Colher',
          icon: '🌾',
        };
      }
    }
    return currentTarget;
  }, [currentTarget, plots, selectedSeed, player.inventory]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-sky-200 select-none font-['Nunito',sans-serif]">
      {/* 3D Canvas Mount Point */}
      <div ref={canvasMountRef} className="absolute inset-0 z-0 w-full h-full" />

      {/* Title Screen Overlay */}
      {!isPlaying && (
        <TitleScreen
          onStartGame={handleStartGame}
          playersOnlineCount={playersOnlineCount}
        />
      )}

      {/* Floating Isa Voice Subtitles & Emotion Banner */}
      {isPlaying && (
        <IsaReactionBanner
          speech={isaSubtitles?.text || null}
          animationState={isaSubtitles?.animation || 'idle'}
          onDismiss={() => isaVoiceManager.clear()}
        />
      )}

      {/* In-Game HUD */}
      {isPlaying && (
        <HUD
          player={player}
          communityGoal={communityGoal}
          activeMission={activeMission}
          isaDiagnosis={isaDiagnosis}
          interactionTarget={effectiveInteractionTarget}
          selectedSeed={selectedSeed}
          onSelectSeed={(crop) => {
            setSelectedSeed(crop);
            soundManager.playPop();
            showAlert(`🌱 Semente de ${CROPS_CATALOG[crop].name} equipada!`);
          }}
          onInteract={handleContextualInteract}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onOpenShop={() => setIsShopOpen(true)}
          onOpenExpandFarm={() => setIsExpandFarmOpen(true)}
          onOpenMarket={() => setIsMarketOpen(true)}
          onOpenOrders={() => setIsMarketOpen(true)}
          onOpenLands={() => setIsLandMarketOpen(true)}
          onOpenMyPlots={() => setIsLandMarketOpen(true)}
          onOpenHarvestConfig={() => setIsHarvestConfigOpen(true)}
          onOpenMyFarm={() => setIsLandMarketOpen(true)}
          onOpenAvatarCustomizer={() => setIsAvatarCustomizerOpen(true)}
          onOpenCommunityGoal={() => setIsCommunityGoalOpen(true)}
          onOpenChat={() => setIsChatOpen(true)}
          onOpenIsaDialogue={() => setIsIsaModalOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          onJoystickMove={(vec) => {
            if (engineRef.current) {
              engineRef.current.joystickVector = vec;
            }
          }}
          playersOnlineCount={playersOnlineCount}
          onlinePlayerNames={onlinePlayerNames}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          floatingAlert={floatingAlert}
          isaSubtitles={isaSubtitles}
          onDismissSubtitles={() => isaVoiceManager.clear()}
          atmosphere={atmosphere}
          simulatedHour={simulatedHour}
          onSetSimulatedHour={handleSetSimulatedHour}
        />
      )}

      {/* Modals */}
      <IsaDialogueModal
        isOpen={isIsaModalOpen}
        onClose={() => setIsIsaModalOpen(false)}
        missions={missions}
        onClaimReward={handleClaimMissionReward}
        onGiveFreeSeeds={handleGiveFreeSeeds}
        marketState={marketState}
        plots={plots}
        inventory={player.inventory}
        currentUserId={player.id}
        onOpenMarketTab={() => setIsMarketOpen(true)}
        onOpenMyPlots={() => setIsLandMarketOpen(true)}
      />

      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        inventory={player.inventory}
        onSellItem={handleSellItem}
        selectedSeed={selectedSeed}
        onSelectSeed={(seed) => {
          setSelectedSeed(seed as CropType);
          showAlert(`🌱 Semente de ${seed} equipada para plantio!`);
        }}
      />

      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        playerCoins={player.coins}
        seedCosts={databaseSeedCosts}
        playerInventory={player.inventory}
        recommendation={isaDiagnosis.recommendations[0] || null}
        onBuySeed={handleBuySeed}
        onBuyFeed={handleBuyFeed}
      />

      <ExpandFarmModal
        isOpen={isExpandFarmOpen}
        onClose={() => setIsExpandFarmOpen(false)}
        playerCoins={player.coins}
        unlockedPackageIds={purchasedExpansions}
        totalPlotsCount={plots.length}
        onBuyExpansion={handleBuyExpansion}
      />

      <MarketModal
        isOpen={isMarketOpen}
        onClose={() => setIsMarketOpen(false)}
        marketState={marketState}
        playerCoins={player.coins}
        inventory={player.inventory}
        marketListings={marketListings}
        onBuyListing={handleBuyMarketListing}
        onInstantSell={handleInstantSell}
        onCreateListing={handleCreateMarketListing}
      />

      <LandMarketModal
        isOpen={isLandMarketOpen}
        onClose={() => setIsLandMarketOpen(false)}
        lands={lands}
        playerCoins={player.coins}
        playerId={player.id}
        onBuyLand={handleBuyLand}
        onAddConstruction={handleAddConstruction}
        onTeleportToLand={handleTeleportToLand}
      />

      <CommunityGoalModal
        isOpen={isCommunityGoalOpen}
        onClose={() => setIsCommunityGoalOpen(false)}
        goal={communityGoal}
        onClaimCommunityReward={handleClaimCommunityReward}
        claimed={communityClaimed}
      />

      <QuickChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onSendMessage={handleSendChat}
      />

      <AvatarCustomizerModal
        isOpen={isAvatarCustomizerOpen}
        onClose={() => setIsAvatarCustomizerOpen(false)}
        currentAvatar={player.avatar}
        onSelectAvatar={(avatarId) => {
          setPlayer((prev) => ({ ...prev, avatar: avatarId }));
          showAlert('Avatar atualizado com sucesso!');
        }}
      />

      {/* PAINEL ADMINISTRATIVO: Apenas aberto se o jogador tiver a role isa_owner */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isOwnerRole={player.role === 'isa_owner'}
        onTriggerRain={handleAdminRain}
        onInstantGrow={handleAdminInstantGrow}
        onAddCoins={(_amount) => {
          showAlert('Crédito administrativo bloqueado: ainda não existe um RPC autenticado e auditável para essa operação.');
        }}
        onResetGoal={() => {
          setCommunityGoal((prev) => ({ ...prev, current: 0, completed: false }));
          showAlert('🔄 Meta coletiva reiniciada para 0!');
        }}
        playersCount={playersOnlineCount}
        onlinePlayerNames={onlinePlayerNames}
        lands={lands}
        marketListings={marketListings}
      />

      {/* Modal de Distribuição da Colheita (Opção A, B ou C ao Colher) */}
      {harvestModalData && (
        <HarvestDistributionModal
          isOpen={!!harvestModalData}
          onClose={() => setHarvestModalData(null)}
          cropType={harvestModalData.cropType}
          totalYield={harvestModalData.totalYield}
          onConfirm={(pref) => {
            void handleExecuteHarvest(harvestModalData.plot, pref);
          }}
        />
      )}

      {/* Modal de Configuração de Preferência de Colheita (aberto via HUD) */}
      <HarvestDistributionModal
        isOpen={isHarvestConfigOpen}
        onClose={() => setIsHarvestConfigOpen(false)}
        cropType={selectedSeed}
        totalYield={2}
        onConfirm={(pref) => {
          saveHarvestPreference(pref);
          if (player.id) saveHarvestPreferenceToSupabase(player.id, pref);
          showAlert('⚖️ Preferência de colheita atualizada e salva no Supabase!');
        }}
      />
    </div>
  );
}
