import {
  CROPS_CATALOG,
  FarmLand,
  FarmPlot,
  InventoryItem,
  MARKET_PRODUCT_INFO,
  MarketListing,
  ProductId,
} from '../types/game';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface MarketStateProduct {
  product_id: string;
  name: string;
  category: string;
  icon: string;
  description?: string;
  min_price?: number;
  recommended_price?: number;
  max_price?: number;
  growth_seconds?: number;
  seed_cost?: number;
  [key: string]: unknown;
}

export interface FarmReputationState {
  seller_id?: string;
  reputation_score: number;
  total_sales: number;
  total_visits: number;
  missed_sales: number;
  last_visit_at?: string;
}

export interface StockNotificationState {
  id: string;
  product_id: string;
  notification_type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface MarketStateSnapshot {
  player: { id: string; nickname: string; avatar_id: string };
  wallet: { coins: number };
  inventory: Array<{ item_id: string; quantity: number }>;
  stall: { id: string; owner_id: string; stall_name: string } | null;
  products: MarketStateProduct[];
  listings: Array<{
    id: string;
    stall_id: string;
    seller_id: string;
    seller_name: string;
    stall_name: string;
    product_id: string;
    product_name: string;
    icon: string;
    category: string;
    quantity: number;
    price_per_unit: number;
    sold_count: number;
    updated_at: string;
  }>;
  transactions: Array<Record<string, unknown>>;
  farm_plots: Array<{
    id: number;
    cropType: string | null;
    stage: number;
    watered: boolean;
    plantedAt: string | null;
    growthTime: number;
    ownerId: string | null;
  }>;
  lands: Array<{ id: string; name: string; price: number; owner_id: string | null }>;
  owned_land_ids: string[];
  npc_budget_remaining: number | null;
  reputation?: FarmReputationState;
  notifications?: StockNotificationState[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMarketState(value: unknown): MarketStateSnapshot {
  if (!isRecord(value) || !isRecord(value.player) || !isRecord(value.wallet)) {
    throw new Error('O banco retornou um estado de fazenda incompleto.');
  }

  const playerId = value.player.id;
  const nickname = value.player.nickname;
  const avatarId = value.player.avatar_id;
  const coins = Number(value.wallet.coins);
  const requiredArrays = ['inventory', 'products', 'listings', 'transactions', 'farm_plots', 'lands', 'owned_land_ids'];

  if (typeof playerId !== 'string' || typeof nickname !== 'string' || typeof avatarId !== 'string' || !Number.isSafeInteger(coins) || coins < 0) {
    throw new Error('O perfil ou a carteira retornados pelo banco são inválidos.');
  }
  if (requiredArrays.some((key) => !Array.isArray(value[key]))) {
    throw new Error('O banco retornou coleções incompletas para o jogador.');
  }

  return value as unknown as MarketStateSnapshot;
}

export type MarketFarmAction = 'plant' | 'water' | 'harvest';

export interface MarketBuyResult {
  state: MarketStateSnapshot;
  duplicate: boolean;
}

const knownMarketErrors = [
  'Autenticação necessária',
  'Moedas insuficientes',
  'Quantidade inválida',
  'Barraca não encontrada',
  'Não pode comprar da própria barraca',
  'Estoque insuficiente',
  'Semente indisponível',
  'Você não possui essa semente',
  'Talhão inválido',
  'Talhão não encontrado',
  'Talhão ocupado',
  'Não é possível regar este talhão',
  'Talhão vazio',
  'Plantação ainda não amadureceu',
  'Ação agrícola inválida',
  'Produto indisponível para venda',
  'Preço fora da faixa permitida',
  'Você não possui quantidade suficiente',
];

function marketOperationError(error: unknown): Error {
  const rawMessage = isRecord(error) && typeof error.message === 'string' ? error.message : '';
  const knownMessage = knownMarketErrors.find((message) => rawMessage.includes(message));
  return new Error(knownMessage || 'Não foi possível confirmar a operação no Supabase. O estado anterior foi preservado.');
}

let localMarketState: MarketStateSnapshot | null = null;

export function getLocalMarketState(): MarketStateSnapshot | null {
  return localMarketState;
}

export function updateLocalCoins(coins: number): number {
  if (localMarketState && localMarketState.wallet) {
    localMarketState.wallet.coins = Math.max(0, Math.round(coins));
    return localMarketState.wallet.coins;
  }
  return coins;
}

export function addLocalCoins(amount: number): number {
  if (localMarketState && localMarketState.wallet) {
    localMarketState.wallet.coins = Math.max(0, localMarketState.wallet.coins + Math.round(amount));
    return localMarketState.wallet.coins;
  }
  return amount;
}

export function createFallbackMarketState(playerId: string, nickname = 'Fazendeiro', avatarId = 'leo'): MarketStateSnapshot {
  return {
    player: { id: playerId, nickname: nickname || 'Fazendeiro', avatar_id: avatarId || 'leo' },
    wallet: { coins: 150 },
    inventory: [
      { item_id: 'corn_seed', quantity: 8 },
      { item_id: 'carrot_seed', quantity: 6 },
      { item_id: 'tomato_seed', quantity: 4 },
      { item_id: 'feed', quantity: 5 },
      { item_id: 'corn', quantity: 3 },
    ],
    stall: { id: `stall-${playerId.slice(0, 8)}`, owner_id: playerId, stall_name: `Barraca de ${nickname}` },
    products: [
      { product_id: 'corn', name: 'Milho Dourado', category: 'crop', icon: '🌽', seed_cost: 10, recommended_price: 25 },
      { product_id: 'carrot', name: 'Cenoura Crocante', category: 'crop', icon: '🥕', seed_cost: 8, recommended_price: 20 },
      { product_id: 'tomato', name: 'Tomate Vermelhinho', category: 'crop', icon: '🍅', seed_cost: 12, recommended_price: 30 },
      { product_id: 'pumpkin', name: 'Abóbora Gigante', category: 'crop', icon: '🎃', seed_cost: 25, recommended_price: 55 },
      { product_id: 'strawberry', name: 'Morango Doce', category: 'crop', icon: '🍓', seed_cost: 20, recommended_price: 45 },
      { product_id: 'milk', name: 'Leite Fresco', category: 'product', icon: '🥛', recommended_price: 35 },
      { product_id: 'egg', name: 'Ovos Caipiras', category: 'product', icon: '🥚', recommended_price: 25 },
      { product_id: 'wool', name: 'Lã Macia', category: 'product', icon: '🧶', recommended_price: 50 },
      { product_id: 'truffle', name: 'Trufa Rara', category: 'product', icon: '🍄', recommended_price: 90 },
    ],
    listings: [],
    transactions: [],
    farm_plots: [
      { id: 0, cropType: 'corn', stage: 5, watered: true, plantedAt: new Date(Date.now() - 35000).toISOString(), growthTime: 22, ownerId: null },
      { id: 1, cropType: 'corn', stage: 5, watered: true, plantedAt: new Date(Date.now() - 35000).toISOString(), growthTime: 22, ownerId: null },
      { id: 2, cropType: 'carrot', stage: 3, watered: true, plantedAt: new Date(Date.now() - 12000).toISOString(), growthTime: 18, ownerId: null },
      { id: 3, cropType: 'tomato', stage: 5, watered: true, plantedAt: new Date(Date.now() - 40000).toISOString(), growthTime: 25, ownerId: null },
      { id: 4, cropType: 'bean', stage: 2, watered: false, plantedAt: new Date(Date.now() - 8000).toISOString(), growthTime: 24, ownerId: null },
      { id: 5, cropType: 'strawberry', stage: 2, watered: true, plantedAt: new Date(Date.now() - 10000).toISOString(), growthTime: 32, ownerId: null },
      { id: 6, cropType: 'lettuce', stage: 4, watered: true, plantedAt: new Date(Date.now() - 14000).toISOString(), growthTime: 16, ownerId: null },
      { id: 7, cropType: 'wheat', stage: 2, watered: false, plantedAt: new Date(Date.now() - 10000).toISOString(), growthTime: 28, ownerId: null },
      { id: 8, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 9, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 10, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 11, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 12, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 13, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 14, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
      { id: 15, cropType: null, stage: 0, watered: false, plantedAt: null, growthTime: 25, ownerId: null },
    ],
    lands: [
      { id: 'talhao-001', name: 'Talhão Pequeno da Entrada', price: 500, owner_id: null },
      { id: 'talhao-002', name: 'Talhão Médio da Colina', price: 1200, owner_id: null },
      { id: 'talhao-003', name: 'Talhão Grande das Macieiras', price: 2500, owner_id: null },
      { id: 'talhao-004', name: 'Talhão Especial Safra Nobre', price: 3800, owner_id: null },
      { id: 'talhao-005', name: 'Talhão Beira-Rio', price: 5000, owner_id: null },
      { id: 'talhao-006', name: 'Talhão Mirante do Lago', price: 8000, owner_id: null },
    ],
    owned_land_ids: [],
    npc_budget_remaining: 1000,
    reputation: {
      reputation_score: 100.0,
      total_sales: 0,
      total_visits: 0,
      missed_sales: 0,
    },
    notifications: [],
  };
}

async function getAuthenticatedClient(expectedPlayerId: string): Promise<SupabaseClient | null> {
  if (!supabase || !expectedPlayerId || expectedPlayerId.startsWith('guest-')) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user || data.user.id !== expectedPlayerId) return null;
    return supabase;
  } catch {
    return null;
  }
}

async function callStateRpc(
  client: SupabaseClient,
  functionName: string,
  args?: Record<string, unknown>
): Promise<MarketStateSnapshot> {
  const { data, error } = await client.rpc(functionName, args);
  if (error) throw marketOperationError(error);
  return parseMarketState(data);
}

export async function grantStarterSeedsInSupabase(client: SupabaseClient, playerId: string): Promise<void> {
  try {
    const starterSeeds = [
      { player_id: playerId, item_id: 'corn_seed', category: 'seed', quantity: 5 },
      { player_id: playerId, item_id: 'carrot_seed', category: 'seed', quantity: 5 },
      { player_id: playerId, item_id: 'tomato_seed', category: 'seed', quantity: 4 },
      { player_id: playerId, item_id: 'feed', category: 'tool', quantity: 4 },
    ];
    for (const seed of starterSeeds) {
      await client.from('player_inventory').upsert(seed, { onConflict: 'player_id,item_id' });
    }
  } catch (err) {
    console.warn('Could not sync starter seeds in Supabase:', err);
  }
}

export async function addSeedsToInventoryInSupabase(
  playerId: string,
  cropType: string,
  quantity = 3
): Promise<void> {
  const seedId = `${cropType}_seed`;
  const client = await getAuthenticatedClient(playerId);
  if (client) {
    try {
      const { data: invData } = await client
        .from('player_inventory')
        .select('quantity')
        .eq('player_id', playerId)
        .eq('item_id', seedId);

      const currentQty = invData?.[0]?.quantity ?? 0;
      await client.from('player_inventory').upsert(
        {
          player_id: playerId,
          item_id: seedId,
          category: 'seed',
          quantity: currentQty + quantity,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id,item_id' }
      );
    } catch (err) {
      console.warn('Could not save seeds to Supabase player_inventory:', err);
    }
  }

  if (localMarketState) {
    const existing = localMarketState.inventory.find((i) => i.item_id === seedId);
    if (existing) existing.quantity += quantity;
    else localMarketState.inventory.push({ item_id: seedId, quantity });
  }
}

export async function ensureAndLoadMarketState(expectedPlayerId: string, nickname = 'Fazendeiro', avatarId = 'leo'): Promise<MarketStateSnapshot> {
  if (!expectedPlayerId || expectedPlayerId.startsWith('guest-')) {
    throw new Error('Autenticação obrigatória. Jogadores sem cadastro não possuem acesso aos dados da fazenda.');
  }

  const client = await getAuthenticatedClient(expectedPlayerId);
  if (!client) {
    if (!localMarketState) {
      localMarketState = createFallbackMarketState(expectedPlayerId, nickname, avatarId);
    }
    return localMarketState;
  }

  try {
    const { error: ensureError } = await client.rpc('market_ensure_player');
    if (ensureError) console.warn('market_ensure_player notice:', ensureError);

    const state = await callStateRpc(client, 'market_state');

    // Se o inventário do jogador estiver sem sementes, concede sementes iniciais no Supabase
    const totalSeeds = state.inventory
      .filter((i) => i.item_id.endsWith('_seed'))
      .reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

    if (totalSeeds === 0) {
      await grantStarterSeedsInSupabase(client, expectedPlayerId);
      const starterKit = [
        { item_id: 'corn_seed', quantity: 5 },
        { item_id: 'carrot_seed', quantity: 5 },
        { item_id: 'tomato_seed', quantity: 4 },
        { item_id: 'feed', quantity: 4 },
      ];
      for (const item of starterKit) {
        const found = state.inventory.find((i) => i.item_id === item.item_id);
        if (found) found.quantity = item.quantity;
        else state.inventory.push({ ...item });
      }
    }

    localMarketState = state;
    return state;
  } catch (err) {
    console.warn('Supabase market_state RPC fallback to local snapshot:', err);
    if (!localMarketState) localMarketState = createFallbackMarketState(expectedPlayerId, nickname, avatarId);
    return localMarketState;
  }
}

export async function performMarketFarmAction(
  playerId: string,
  plotId: number,
  action: MarketFarmAction,
  cropType?: string,
  harvestOptions?: { mode: 'A' | 'B' | 'C'; marketPct: number }
): Promise<MarketStateSnapshot> {
  if (!Number.isSafeInteger(plotId) || plotId < 0 || plotId > 63) {
    throw new Error('Talhão inválido.');
  }

  const client = await getAuthenticatedClient(playerId);
  if (!client) {
    throw new Error('Sua sessão do Supabase não foi confirmada. Entre novamente antes de alterar a fazenda.');
  }

  const safeCrop = cropType || 'corn';
  const harvestMode = harvestOptions?.mode || 'C';
  const requestedMarketPct = harvestOptions?.marketPct ?? 70;
  const marketPct = Number.isFinite(requestedMarketPct)
    ? Math.max(0, Math.min(100, Math.round(requestedMarketPct)))
    : 70;

  // A RPC executa a alteração de forma atômica no banco e retorna o estado persistido.
  // Não há fallback para gravações diretas ou estado local: uma falha precisa chegar à interface.
  const newState = await callStateRpc(client, 'market_farm_action', {
    p_plot_id: plotId,
    p_action: action,
    p_crop_type: action === 'plant' ? safeCrop : cropType ?? null,
    p_harvest_mode: harvestMode,
    p_market_pct: marketPct,
  });

  const updatedPlot = newState.farm_plots.find((plot) => plot.id === plotId);
  const actionWasConfirmed =
    !!updatedPlot &&
    ((action === 'plant' && updatedPlot.cropType === safeCrop) ||
      (action === 'water' && updatedPlot.watered === true) ||
      (action === 'harvest' && updatedPlot.cropType === null));

  if (!actionWasConfirmed) {
    throw new Error('O Supabase não confirmou a alteração do talhão. O estado anterior foi preservado.');
  }

  localMarketState = newState;
  return newState;
}
