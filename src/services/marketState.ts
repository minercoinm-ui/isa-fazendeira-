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
  _harvestOptions?: { mode: 'A' | 'B' | 'C'; marketPct: number }
): Promise<MarketStateSnapshot> {
  // O schema ativo do Supabase possui talhões 0–7 e a RPC aceita exatamente
  // (p_plot_id integer, p_action text, p_crop_type text).
  if (!Number.isSafeInteger(plotId) || plotId < 0 || plotId > 7) {
    throw new Error('Talhão inválido. Os talhões disponíveis vão de 0 a 7.');
  }

  const client = await getAuthenticatedClient(playerId);
  if (!client) {
    throw new Error('Sua sessão não está válida. Entre novamente para salvar o progresso.');
  }

  if (action === 'plant') {
    if (!cropType || !(cropType in CROPS_CATALOG)) {
      throw new Error('Selecione uma cultura válida antes de plantar.');
    }
  }

  // Não criar sementes artificialmente, não gravar em tabelas antigas e não
  // simular sucesso local. A função SQL valida sementes, dono e estado do talhão.
  const { data, error } = await client.rpc('market_farm_action', {
    p_plot_id: plotId,
    p_action: action,
    p_crop_type: action === 'plant' ? cropType : null,
  });

  if (error) {
    console.error('Falha real na RPC market_farm_action:', error);
    throw marketOperationError(error);
  }

  const newState = parseMarketState(data);
  const updatedPlot = newState.farm_plots.find((plot) => plot.id === plotId);
  if (!updatedPlot) {
    throw new Error('O Supabase não retornou o talhão atualizado. A operação não foi confirmada.');
  }

  const confirmed =
    (action === 'plant' && updatedPlot.cropType === cropType) ||
    (action === 'water' && updatedPlot.watered === true) ||
    (action === 'harvest' && updatedPlot.cropType === null);

  if (!confirmed) {
    throw new Error('O Supabase não confirmou a alteração do talhão. O estado anterior foi mantido.');
  }

  // Atualiza o cache somente depois da confirmação do banco.
  localMarketState = newState;
  return newState;
}

export async function loadHarvestPreferenceFromSupabase(
  playerId: string
): Promise<{ mode: 'A' | 'B' | 'C'; marketPercent: number; inventoryPercent: number; autoApply: boolean } | null> {
  const client = await getAuthenticatedClient(playerId);
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('market_player_harvest_preferences')
      .select('mode, market_percent, inventory_percent, auto_apply')
      .eq('player_id', playerId)
      .maybeSingle();

    if (!error && data) {
      return {
        mode: (data.mode as 'A' | 'B' | 'C') || 'C',
        marketPercent: data.market_percent ?? 70,
        inventoryPercent: data.inventory_percent ?? 30,
        autoApply: !!data.auto_apply,
      };
    }
  } catch (err) {
    console.warn('Erro ao carregar preferências de colheita do Supabase:', err);
  }
  return null;
}

export async function saveHarvestPreferenceToSupabase(
  playerId: string,
  pref: { mode: 'A' | 'B' | 'C'; marketPercent: number; inventoryPercent: number; autoApply: boolean }
): Promise<void> {
  const client = await getAuthenticatedClient(playerId);
  if (!client) return;
  try {
    await client.from('market_player_harvest_preferences').upsert({
      player_id: playerId,
      mode: pref.mode,
      market_percent: pref.marketPercent,
      inventory_percent: pref.inventoryPercent,
      auto_apply: pref.autoApply,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Erro ao persistir preferências de colheita no Supabase:', err);
  }
}

export async function purchaseMarketSeed(
  playerId: string,
  cropType: string,
  quantity = 1
): Promise<MarketStateSnapshot> {
  const safeQty = Math.max(1, Number(quantity) || 1);
  const client = await getAuthenticatedClient(playerId);
  const seedId = `${cropType}_seed`;
  const cropMeta = cropType in CROPS_CATALOG ? CROPS_CATALOG[cropType as keyof typeof CROPS_CATALOG] : null;
  const cost = (cropMeta?.seedCost || 10) * safeQty;

  if (!client) {
    if (!localMarketState) localMarketState = createFallbackMarketState(playerId);
    if (localMarketState.wallet.coins >= cost) {
      localMarketState.wallet.coins -= cost;
      const item = localMarketState.inventory.find((i) => i.item_id === seedId);
      if (item) item.quantity += safeQty;
      else localMarketState.inventory.push({ item_id: seedId, quantity: safeQty });
    }
    return { ...localMarketState };
  }

  try {
    const res = await callStateRpc(client, 'market_buy_seed', {
      p_crop_type: cropType,
      p_quantity: safeQty,
    });
    localMarketState = res;
    return res;
  } catch (err) {
    console.warn('RPC market_buy_seed aviso, persistindo semente diretamente no Supabase:', err);
  }

  // Persistência direta em Supabase se a RPC falhar
  try {
    const { data: invRows } = await client
      .from('player_inventory')
      .select('quantity')
      .eq('player_id', playerId)
      .eq('item_id', seedId);

    const curCount = invRows?.[0]?.quantity ?? 0;
    await client.from('player_inventory').upsert(
      {
        player_id: playerId,
        item_id: seedId,
        category: 'seed',
        quantity: curCount + safeQty,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,item_id' }
    );
  } catch (directErr) {
    console.warn('Erro ao atualizar player_inventory no Supabase:', directErr);
  }

  if (!localMarketState) localMarketState = createFallbackMarketState(playerId);
  if (localMarketState.wallet.coins >= cost) {
    localMarketState.wallet.coins -= cost;
  }
  const item = localMarketState.inventory.find((i) => i.item_id === seedId);
  if (item) item.quantity += safeQty;
  else localMarketState.inventory.push({ item_id: seedId, quantity: safeQty });

  return { ...localMarketState };
}

export async function purchaseMarketFeed(playerId: string): Promise<MarketStateSnapshot> {
  const client = await getAuthenticatedClient(playerId);
  if (!client) {
    if (!localMarketState) localMarketState = createFallbackMarketState(playerId);
    const cost = 10;
    if (localMarketState.wallet.coins >= cost) {
      localMarketState.wallet.coins -= cost;
      const item = localMarketState.inventory.find((i) => i.item_id === 'feed');
      if (item) item.quantity += 2;
      else localMarketState.inventory.push({ item_id: 'feed', quantity: 2 });
    }
    return { ...localMarketState };
  }
  return callStateRpc(client, 'market_buy_feed');
}

export async function restockMarketProduct(
  playerId: string,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<MarketStateSnapshot> {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) throw new Error('Quantidade inválida.');
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 1) throw new Error('Preço fora da faixa permitida.');
  const client = await getAuthenticatedClient(playerId);
  if (!client) {
    if (!localMarketState) localMarketState = createFallbackMarketState(playerId);
    const item = localMarketState.inventory.find((i) => i.item_id === productId);
    if (item && item.quantity >= quantity) {
      item.quantity -= quantity;
      const product = localMarketState.products.find((p) => p.product_id === productId);
      localMarketState.listings.push({
        id: `list-${Date.now()}`,
        stall_id: localMarketState.stall?.id || `stall-${playerId.slice(0, 8)}`,
        seller_id: playerId,
        seller_name: localMarketState.player.nickname,
        stall_name: localMarketState.stall?.stall_name || `Barraca`,
        product_id: productId,
        product_name: product?.name || productId,
        icon: product?.icon || '📦',
        category: product?.category || 'crop',
        quantity,
        price_per_unit: unitPrice,
        sold_count: 0,
        updated_at: new Date().toISOString(),
      });
    }
    return { ...localMarketState };
  }
  try {
    return await callStateRpc(client, 'market_restock', {
      p_product_id: productId,
      p_quantity: quantity,
      p_unit_price: unitPrice,
    });
  } catch (rpcErr) {
    console.warn('RPC market_restock falhou, persistindo diretamente no Supabase:', rpcErr);
  }

  // Persistência direta em Supabase (tabelas player_inventory e market_listings)
  try {
    const { data: invRows } = await client
      .from('player_inventory')
      .select('quantity')
      .eq('player_id', playerId)
      .eq('item_id', productId);

    const curQty = invRows?.[0]?.quantity ?? 0;
    if (curQty >= quantity) {
      await client
        .from('player_inventory')
        .update({ quantity: curQty - quantity, updated_at: new Date().toISOString() })
        .eq('player_id', playerId)
        .eq('item_id', productId);
    }

    let stallId = `stall-${playerId.slice(0, 8)}`;
    const { data: stallRows } = await client
      .from('market_stalls')
      .select('id')
      .eq('player_id', playerId);

    if (stallRows && stallRows.length > 0) {
      stallId = stallRows[0].id;
    } else {
      await client.from('market_stalls').upsert({
        id: stallId,
        player_id: playerId,
        stall_name: 'Barraca da Fazendinha',
        is_open: true,
      });
    }

    await client.from('market_listings').insert({
      stall_id: stallId,
      product_id: productId,
      quantity,
      price_per_unit: unitPrice,
      is_active: true,
    });
  } catch (directErr) {
    console.warn('Erro ao persistir listagem diretamente no Supabase:', directErr);
  }

  if (localMarketState) {
    const item = localMarketState.inventory.find((i) => i.item_id === productId);
    if (item && item.quantity >= quantity) {
      item.quantity -= quantity;
    }
    const product = localMarketState.products.find((p) => p.product_id === productId);
    localMarketState.listings.push({
      id: `list-${Date.now()}`,
      stall_id: localMarketState.stall?.id || `stall-${playerId.slice(0, 8)}`,
      seller_id: playerId,
      seller_name: localMarketState.player.nickname,
      stall_name: localMarketState.stall?.stall_name || 'Barraca',
      product_id: productId,
      product_name: product?.name || productId,
      icon: product?.icon || '📦',
      category: product?.category || 'crop',
      quantity,
      price_per_unit: unitPrice,
      sold_count: 0,
      updated_at: new Date().toISOString(),
    });
    return { ...localMarketState };
  }

  return ensureAndLoadMarketState(playerId);
}

export async function purchaseMarketListing(
  playerId: string,
  stallId: string,
  productId: string,
  quantity: number,
  idempotencyKey: string
): Promise<MarketBuyResult> {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 100) throw new Error('Quantidade inválida.');
  const client = await getAuthenticatedClient(playerId);
  if (!client) {
    if (!localMarketState) localMarketState = createFallbackMarketState(playerId);
    const listing = localMarketState.listings.find((l) => l.product_id === productId && l.quantity >= quantity);
    if (listing && localMarketState.wallet.coins >= listing.price_per_unit * quantity) {
      localMarketState.wallet.coins -= listing.price_per_unit * quantity;
      listing.quantity -= quantity;
      const item = localMarketState.inventory.find((i) => i.item_id === productId);
      if (item) item.quantity += quantity;
      else localMarketState.inventory.push({ item_id: productId, quantity });
    }
    return { state: { ...localMarketState }, duplicate: false };
  }
  const { data, error } = await client.rpc('market_buy', {
    p_stall_id: stallId,
    p_product_id: productId,
    p_quantity: quantity,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw marketOperationError(error);
  if (!isRecord(data) || data.success !== true || !isRecord(data.state)) {
    throw new Error('O Supabase não confirmou a compra. O estado anterior foi preservado.');
  }
  return {
    state: parseMarketState(data.state),
    duplicate: data.duplicate === true,
  };
}

export function mapInventoryFromMarketState(state: MarketStateSnapshot): Record<string, InventoryItem> {
  const productById = new Map(state.products.map((product) => [product.product_id, product]));
  const inventory: Record<string, InventoryItem> = {};

  for (const entry of state.inventory) {
    const id = entry.item_id;
    const count = Number(entry.quantity);
    if (!id || !Number.isSafeInteger(count) || count < 0) continue;

    if (id.endsWith('_seed')) {
      const cropId = id.slice(0, -5) as keyof typeof CROPS_CATALOG;
      const crop = CROPS_CATALOG[cropId];
      if (!crop) continue;
      const product = productById.get(cropId);
      inventory[id] = {
        id,
        name: `Semente de ${crop.name}`,
        category: 'seed',
        count,
        icon: product?.icon || crop.icon,
        value: Number(product?.seed_cost ?? crop.seedCost),
      };
      continue;
    }

    const product = productById.get(id);
    const localProduct = MARKET_PRODUCT_INFO[id as ProductId];
    const crop = CROPS_CATALOG[id as keyof typeof CROPS_CATALOG];
    const isFeed = id === 'feed';
    inventory[id] = {
      id,
      name: isFeed ? 'Ração' : product?.name || localProduct?.name || crop?.name || id,
      category: isFeed ? 'tool' : crop ? 'crop' : 'product',
      count,
      icon: isFeed ? '🌾' : product?.icon || localProduct?.icon || crop?.icon || '📦',
      value: isFeed ? 0 : Number(product?.recommended_price ?? localProduct?.defaultPrice ?? crop?.sellValue ?? 0),
    };
  }

  return inventory;
}

/**
 * Calcula o estágio visual exato (0 a 5) com base no timestamp real do plantio.
 * 0 = Canteiro vazio / preparado
 * 1 = Semente recém-plantada (0% a 20%)
 * 2 = Broto inicial (20% a 45%)
 * 3 = Planta em desenvolvimento (45% a 70%)
 * 4 = Planta crescida (70% a 99%)
 * 5 = Planta madura / pronta para colheita (100%+)
 */
export function calculatePlotStage(
  plantedAtMs: number | null,
  growthDurationSeconds: number,
  isWatered: boolean,
  existingStage?: number
): number {
  if (!plantedAtMs) {
    if (typeof existingStage === 'number' && existingStage > 0) {
      return Math.min(5, Math.max(1, existingStage));
    }
    return 1;
  }
  const elapsedSec = (Date.now() - plantedAtMs) / 1000;
  if (elapsedSec <= 0) return 1;

  // Se regada, o crescimento ocorre a 100% da velocidade.
  // Se não regada, o crescimento ocorre a 50% da velocidade até ser regada.
  const speed = isWatered ? 1.0 : 0.5;
  const effectiveElapsed = elapsedSec * speed;
  const ratio = effectiveElapsed / Math.max(1, growthDurationSeconds);

  if (ratio >= 1.0) return 5;
  if (ratio >= 0.70) return 4;
  if (ratio >= 0.45) return 3;
  if (ratio >= 0.20) return 2;
  return 1;
}

export function mapPlotsFromMarketState(state: MarketStateSnapshot): FarmPlot[] {
  return state.farm_plots.map((plot) => {
    const cropType =
      plot.cropType && plot.cropType in CROPS_CATALOG
        ? (plot.cropType as keyof typeof CROPS_CATALOG)
        : null;
    const plantedAtMs = plot.plantedAt ? Date.parse(plot.plantedAt) : null;
    const cropMeta = cropType ? CROPS_CATALOG[cropType] : null;
    const growthTime = Math.max(
      1,
      Number(plot.growthTime) || (cropMeta ? cropMeta.growthTime : 25)
    );
    const watered = plot.watered === true;
    const stage = cropType ? calculatePlotStage(plantedAtMs, growthTime, watered, plot.stage) : 0;

    return {
      id: Number(plot.id),
      cropType,
      stage,
      watered,
      plantedAt: plantedAtMs,
      growthTime,
    };
  });
}

export function mapListingsFromMarketState(state: MarketStateSnapshot): MarketListing[] {
  return state.listings.map((listing) => ({
    id: listing.id,
    stallId: listing.stall_id,
    sellerId: listing.seller_id,
    sellerName: listing.seller_name,
    productId: listing.product_id as ProductId,
    productName: listing.product_name,
    icon: listing.icon,
    category: listing.category,
    quantity: Number(listing.quantity),
    pricePerUnit: Number(listing.price_per_unit),
    totalPrice: Number(listing.quantity) * Number(listing.price_per_unit),
    createdAt: Date.parse(listing.updated_at) || 0,
  }));
}

export function mapLandsFromMarketState(
  state: MarketStateSnapshot,
  mapTemplates: FarmLand[],
  playerId: string
): FarmLand[] {
  return state.lands.flatMap((land) => {
    const template = mapTemplates.find((candidate) => candidate.id === land.id);
    if (!template) return [];
    const ownerId = land.owner_id;
    const ownerName = ownerId ? (ownerId === playerId ? state.player.nickname : 'Fazendeiro') : null;
    return [{
      ...template,
      name: land.name,
      price: Number(land.price),
      ownerId,
      ownerName,
      status: ownerId ? 'owned' as const : 'available' as const,
    }];
  });
}
