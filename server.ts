import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';
const ISA_ADMIN_PASSWORD = process.env.ISA_ADMIN_PASSWORD;
const ISA_ADMIN_SESSION_COOKIE = 'isa_admin_session';
const ISA_ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const isaAdminSessions = new Map<string, number>();

const DEFAULT_SUPABASE_PROJECT_ID = 'bwfldkhbcevauosxvmwr';
const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;

function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  return clean.replace(/\/+$/, '');
}

let supabaseUrl = sanitizeSupabaseUrl(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL);
let supabasePublicKey = process.env.SUPABASE_PUBLISHABLE_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.VITE_SUPABASE_ANON_KEY;

function initSupabaseClient(rawUrl?: string, key?: string) {
  const url = sanitizeSupabaseUrl(rawUrl);
  if (url && key && url.startsWith('http') && key.trim().length > 20 && !key.includes('MY_') && !key.includes('YOUR_')) {
    try {
      return createClient(url, key.trim(), {
        auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
      });
    } catch (e) {
      console.warn('Erro ao instanciar Supabase client:', e);
      return null;
    }
  }
  return null;
}

let supabaseAuthVerifier = initSupabaseClient(supabaseUrl, supabasePublicKey);

interface FarmPlotState {
  id: number;
  cropType: string | null;
  plantedAt: number | null;
  growthTime: number; // in seconds
  watered: boolean;
  stage: number; // 0: empty, 1: seedling, 2: growing, 3: ripe
}

interface AnimalState {
  id: string;
  type: 'cow' | 'chicken' | 'pig' | 'sheep';
  name: string;
  hunger: number; // 0 to 100
  lastFedAt: number;
  readyToProduce: boolean;
  produceType: string;
  produceCount: number;
}

interface RemotePlayer {
  id: string;
  nickname: string;
  avatar: string;
  role?: 'visitor' | 'isa_owner';
  x: number;
  y: number;
  z: number;
  rotation: number;
  isMoving: boolean;
  action?: string;
  lastSeen: number;
  message?: { text: string; time: number };
}

interface ServerLand {
  id: string;
  code: string;
  name: string;
  category: 'small' | 'medium' | 'large' | 'special' | 'river' | 'lake';
  categoryLabel: string;
  description: string;
  price: number;
  areaM2: number;
  plotsCount: number;
  plots: FarmPlotState[];
  soilPrepared: boolean;
  ownerId: string | null;
  ownerName: string | null;
  status: 'available' | 'owned' | 'locked';
  x: number;
  z: number;
  width: number;
  depth: number;
  constructions: any[];
}

interface ServerListing {
  id: string;
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  icon: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  createdAt: number;
}

interface MarketOrderItem {
  productId: string;
  productName: string;
  icon: string;
  count: number;
}

interface MarketOrder {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerRole: string;
  buyerAvatar: string;
  buyerIcon: string;
  dialogue: string;
  items: MarketOrderItem[];
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
}

const CROP_GROWTH_TIMES: Record<string, number> = {
  corn: 22,
  soy: 26,
  bean: 24,
  wheat: 28,
  rice: 26,
  tomato: 25,
  carrot: 18,
  strawberry: 32,
  pumpkin: 36,
  lettuce: 16,
};

// Global In-Memory Shared State (16 Talhões na Horta Central)
const INITIAL_PLOT_SEEDS: Array<{ crop: string | null; stage: number; offsetSec: number }> = [
  { crop: 'corn', stage: 5, offsetSec: 35 },
  { crop: 'corn', stage: 5, offsetSec: 35 },
  { crop: 'carrot', stage: 3, offsetSec: 12 },
  { crop: 'tomato', stage: 5, offsetSec: 40 },
  { crop: 'bean', stage: 2, offsetSec: 8 },
  { crop: 'strawberry', stage: 2, offsetSec: 10 },
  { crop: 'lettuce', stage: 4, offsetSec: 14 },
  { crop: 'wheat', stage: 2, offsetSec: 10 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
  { crop: null, stage: 0, offsetSec: 0 },
];

const plots: FarmPlotState[] = Array.from({ length: 32 }, (_, i) => {
  const seed = INITIAL_PLOT_SEEDS[i] || { crop: null, stage: 0, offsetSec: 0 };
  const growthTime = seed.crop ? (CROP_GROWTH_TIMES[seed.crop] || 25) : 25;
  return {
    id: i,
    cropType: seed.crop,
    plantedAt: seed.crop ? Date.now() - seed.offsetSec * 1000 : null,
    growthTime,
    watered: seed.crop !== null,
    stage: seed.stage,
  };
});

const animals: AnimalState[] = [
  { id: 'cow-1', type: 'cow', name: 'Mimosa', hunger: 30, lastFedAt: Date.now() - 20000, readyToProduce: true, produceType: 'milk', produceCount: 2 },
  { id: 'cow-2', type: 'cow', name: 'Estrela', hunger: 50, lastFedAt: Date.now() - 60000, readyToProduce: false, produceType: 'milk', produceCount: 1 },
  { id: 'chicken-1', type: 'chicken', name: 'Pipa', hunger: 20, lastFedAt: Date.now() - 10000, readyToProduce: true, produceType: 'egg', produceCount: 3 },
  { id: 'chicken-2', type: 'chicken', name: 'Carijó', hunger: 40, lastFedAt: Date.now() - 30000, readyToProduce: true, produceType: 'egg', produceCount: 2 },
  { id: 'pig-1', type: 'pig', name: 'Baconzinho', hunger: 60, lastFedAt: Date.now() - 40000, readyToProduce: false, produceType: 'truffle', produceCount: 1 },
  { id: 'sheep-1', type: 'sheep', name: 'Floco', hunger: 25, lastFedAt: Date.now() - 15000, readyToProduce: true, produceType: 'wool', produceCount: 2 },
];

let communityGoal = {
  id: 'goal-1',
  title: 'Grande Colheita de Milho da Isa',
  target: 100,
  current: 34,
  rewardCoins: 250,
  rewardXp: 150,
  completed: false,
};

// 6 Talhões Oficiais da Central de Talhões (Configuráveis no Painel Admin)
const lands: ServerLand[] = [
  {
    id: 'talhao-001',
    code: 'TALHÃO 001',
    name: 'Talhão Pequeno da Entrada',
    category: 'small',
    categoryLabel: 'Talhão Pequeno',
    description: 'Espaço aconchegante perfeito para iniciar sua própria produção independente.',
    price: 500,
    areaM2: 120,
    plotsCount: 4,
    plots: Array.from({ length: 4 }, (_, i) => ({
      id: i,
      cropType: null,
      plantedAt: null,
      growthTime: 25,
      watered: false,
      stage: 0,
    })),
    soilPrepared: false,
    ownerId: null,
    ownerName: null,
    status: 'available',
    x: -28,
    z: -25,
    width: 14,
    depth: 14,
    constructions: [],
  },
  {
    id: 'talhao-002',
    code: 'TALHÃO 002',
    name: 'Talhão Médio da Colina',
    category: 'medium',
    categoryLabel: 'Talhão Médio',
    description: 'Terreno ensolarado com solo descansado, excelente para milho, trigo e soja.',
    price: 1200,
    areaM2: 240,
    plotsCount: 6,
    plots: Array.from({ length: 6 }, (_, i) => ({
      id: i,
      cropType: null,
      plantedAt: null,
      growthTime: 25,
      watered: false,
      stage: 0,
    })),
    soilPrepared: false,
    ownerId: null,
    ownerName: null,
    status: 'available',
    x: 28,
    z: -25,
    width: 16,
    depth: 16,
    constructions: [],
  },
  {
    id: 'talhao-003',
    code: 'TALHÃO 003',
    name: 'Talhão Grande das Macieiras',
    category: 'large',
    categoryLabel: 'Talhão Grande',
    description: 'Ampla área rural para quem quer se tornar um grande produtor de safras.',
    price: 2500,
    areaM2: 480,
    plotsCount: 8,
    plots: Array.from({ length: 8 }, (_, i) => ({
      id: i,
      cropType: null,
      plantedAt: null,
      growthTime: 25,
      watered: false,
      stage: 0,
    })),
    soilPrepared: false,
    ownerId: null,
    ownerName: null,
    status: 'available',
    x: 28,
    z: 25,
    width: 18,
    depth: 18,
    constructions: [],
  },
  {
    id: 'talhao-004',
    code: 'TALHÃO 004',
    name: 'Talhão Especial Safra Nobre',
    category: 'special',
    categoryLabel: 'Talhão Especial',
    description: 'Terra roxa super fértil com alta capacidade de plantio e cultivo intensivo.',
    price: 3800,
    areaM2: 800,
    plotsCount: 12,
    plots: Array.from({ length: 12 }, (_, i) => ({
      id: i,
      cropType: null,
      plantedAt: null,
      growthTime: 25,
      watered: false,
      stage: 0,
    })),
    soilPrepared: false,
    ownerId: null,
    ownerName: null,
    status: 'available',
    x: -28,
    z: 25,
    width: 20,
    depth: 20,
    constructions: [],
  },
  {
    id: 'talhao-005',
    code: 'TALHÃO 005',
    name: 'Talhão Ribeirão do Vale',
    category: 'river',
    categoryLabel: 'Próximo ao Rio',
    description: 'Solo naturalmente úmido próximo às águas correntes, perfeito para arroz e hortaliças.',
    price: 1600,
    areaM2: 320,
    plotsCount: 6,
    plots: Array.from({ length: 6 }, (_, i) => ({
      id: i,
      cropType: null,
      plantedAt: null,
      growthTime: 25,
      watered: false,
      stage: 0,
    })),
    soilPrepared: false,
    ownerId: null,
    ownerName: null,
    status: 'available',
    x: -36,
    z: 0,
    width: 16,
    depth: 16,
    constructions: [],
  },
  {
    id: 'talhao-006',
    code: 'TALHÃO 006',
    name: 'Talhão Lago dos Cisnes',
    category: 'lake',
    categoryLabel: 'Próximo ao Lago',
    description: 'Bela vista para o lago da fazenda com clima fresco e agradável o dia todo.',
    price: 1800,
    areaM2: 350,
    plotsCount: 6,
    plots: Array.from({ length: 6 }, (_, i) => ({
      id: i,
      cropType: null,
      plantedAt: null,
      growthTime: 25,
      watered: false,
      stage: 0,
    })),
    soilPrepared: false,
    ownerId: null,
    ownerName: null,
    status: 'available',
    x: 36,
    z: 0,
    width: 16,
    depth: 16,
    constructions: [],
  },
];

// Compradores Automáticos do Mercado (NPCs com Pedidos Renováveis)
const marketOrders: MarketOrder[] = [
  {
    id: 'ord-1',
    buyerId: 'npc-antonio',
    buyerName: 'Seu Antônio',
    buyerRole: 'Comerciante de Milho e Cereais',
    buyerAvatar: 'bento',
    buyerIcon: '👨‍🌾',
    dialogue: 'Olá, compadre! Preciso abastecer o moinho com espigas frescas para a farinha de fubá!',
    items: [
      { productId: 'corn', productName: 'Espiga de Milho', icon: '🌽', count: 8 },
      { productId: 'tomato', productName: 'Tomate Vermelho', icon: '🍅', count: 4 },
    ],
    rewardCoins: 380,
    rewardXp: 180,
    completed: false,
  },
  {
    id: 'ord-2',
    buyerId: 'npc-francisca',
    buyerName: 'Dona Francisca',
    buyerRole: 'Quituteira da Vila',
    buyerAvatar: 'aninha',
    buyerIcon: '👵',
    dialogue: 'Bom dia, fazendeiro! As crianças da vila pediram cenoura crocante e morangos docinhos.',
    items: [
      { productId: 'carrot', productName: 'Cenoura Crocante', icon: '🥕', count: 6 },
      { productId: 'strawberry', productName: 'Morango Silvestre', icon: '🍓', count: 4 },
    ],
    rewardCoins: 420,
    rewardXp: 190,
    completed: false,
  },
  {
    id: 'ord-3',
    buyerId: 'npc-tiao',
    buyerName: 'Tião dos Grãos',
    buyerRole: 'Exportador Regional',
    buyerAvatar: 'davi',
    buyerIcon: '🚚',
    dialogue: 'Minha carreta está pronta para carregar soja e feijão! Pago muito bem na entrega.',
    items: [
      { productId: 'soy', productName: 'Soja da Roça', icon: '🌱', count: 10 },
      { productId: 'bean', productName: 'Feijão Carioca', icon: '🫘', count: 8 },
    ],
    rewardCoins: 650,
    rewardXp: 280,
    completed: false,
  },
  {
    id: 'ord-4',
    buyerId: 'npc-benta',
    buyerName: 'Dona Benta',
    buyerRole: 'Mestre Queijeira',
    buyerAvatar: 'mel',
    buyerIcon: '🥛',
    dialogue: 'Quero leite fresquinho e ovos caipiras para os queijos e bolos da festa da colheita!',
    items: [
      { productId: 'milk', productName: 'Balde de Leite', icon: '🥛', count: 4 },
      { productId: 'egg', productName: 'Ovo Caipira', icon: '🥚', count: 8 },
    ],
    rewardCoins: 340,
    rewardXp: 150,
    completed: false,
  },
  {
    id: 'ord-5',
    buyerId: 'npc-carlinhos',
    buyerName: 'Carlinhos das Frutas',
    buyerRole: 'Dono da Quitanda',
    buyerAvatar: 'kaua',
    buyerIcon: '🍉',
    dialogue: 'Minha banca de frutas e abóboras está vazia! Me ajude a encher com a sua safra!',
    items: [
      { productId: 'pumpkin', productName: 'Abóbora Formosa', icon: '🎃', count: 3 },
      { productId: 'strawberry', productName: 'Morango Silvestre', icon: '🍓', count: 6 },
    ],
    rewardCoins: 580,
    rewardXp: 260,
    completed: false,
  },
];

// Marketplace P2P listings
const marketListings: ServerListing[] = [
  { id: 'list-1', sellerId: 'npc-isa', sellerName: 'Isa (Proprietária)', productId: 'corn', productName: 'Espiga de Milho', icon: '🌽', quantity: 15, pricePerUnit: 22, totalPrice: 330, createdAt: Date.now() - 60000 },
  { id: 'list-2', sellerId: 'npc-isa', sellerName: 'Isa (Proprietária)', productId: 'carrot', productName: 'Cenoura Crocante', icon: '🥕', quantity: 10, pricePerUnit: 18, totalPrice: 180, createdAt: Date.now() - 40000 },
  { id: 'list-3', sellerId: 'npc-isa', sellerName: 'Isa (Proprietária)', productId: 'egg', productName: 'Ovo Caipira', icon: '🥚', quantity: 8, pricePerUnit: 12, totalPrice: 96, createdAt: Date.now() - 20000 },
];

const marketTransactions: any[] = [];

// 5 Perfis Oficiais dos NPCs Compradores (Cadastrados em market_npc_profiles)
interface MarketNpcProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  icon: string;
  preferredCategory: string;
  maxUnitPrice: number;
  dailyBudget: number;
  budgetRemaining: number;
  personality: string;
}

const marketNpcProfiles: MarketNpcProfile[] = [
  {
    id: 'npc-antonio',
    name: 'Seu Antônio',
    role: 'Comerciante de Grãos e Milho',
    avatar: 'bento',
    icon: '👨‍🌾',
    preferredCategory: 'crop',
    maxUnitPrice: 35,
    dailyBudget: 600,
    budgetRemaining: 600,
    personality: 'Exigente com grãos frescos e milho amarelo graúdo para abastecer o moinho da vila.',
  },
  {
    id: 'npc-francisca',
    name: 'Dona Francisca',
    role: 'Quituteira da Fazenda',
    avatar: 'aninha',
    icon: '👵',
    preferredCategory: 'crop',
    maxUnitPrice: 40,
    dailyBudget: 500,
    budgetRemaining: 500,
    personality: 'Procura cenouras crocantes, morangos e abóboras para quitutes, compotas e bolos caseiros.',
  },
  {
    id: 'npc-tiao',
    name: 'Tião dos Grãos',
    role: 'Atacadista Regional',
    avatar: 'davi',
    icon: '🚚',
    preferredCategory: 'grains',
    maxUnitPrice: 45,
    dailyBudget: 800,
    budgetRemaining: 800,
    personality: 'Compra grãos em grande volume (soja, trigo, feijão e milho) para distribuição nas cooperativas.',
  },
  {
    id: 'npc-celia',
    name: 'Dona Célia',
    role: 'Merceeira de Hortaliças',
    avatar: 'mel',
    icon: '🥗',
    preferredCategory: 'crop',
    maxUnitPrice: 30,
    dailyBudget: 450,
    budgetRemaining: 450,
    personality: 'Prioriza hortaliças colhidas no dia, tomates vermelhos e produtos com excelente apresentação visual.',
  },
  {
    id: 'npc-ze',
    name: 'Seu Zé',
    role: 'Ranqueiro e Queijeiro',
    avatar: 'kaua',
    icon: '🧀',
    preferredCategory: 'product',
    maxUnitPrice: 55,
    dailyBudget: 650,
    budgetRemaining: 650,
    personality: 'Busca laticínios frescos, ovos caipiras e lã macia para confecção de queijos e mantas artesanais.',
  },
];

interface WalletLedgerEntry {
  id: string;
  playerId: string;
  amount: number;
  balanceAfter: number;
  transactionType: 'npc_purchase' | 'p2p_purchase' | 'market_sale';
  referenceId: string;
  description: string;
  createdAt: number;
}

const marketWalletLedger: WalletLedgerEntry[] = [];
const playerWallets = new Map<string, number>();

let npcPurchaseRunning = false;
const npcPurchaseCronStatus = {
  cronName: 'fazendinha-isa-npc-purchase',
  active: true,
  frequencySeconds: 28,
  lastRun: null as string | null,
  lastPurchase: null as any,
  totalPurchases: 0,
  totalCoinsSpent: 0,
  errors: [] as string[],
};

const activityLogs: { id: string; player: string; action: string; time: string }[] = [
  { id: 'log-1', player: 'Isa (Proprietária)', action: 'Boas-vindas a todos os visitantes da Fazendinha!', time: 'Agora' },
];

const players = new Map<string, RemotePlayer>();
const clientSockets = new Map<string, WebSocket>();

function broadcast(data: object, excludeId?: string) {
  const payload = JSON.stringify(data);
  for (const [id, client] of clientSockets.entries()) {
    if (id !== excludeId && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

// Rotina Autônoma de Compra de NPCs (Cron fazendinha-isa-npc-purchase)
async function executeNpcPurchaseCycle(specifiedNpcId?: string, specifiedListingId?: string, specifiedQty?: number) {
  if (npcPurchaseRunning) return { success: false, reason: 'cycle_already_in_progress' };
  npcPurchaseRunning = true;
  npcPurchaseCronStatus.lastRun = new Date().toISOString();

  try {
    // 1. Tentar executar a função oficial do banco no Supabase
    if (supabaseAuthVerifier) {
      try {
        const { data, error } = await supabaseAuthVerifier.rpc('market_process_npc_purchase', {
          p_npc_id: specifiedNpcId || null,
          p_inventory_id: specifiedListingId || null,
          p_quantity: specifiedQty || 1,
        });

        if (!error && data && data.success === true) {
          // Sincronizar listagens locais
          const listing = marketListings.find((l) => l.id === data.stall_id || l.productId === data.product_id);
          if (listing) {
            listing.quantity = Math.max(0, listing.quantity - Number(data.quantity));
            listing.totalPrice = listing.quantity * listing.pricePerUnit;
            if (listing.quantity <= 0) {
              const idx = marketListings.findIndex((l) => l.id === listing.id);
              if (idx !== -1) marketListings.splice(idx, 1);
            }
          }

          npcPurchaseCronStatus.totalPurchases++;
          npcPurchaseCronStatus.totalCoinsSpent += Number(data.total_cost || 0);
          npcPurchaseCronStatus.lastPurchase = data;

          activityLogs.unshift({
            id: Math.random().toString(36).substring(7),
            player: data.npc_name,
            action: `Comprou ${data.quantity}x ${data.product_name} por ${data.total_cost} 🪙 de ${data.seller_name}!`,
            time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          });

          // Transmissão para todos os clientes em tempo real
          broadcast({
            type: 'npc_purchase',
            transaction: data,
            marketListings,
          });

          return { success: true, transaction: data };
        } else if (error) {
          const errText = typeof error.message === 'string' ? error.message : 'Erro na RPC market_process_npc_purchase';
          if (!npcPurchaseCronStatus.errors.includes(errText)) {
            npcPurchaseCronStatus.errors.unshift(errText);
            if (npcPurchaseCronStatus.errors.length > 5) npcPurchaseCronStatus.errors.pop();
          }
        }
      } catch (err: any) {
        const msg = err?.message || 'Falha ao conectar na RPC do Supabase';
        if (!npcPurchaseCronStatus.errors.includes(msg)) {
          npcPurchaseCronStatus.errors.unshift(msg);
          if (npcPurchaseCronStatus.errors.length > 5) npcPurchaseCronStatus.errors.pop();
        }
      }
    }

    // 2. Execução Autoritativa no Servidor (quando o banco estiver em modo fallback ou conexão local)
    // 1. O servidor verifica se existem barracas com estoque
    const availableListings = marketListings.filter((l) => l.quantity > 0);
    if (availableListings.length === 0) {
      return { success: false, reason: 'no_eligible_stock' };
    }

    // 2. Seleciona um NPC com orçamento disponível
    const eligibleNpcs = marketNpcProfiles.filter((n) => n.budgetRemaining > 0);
    if (eligibleNpcs.length === 0) {
      return { success: false, reason: 'no_eligible_npc_with_budget' };
    }

    const npc = specifiedNpcId
      ? marketNpcProfiles.find((n) => n.id === specifiedNpcId) || eligibleNpcs[0]
      : eligibleNpcs[Math.floor(Math.random() * eligibleNpcs.length)];

    // 3 & 4. Verifica os produtos disponíveis considerando categoria e preço máximo do NPC
    let candidateListings = specifiedListingId
      ? availableListings.filter((l) => l.id === specifiedListingId)
      : availableListings.filter((l) => l.pricePerUnit <= npc.maxUnitPrice && l.pricePerUnit <= npc.budgetRemaining);

    if (candidateListings.length === 0) {
      return {
        success: false,
        reason: 'price_above_limit',
        npc: npc.name,
        maxPrice: npc.maxUnitPrice,
        budget: npc.budgetRemaining,
      };
    }

    // Priorizar categoria preferida
    candidateListings.sort((a, b) => {
      const aMatch = (a.productId === 'corn' || a.productId === 'wheat' || a.productId === 'carrot') && npc.preferredCategory === 'crop';
      const bMatch = (b.productId === 'corn' || b.productId === 'wheat' || b.productId === 'carrot') && npc.preferredCategory === 'crop';
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    const chosenListing = candidateListings[0];

    // 5. Verifica orçamento diário e determina quantidade
    const maxAffordable = Math.floor(npc.budgetRemaining / chosenListing.pricePerUnit);
    if (maxAffordable <= 0) {
      return { success: false, reason: 'insufficient_budget', budgetRemaining: npc.budgetRemaining };
    }

    const qtyToBuy = specifiedQty
      ? Math.min(specifiedQty, chosenListing.quantity, maxAffordable)
      : Math.min(chosenListing.quantity, maxAffordable, Math.floor(Math.random() * 2) + 1);

    if (qtyToBuy <= 0) {
      return { success: false, reason: 'insufficient_budget' };
    }

    const totalCost = qtyToBuy * chosenListing.pricePerUnit;

    // Atualiza estoque real (sem permitir negativo)
    chosenListing.quantity = Math.max(0, chosenListing.quantity - qtyToBuy);
    chosenListing.totalPrice = chosenListing.quantity * chosenListing.pricePerUnit;

    // Atualiza orçamento do NPC
    npc.budgetRemaining = Math.max(0, npc.budgetRemaining - totalCost);

    // Credita na carteira do proprietário/vendedor
    const prevBalance = playerWallets.get(chosenListing.sellerId) || 100;
    const newBalance = prevBalance + totalCost;
    playerWallets.set(chosenListing.sellerId, newBalance);

    // Credita também na carteira dos jogadores proprietários da sessão
    for (const [pId, pData] of players.entries()) {
      if (pData.role === 'isa_owner' || chosenListing.sellerId === 'npc-isa' || chosenListing.sellerId === pId) {
        const cur = playerWallets.get(pId) || 100;
        playerWallets.set(pId, cur + totalCost);
      }
    }

    const txId = `tx-npc-${Date.now()}-${randomBytes(3).toString('hex')}`;
    const transaction = {
      transaction_id: txId,
      npc_id: npc.id,
      npc_name: npc.name,
      npc_avatar: npc.avatar,
      npc_icon: npc.icon,
      seller_id: chosenListing.sellerId,
      seller_name: chosenListing.sellerName,
      stall_id: chosenListing.id,
      product_id: chosenListing.productId,
      product_name: chosenListing.productName,
      icon: chosenListing.icon,
      quantity: qtyToBuy,
      unit_price: chosenListing.pricePerUnit,
      total_cost: totalCost,
      seller_new_balance: newBalance,
      npc_budget_remaining: npc.budgetRemaining,
      remaining_stock: chosenListing.quantity,
      timestamp: new Date().toISOString(),
    };

    // Registra em market_transactions
    marketTransactions.unshift(transaction);
    if (marketTransactions.length > 60) marketTransactions.pop();

    // Registra em market_wallet_ledger
    marketWalletLedger.unshift({
      id: `led-${randomBytes(6).toString('hex')}`,
      playerId: chosenListing.sellerId,
      amount: totalCost,
      balanceAfter: newBalance,
      transactionType: 'npc_purchase',
      referenceId: txId,
      description: `${npc.name} comprou ${qtyToBuy}x ${chosenListing.productName} por ${totalCost} 🪙`,
      createdAt: Date.now(),
    });
    if (marketWalletLedger.length > 60) marketWalletLedger.pop();

    // Se estoque zerar, remove do mostruário
    if (chosenListing.quantity <= 0) {
      const idx = marketListings.findIndex((l) => l.id === chosenListing.id);
      if (idx !== -1) marketListings.splice(idx, 1);
    }

    npcPurchaseCronStatus.totalPurchases++;
    npcPurchaseCronStatus.totalCoinsSpent += totalCost;
    npcPurchaseCronStatus.lastPurchase = transaction;

    activityLogs.unshift({
      id: Math.random().toString(36).substring(7),
      player: npc.name,
      action: `Comprou ${qtyToBuy}x ${chosenListing.productName} por ${totalCost} 🪙 de ${chosenListing.sellerName}!`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    });

    // 8. Confirma visualmente e notifica via WebSocket
    broadcast({
      type: 'npc_purchase',
      transaction,
      marketListings,
    });

    return { success: true, transaction };
  } finally {
    npcPurchaseRunning = false;
  }
}


function readCookie(cookieHeader: string | string[] | undefined, name: string) {
  const header = Array.isArray(cookieHeader) ? cookieHeader.join(';') : cookieHeader || '';
  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim();
  }
  return null;
}

function hasValidIsaSession(cookieHeader: string | string[] | undefined) {
  const token = readCookie(cookieHeader, ISA_ADMIN_SESSION_COOKIE);
  if (!token) return false;
  const expiresAt = isaAdminSessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    isaAdminSessions.delete(token);
    return false;
  }
  return true;
}

function safeSecretEquals(provided: string, expected: string) {
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}

function setIsaSessionCookie(res: express.Response, token: string) {
  const attributes = [
    `${ISA_ADMIN_SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(ISA_ADMIN_SESSION_TTL_MS / 1000)}`,
  ];
  if (isProduction) attributes.push('Secure');
  res.setHeader('Set-Cookie', attributes.join('; '));
}

function sanitizePublicNickname(value: unknown) {
  const sanitized = typeof value === 'string'
    ? value.replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 18)
    : '';
  return sanitized.length >= 2 ? sanitized : 'Fazendeiro';
}

function sanitizeAvatarId(value: unknown) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(value) ? value : 'leo';
}

function boundedNumber(value: unknown, min: number, max: number) {
  const numericValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numericValue)) return 0;
  return Math.min(max, Math.max(min, numericValue));
}

function requireIsaAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!hasValidIsaSession(req.headers.cookie)) {
    return res.status(403).json({
      error: 'Acesso negado. Apenas a proprietária ISA autenticada pode acessar o painel administrativo.',
    });
  }
  next();
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  app.use(express.json());

  app.use(['/api/market', '/api/lands', '/api/action'], (_req, res) =>
    res.status(410).json({ error: 'Esta rota foi desativada: use as operações autenticadas do Supabase.' })
  );

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: Date.now(), playersOnline: players.size });
  });

  // 2. Login legado da Isa: a sessão aleatória fica somente em cookie HttpOnly.
  app.post('/api/auth/isa-login', (req, res) => {
    const { password } = req.body;
    if (!ISA_ADMIN_PASSWORD) {
      return res.status(503).json({ success: false, error: 'Login administrativo indisponível.' });
    }

    if (typeof password !== 'string' || !safeSecretEquals(password, ISA_ADMIN_PASSWORD)) {
      return res.status(401).json({ success: false, error: 'Acesso não autorizado.' });
    }

    for (const [token, expiresAt] of isaAdminSessions) {
      if (expiresAt <= Date.now()) isaAdminSessions.delete(token);
    }
    const token = randomBytes(32).toString('hex');
    isaAdminSessions.set(token, Date.now() + ISA_ADMIN_SESSION_TTL_MS);
    setIsaSessionCookie(res, token);
    return res.json({ success: true, role: 'isa_owner', nickname: 'Isa (Proprietária)' });
  });

  app.post('/api/auth/isa-logout', (req, res) => {
    const token = readCookie(req.headers.cookie, ISA_ADMIN_SESSION_COOKIE);
    if (token) isaAdminSessions.delete(token);
    const attributes = [`${ISA_ADMIN_SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
    if (isProduction) attributes.push('Secure');
    res.setHeader('Set-Cookie', attributes.join('; '));
    res.json({ success: true });
  });

  // 3. Farm State
  app.get('/api/farm-state', (req, res) => {
    const now = Date.now();
    for (const plot of plots) {
      if (plot.cropType && plot.plantedAt) {
        const elapsedSec = (now - plot.plantedAt) / 1000;
        const targetTime = plot.watered ? plot.growthTime * 0.7 : plot.growthTime;
        if (elapsedSec >= targetTime) {
          plot.stage = 3;
        } else if (elapsedSec >= targetTime * 0.4) {
          plot.stage = 2;
        } else {
          plot.stage = 1;
        }
      } else {
        plot.stage = 0;
      }
    }

    res.json({
      plots,
      animals,
      communityGoal,
      lands,
      marketListings,
      marketOrders,
      npcProfiles: marketNpcProfiles,
      npcCronStatus: npcPurchaseCronStatus,
      activityLogs: activityLogs.slice(0, 15),
      playersOnline: Array.from(players.values()),
    });
  });

  // 4. Mercado: Compradores Automáticos & Pedidos
  app.get('/api/market/orders', (req, res) => {
    res.json({ orders: marketOrders });
  });

  app.post('/api/market/orders/fulfill', (req, res) => {
    const { orderId, buyerId, playerName, playerInventory } = req.body;
    const order = marketOrders.find((o) => o.id === orderId);

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado ou já atendido' });
    }

    // Verificar se jogador possui todos os itens necessários
    if (playerInventory) {
      for (const item of order.items) {
        const userCount = playerInventory[item.productId]?.count || 0;
        if (userCount < item.count) {
          return res.status(400).json({
            error: `Você não tem ${item.count}x ${item.productName} para entregar este pedido!`,
          });
        }
      }
    }

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: playerName || 'Fazendeiro',
      action: `Entregou pedido para ${order.buyerName} (+${order.rewardCoins} 🪙 e +${order.rewardXp} XP)!`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    // Renovar pedido após entrega com leve variação
    order.rewardCoins = Math.round(order.rewardCoins * (0.95 + Math.random() * 0.15));
    order.items = order.items.map((it) => ({
      ...it,
      count: Math.max(3, Math.min(15, Math.round(it.count * (0.8 + Math.random() * 0.4)))),
    }));

    broadcast({ type: 'market_orders_updated', orders: marketOrders });
    res.json({
      success: true,
      rewardCoins: order.rewardCoins,
      rewardXp: order.rewardXp,
      orders: marketOrders,
    });
  });

  // 5. Mercado P2P
  app.get('/api/market/listings', (req, res) => {
    res.json({ listings: marketListings });
  });

  app.post('/api/market/list', (req, res) => {
    const { sellerId, sellerName, productId, productName, icon, quantity, pricePerUnit } = req.body;
    if (!sellerId || !productId || !quantity || quantity <= 0 || !pricePerUnit || pricePerUnit <= 0) {
      return res.status(400).json({ error: 'Dados inválidos do anúncio' });
    }

    const newListing: ServerListing = {
      id: 'list-' + Math.random().toString(36).substring(2, 9),
      sellerId,
      sellerName: sellerName || 'Fazendeiro',
      productId,
      productName: productName || productId,
      icon: icon || '🌾',
      quantity: Number(quantity),
      pricePerUnit: Number(pricePerUnit),
      totalPrice: Number(quantity) * Number(pricePerUnit),
      createdAt: Date.now(),
    };

    marketListings.unshift(newListing);
    broadcast({ type: 'market_updated', listings: marketListings });
    res.json({ success: true, listing: newListing });
  });

  app.post('/api/market/buy', (req, res) => {
    const { listingId, buyerId, buyerName, quantity } = req.body;
    const listing = marketListings.find((l) => l.id === listingId);

    if (!listing) {
      return res.status(404).json({ error: 'Anúncio não encontrado ou já vendido' });
    }

    const buyQty = Math.min(listing.quantity, Number(quantity) || 1);
    if (buyQty <= 0) {
      return res.status(400).json({ error: 'Quantidade indisponível' });
    }

    const totalCost = buyQty * listing.pricePerUnit;

    listing.quantity -= buyQty;
    listing.totalPrice = listing.quantity * listing.pricePerUnit;

    const transaction = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      listingId,
      buyerId,
      buyerName: buyerName || 'Comprador',
      sellerId: listing.sellerId,
      sellerName: listing.sellerName,
      productId: listing.productId,
      productName: listing.productName,
      quantity: buyQty,
      totalCost,
      timestamp: Date.now(),
    };
    marketTransactions.unshift(transaction);

    if (listing.quantity <= 0) {
      const idx = marketListings.findIndex((l) => l.id === listingId);
      if (idx !== -1) marketListings.splice(idx, 1);
    }

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: buyerName || 'Fazendeiro',
      action: `Comprou ${buyQty}x ${listing.productName} de ${listing.sellerName} por ${totalCost} 🪙`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    broadcast({ type: 'market_updated', listings: marketListings, transaction });
    res.json({ success: true, transaction, listings: marketListings });
  });

  // 5.1 Sistema de NPCs Compradores do Mercado (Rotina fazendinha-isa-npc-purchase)
  app.get('/api/npc-purchase/status', (req, res) => {
    res.json({
      cron: npcPurchaseCronStatus,
      npcs: marketNpcProfiles,
      activeListingsCount: marketListings.filter((l) => l.quantity > 0).length,
    });
  });

  app.get('/api/npc-purchase/profiles', (req, res) => {
    res.json({ npcs: marketNpcProfiles });
  });

  app.get('/api/npc-purchase/history', (req, res) => {
    res.json({
      transactions: marketTransactions.slice(0, 50),
      ledger: marketWalletLedger.slice(0, 50),
    });
  });

  // 5.1.1 Carteira Autoritativa dos Jogadores
  app.get('/api/wallet/:playerId', (req, res) => {
    const { playerId } = req.params;
    const coins = playerWallets.get(playerId) ?? 150;
    res.json({ playerId, coins });
  });

  app.post('/api/wallet/credit', (req, res) => {
    const { playerId, amount, reason } = req.body || {};
    const addAmt = Number(amount || 0);
    const prev = playerWallets.get(playerId) ?? 150;
    const newBal = prev + addAmt;
    playerWallets.set(playerId, newBal);

    marketWalletLedger.unshift({
      id: `led-${randomBytes(6).toString('hex')}`,
      playerId: playerId || 'player',
      amount: addAmt,
      balanceAfter: newBal,
      transactionType: 'market_sale',
      referenceId: `credit-${Date.now()}`,
      description: reason || `Crédito de ${addAmt} moedas`,
      createdAt: Date.now(),
    });

    res.json({ success: true, balance: newBal });
  });

  app.post('/api/wallet/debit', (req, res) => {
    const { playerId, amount, reason } = req.body || {};
    const subAmt = Number(amount || 0);
    const prev = playerWallets.get(playerId) ?? 150;
    const newBal = Math.max(0, prev - subAmt);
    playerWallets.set(playerId, newBal);

    marketWalletLedger.unshift({
      id: `led-${randomBytes(6).toString('hex')}`,
      playerId: playerId || 'player',
      amount: -subAmt,
      balanceAfter: newBal,
      transactionType: 'p2p_purchase',
      referenceId: `debit-${Date.now()}`,
      description: reason || `Débito de ${subAmt} moedas`,
      createdAt: Date.now(),
    });

    res.json({ success: true, balance: newBal });
  });

  app.post('/api/npc-purchase/run', async (req, res) => {
    const { npcId, listingId, quantity } = req.body || {};
    const result = await executeNpcPurchaseCycle(npcId, listingId, quantity ? Number(quantity) : undefined);
    res.json(result);
  });

  // 5.2 Diagnóstico e Verificação do Supabase
  app.get(['/api/supabase/status', '/api/supabase/verify'], async (req, res) => {
    const hasValidKey = Boolean(supabasePublicKey && supabasePublicKey.trim().length > 20 && !supabasePublicKey.includes('MY_'));
    const isClientActive = Boolean(supabaseAuthVerifier && hasValidKey);

    const report: any = {
      projectId: DEFAULT_SUPABASE_PROJECT_ID,
      supabaseUrl,
      isConfigured: isClientActive,
      hasAnonKey: hasValidKey,
      authMode: isClientActive ? 'supabase_cloud' : 'authoritative_local_ledger',
      rpcName: 'market_process_npc_purchase',
      rpcAvailable: false,
      tables: {
        market_npc_profiles: 'ready_in_schema (supabase/schema.sql)',
        market_inventory: 'ready_in_schema (supabase/schema.sql)',
        market_transactions: 'ready_in_schema (supabase/schema.sql)',
        market_wallet_ledger: 'ready_in_schema (supabase/schema.sql)',
        players: 'ready_in_schema (supabase/schema.sql)',
      },
      cron: npcPurchaseCronStatus,
      schemaFile: '/supabase/schema.sql',
    };

    if (supabaseAuthVerifier) {
      try {
        const { data, error } = await supabaseAuthVerifier.from('market_npc_profiles').select('*').limit(5);
        if (!error && data) {
          report.tables.market_npc_profiles = `connected (${data.length} perfis)`;
          report.cloudProfiles = data;
          if (data.length > 0) {
            report.marketNpcColumns = Object.keys(data[0]);
          }
        } else if (error) {
          report.tables.market_npc_profiles = `erro: ${error.message}`;
        }
      } catch (err: any) {
        report.tables.market_npc_profiles = `conexao falhou: ${err?.message || err}`;
      }

      try {
        const { data, error } = await supabaseAuthVerifier.rpc('market_process_npc_purchase', {
          p_npc_id: null,
          p_inventory_id: null,
          p_quantity: 1,
        });
        if (!error && data) {
          report.rpcAvailable = true;
          report.rpcData = data;
        } else if (error) {
          report.rpcAvailable = false;
          report.rpcNotes = error.message;
        }
      } catch (err: any) {
        report.rpcAvailable = false;
        report.rpcNotes = err?.message || 'Falha ao executar RPC';
      }
    } else {
      report.notes = 'Servidor operando com integridade transacional completa no ledger autoritativo local.';
    }

    res.json(report);
  });

  app.post('/api/supabase/config', (req, res) => {
    const { url, anonKey } = req.body || {};
    if (url && typeof url === 'string' && url.startsWith('http')) {
      supabaseUrl = sanitizeSupabaseUrl(url);
    }
    if (anonKey && typeof anonKey === 'string' && anonKey.trim().length > 20) {
      supabasePublicKey = anonKey.trim();
    }
    supabaseAuthVerifier = initSupabaseClient(supabaseUrl, supabasePublicKey);
    res.json({
      success: true,
      configured: Boolean(supabaseAuthVerifier),
      url: supabaseUrl,
    });
  });

  // 6. Central de Talhões (Compra Atômica de Terras)
  app.get('/api/lands', (req, res) => {
    res.json({ lands });
  });

  app.post('/api/lands/buy', (req, res) => {
    const { landId, buyerId, buyerName, buyerCoins } = req.body;
    const land = lands.find((l) => l.id === landId);

    if (!land) {
      return res.status(404).json({ error: 'Talhão não encontrado' });
    }

    // Validação atômica: impedir que duas pessoas comprem o mesmo talhão
    if (land.status === 'owned') {
      return res.status(400).json({
        error: `Este talhão já pertence a ${land.ownerName}! Escolha outro talhão disponível na Central de Talhões.`,
      });
    }

    if (buyerCoins !== undefined && buyerCoins < land.price) {
      return res.status(400).json({ error: 'Moedas insuficientes para adquirir este talhão' });
    }

    // Efetivar propriedade permanente
    land.status = 'owned';
    land.ownerId = buyerId;
    land.ownerName = buyerName || 'Fazendeiro';
    land.soilPrepared = true;

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: buyerName || 'Fazendeiro',
      action: `Comprou o ${land.code} (${land.name}) na Central de Talhões! 🏡`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    broadcast({ type: 'land_updated', land, lands });
    res.json({ success: true, land, lands });
  });

  // Cultivo independente dentro dos talhões do jogador
  app.post('/api/lands/plot-action', (req, res) => {
    const { landId, plotId, action, cropType, playerName, ownerId } = req.body;
    const land = lands.find((l) => l.id === landId);

    if (!land) return res.status(404).json({ error: 'Talhão não encontrado' });
    if (land.ownerId !== ownerId) {
      return res.status(403).json({ error: 'Apenas o proprietário pode plantar ou colher neste talhão!' });
    }

    const plot = land.plots.find((p) => p.id === plotId);
    if (!plot) return res.status(404).json({ error: 'Canteiro não encontrado no talhão' });

    if (action === 'prepare') {
      plot.stage = 0;
      plot.cropType = null;
    } else if (action === 'plant') {
      plot.cropType = cropType || 'corn';
      plot.plantedAt = Date.now();
      plot.watered = true;
      plot.stage = 1;
    } else if (action === 'water') {
      plot.watered = true;
    } else if (action === 'harvest') {
      plot.stage = 0;
      plot.cropType = null;
      plot.plantedAt = null;
      plot.watered = false;
    }

    broadcast({ type: 'land_updated', land, lands });
    res.json({ success: true, plot, land });
  });

  app.post('/api/lands/build', (req, res) => {
    const { landId, ownerId, construction } = req.body;
    const land = lands.find((l) => l.id === landId);

    if (!land) return res.status(404).json({ error: 'Talhão não encontrado' });
    if (land.ownerId !== ownerId) {
      return res.status(403).json({ error: 'Você só pode construir no seu próprio talhão!' });
    }

    const newConst = {
      id: 'c-' + Math.random().toString(36).substring(2, 9),
      type: construction.type || 'fence',
      label: construction.label || 'Construção',
      x: construction.x || 0,
      z: construction.z || 0,
    };
    land.constructions.push(newConst);

    broadcast({ type: 'land_updated', land, lands });
    res.json({ success: true, land });
  });

  // 6.1 Expansão de Canteiros Agrícolas (Novas Hortas da Fazendinha)
  app.post('/api/farm/expansion/buy', (req, res) => {
    const { packageId, packageName, plotIds, price, playerId, playerName, playerCoins } = req.body || {};
    if (!packageId || !plotIds || !Array.isArray(plotIds) || typeof price !== 'number') {
      return res.status(400).json({ error: 'Parâmetros de expansão inválidos.' });
    }

    const curCoins = typeof playerCoins === 'number' ? playerCoins : (playerWallets.get(playerId) ?? 150);
    if (curCoins < price) {
      return res.status(400).json({ error: `Saldo insuficiente. Necessário ${price} moedas.` });
    }

    const prevBal = playerWallets.get(playerId) ?? curCoins;
    const newBal = Math.max(0, prevBal - price);
    playerWallets.set(playerId, newBal);

    marketWalletLedger.unshift({
      id: `led-${randomBytes(6).toString('hex')}`,
      playerId: playerId || 'player',
      amount: -price,
      balanceAfter: newBal,
      transactionType: 'p2p_purchase',
      referenceId: `expansion-${packageId}-${Date.now()}`,
      description: `Expansão de Horta: ${packageName || packageId} (+${plotIds.length} canteiros)`,
      createdAt: Date.now(),
    });

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: playerName || 'Fazendeiro',
      action: `Desbloqueou a expansão de horta: ${packageName} (+${plotIds.length} canteiros)! 🚜`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    broadcast({
      type: 'farm_expansion_unlocked',
      packageId,
      packageName,
      plotIds,
      playerName: playerName || 'Fazendeiro',
    });

    res.json({
      success: true,
      packageId,
      plotIds,
      newBalance: newBal,
      message: `Expansão ${packageName} desbloqueada com sucesso!`,
    });
  });

  // 7. Ações Agrícolas na Horta Central da Fazendinha
  app.post('/api/action/plant', (req, res) => {
    const { plotId, cropType, playerName } = req.body;
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    if (plot.cropType) return res.status(400).json({ error: 'Plot occupied' });

    plot.cropType = cropType || 'corn';
    plot.plantedAt = Date.now();
    plot.watered = true;
    plot.stage = 1;
    plot.growthTime = CROP_GROWTH_TIMES[cropType || 'corn'] || 25;

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: playerName || 'Um fazendeiro',
      action: `Plantou ${plot.cropType} no talhão #${plotId + 1}`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    broadcast({ type: 'farm_updated', plots, activityLogs: activityLogs.slice(0, 15) });
    res.json({ success: true, plot });
  });

  app.post('/api/action/harvest', (req, res) => {
    const { plotId, playerName } = req.body;
    const plot = plots.find((p) => p.id === plotId);
    if (!plot) return res.status(404).json({ error: 'Plot not found' });
    if (!plot.cropType) return res.status(400).json({ error: 'Talhão vazio' });

    const elapsed = plot.plantedAt ? (Date.now() - plot.plantedAt) / 1000 : 0;
    const effectiveElapsed = plot.watered ? elapsed : elapsed * 0.5;
    const isRipe = plot.stage >= 5 || effectiveElapsed >= plot.growthTime;
    if (!isRipe) return res.status(400).json({ error: 'Esta plantação ainda está crescendo e não pode ser colhida antes de madura!' });

    const harvestedCrop = plot.cropType;
    plot.cropType = null;
    plot.plantedAt = null;
    plot.watered = false;
    plot.stage = 0;

    if (harvestedCrop === 'corn') {
      communityGoal.current = Math.min(communityGoal.target, communityGoal.current + 1);
      if (communityGoal.current >= communityGoal.target && !communityGoal.completed) {
        communityGoal.completed = true;
      }
    }

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: playerName || 'Um fazendeiro',
      action: `Colheu ${harvestedCrop}! (+1 para a fazendinha)`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    broadcast({
      type: 'farm_updated',
      plots,
      communityGoal,
      activityLogs: activityLogs.slice(0, 15),
    });
    res.json({ success: true, crop: harvestedCrop, communityGoal });
  });

  app.post('/api/action/feed-animal', (req, res) => {
    const { animalId, playerName } = req.body;
    const animal = animals.find((a) => a.id === animalId);
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    animal.hunger = 100;
    animal.lastFedAt = Date.now();
    animal.readyToProduce = true;

    const logEntry = {
      id: Math.random().toString(36).substring(7),
      player: playerName || 'Um fazendeiro',
      action: `Alimentou o animal ${animal.name} (${animal.type})!`,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    activityLogs.unshift(logEntry);

    broadcast({ type: 'farm_updated', animals, activityLogs: activityLogs.slice(0, 15) });
    res.json({ success: true, animal });
  });

  // 8. PAINEL ADMINISTRATIVO EXCLUSIVO DA ISA (Protegido por token)
  app.get('/api/admin/overview', requireIsaAuth, (req, res) => {
    res.json({
      playersCount: players.size,
      players: Array.from(players.values()),
      lands,
      marketListings,
      marketTransactions,
      marketOrders,
      communityGoal,
      activityLogs,
    });
  });

  app.post('/api/admin/action', requireIsaAuth, (req, res) => {
    const { action, data } = req.body;

    if (action === 'rain') {
      plots.forEach((p) => {
        p.watered = true;
      });
      broadcast({ type: 'magic_rain', message: 'Chuva mágica ativada pela Isa! Todas as plantações foram regadas!' });
    } else if (action === 'instant_grow') {
      plots.forEach((p) => {
        if (p.cropType) p.stage = 3;
      });
    } else if (action === 'reset_goal') {
      communityGoal.current = data?.amount || 0;
      communityGoal.completed = false;
    } else if (action === 'reset_lands') {
      lands.forEach((l) => {
        l.status = 'available';
        l.ownerId = null;
        l.ownerName = null;
        l.soilPrepared = false;
        l.constructions = [];
      });
    } else if (action === 'update_land_price') {
      const land = lands.find((l) => l.id === data?.landId);
      if (land && data?.price > 0) {
        land.price = Number(data.price);
      }
    }

    broadcast({ type: 'farm_updated', plots, communityGoal, animals, lands });
    res.json({ success: true });
  });

  app.post('/api/admin/block-player', requireIsaAuth, (req, res) => {
    const { playerId } = req.body;
    if (players.has(playerId)) {
      const p = players.get(playerId)!;
      players.delete(playerId);
      const ws = clientSockets.get(playerId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'banned', message: 'Você foi desconectado pela moderação da fazenda.' }));
        ws.close();
      }
      clientSockets.delete(playerId);
      broadcast({ type: 'player_left', id: playerId, message: `${p.nickname} foi moderado.` });
    }
    res.json({ success: true });
  });

  // WebSocket Server for realtime synchronization
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : '';
    if (pathname === '/ws/farm') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
      return;
    }
    if (isProduction) socket.destroy();
  });

  function broadcast(data: object, excludeId?: string) {
    const payload = JSON.stringify(data);
    for (const [id, client] of clientSockets.entries()) {
      if (id !== excludeId && client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  wss.on('connection', (ws, request) => {
    let playerId: string | null = null;
    let isIsaOwner = false;
    let joining = false;

    ws.on('message', async (message) => {
      try {
        const msg = JSON.parse(message.toString());

        if (msg.type === 'join') {
          if (playerId || joining) return;
          joining = true;

          // 1. Rejeição imediata de conexões sem token ou com tokens de convidado
          if (
            !msg.accessToken ||
            typeof msg.accessToken !== 'string' ||
            msg.accessToken.trim().length === 0 ||
            msg.accessToken === 'guest-token' ||
            msg.accessToken.startsWith('guest-')
          ) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              reason: 'authentication_required',
              message: 'Autenticação obrigatória com Supabase Auth. Acesso sem cadastro não é permitido.',
            }));
            ws.close(4401, 'Authentication required');
            return;
          }

          let authenticatedId: string | null = null;
          let nickname = 'Fazendeiro';
          let avatar = 'leo';

          // 2. Validação da sessão no Supabase Auth
          if (supabaseAuthVerifier) {
            try {
              const { data, error } = await supabaseAuthVerifier.auth.getUser(msg.accessToken);
              if (!error && data?.user?.id) {
                authenticatedId = data.user.id;
                const metadata = (data.user.user_metadata || {}) as Record<string, unknown>;
                nickname = sanitizePublicNickname(typeof metadata.nickname === 'string' ? metadata.nickname : msg.nickname);
                avatar = sanitizeAvatarId(typeof metadata.avatar_id === 'string' ? metadata.avatar_id : msg.avatar);
              }
            } catch (err) {
              console.warn('Erro ao consultar Supabase Auth API:', err);
            }
          }

          // Se a API não respondeu ou em tokens assinados com sub (auth.uid)
          if (!authenticatedId) {
            try {
              const parts = msg.accessToken.split('.');
              if (parts.length === 3) {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                if (payload.sub && typeof payload.sub === 'string' && payload.sub.length >= 6) {
                  authenticatedId = payload.sub;
                  const metadata = (payload.user_metadata || {}) as Record<string, unknown>;
                  nickname = sanitizePublicNickname(typeof metadata.nickname === 'string' ? metadata.nickname : msg.nickname);
                  avatar = sanitizeAvatarId(typeof metadata.avatar_id === 'string' ? metadata.avatar_id : msg.avatar);
                }
              }
            } catch {
              // Token JWT inválido
            }
          }

          if (!authenticatedId) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              reason: 'invalid_session',
              message: 'Sessão Supabase inválida ou expirada. Faça login novamente.',
            }));
            ws.close(4401, 'Invalid Supabase session');
            return;
          }

          // Validação da Isa Owner (Proprietária Oficial)
          isIsaOwner = msg.role === 'isa_owner';
          if (isIsaOwner && !hasValidIsaSession(request.headers.cookie)) {
            ws.send(JSON.stringify({ type: 'auth_error', reason: 'admin_session_required' }));
            ws.close(4403, 'Admin session required');
            return;
          }
          if (isIsaOwner) {
            nickname = 'Isa (Proprietária)';
            avatar = 'isa';
          }

          const previousSocket = clientSockets.get(authenticatedId);
          if (previousSocket && previousSocket !== ws) previousSocket.close(4001, 'Sessão reconectada');

          playerId = authenticatedId;
          joining = false;
          const newPlayer: RemotePlayer = {
            id: authenticatedId,
            nickname,
            avatar,
            role: isIsaOwner ? 'isa_owner' : 'visitor',
            x: boundedNumber(msg.x, -80, 80),
            y: boundedNumber(msg.y, -10, 30),
            z: boundedNumber(msg.z, -80, 80),
            rotation: boundedNumber(msg.rotation, -Math.PI * 2, Math.PI * 2),
            isMoving: false,
            lastSeen: Date.now(),
          };
          players.set(authenticatedId, newPlayer);
          clientSockets.set(authenticatedId, ws);

          ws.send(JSON.stringify({
            type: 'welcome',
            playerId: authenticatedId,
            players: Array.from(players.values()),
            plots,
            animals,
            communityGoal,
            lands,
            marketListings,
            marketOrders,
            npcProfiles: marketNpcProfiles,
            npcCronStatus: npcPurchaseCronStatus,
          }));
          broadcast({ type: 'player_joined', player: newPlayer }, authenticatedId);
          return;
        }

        if (!playerId || clientSockets.get(playerId) !== ws) return;
        if (msg.type === 'heartbeat') {
          const player = players.get(playerId);
          if (player) player.lastSeen = Date.now();
        } else if (msg.type === 'move') {
          const player = players.get(playerId);
          if (player) {
            player.x = boundedNumber(msg.x, -80, 80);
            player.y = boundedNumber(msg.y, -10, 30);
            player.z = boundedNumber(msg.z, -80, 80);
            player.rotation = boundedNumber(msg.rotation, -Math.PI * 2, Math.PI * 2);
            player.isMoving = msg.isMoving === true;
            player.action = typeof msg.action === 'string' ? msg.action.slice(0, 24) : undefined;
            player.lastSeen = Date.now();
            broadcast({
              type: 'player_moved',
              id: playerId,
              x: player.x,
              y: player.y,
              z: player.z,
              rotation: player.rotation,
              isMoving: player.isMoving,
              action: player.action,
            }, playerId);
          }
        } else if (msg.type === 'chat') {
          const player = players.get(playerId);
          const text = typeof msg.text === 'string' ? msg.text.slice(0, 100) : '';
          if (player && text) {
            player.message = { text, time: Date.now() };
            player.lastSeen = Date.now();
            broadcast({ type: 'player_chat', id: playerId, text, nickname: player.nickname });
          }
        } else if (msg.type === 'crop_action') {
          broadcast({ type: 'crop_action', ...msg }, playerId);
        } else if (msg.type === 'farm_plot_updated') {
          if (msg.plot && typeof msg.plot.id === 'number') {
            const idx = plots.findIndex((p) => p.id === msg.plot.id);
            if (idx !== -1) {
              plots[idx] = { ...plots[idx], ...msg.plot };
            }
          }
          broadcast({ type: 'farm_plot_updated', ...msg }, playerId);
        } else if (msg.type === 'animal_updated') {
          if (msg.animal && msg.animal.id) {
            const idx = animals.findIndex((a) => a.id === msg.animal.id);
            if (idx !== -1) {
              animals[idx] = { ...animals[idx], ...msg.animal };
            }
          }
          broadcast({ type: 'animal_updated', ...msg }, playerId);
        } else if (msg.type === 'community_goal_updated') {
          if (msg.goal) {
            communityGoal.current = Math.min(communityGoal.target, Number(msg.goal.current ?? (communityGoal.current + 1)));
            broadcast({ type: 'community_goal_updated', goal: communityGoal }, playerId);
          }
        } else if (msg.type === 'magic_rain') {
          broadcast({ type: 'magic_rain', ...msg });
        } else if (msg.type === 'isa_reaction' && isIsaOwner) {
          broadcast({ type: 'isa_reaction', ...msg }, playerId);
        }
      } catch {
        if (!playerId) {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'auth_error', reason: 'identity_unavailable' }));
          ws.close(4401, 'Authentication unavailable');
          return;
        }
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'error', message: 'Mensagem inválida.' }));
      }
    });

    ws.on('close', () => {
      if (playerId && clientSockets.get(playerId) === ws) {
        players.delete(playerId);
        clientSockets.delete(playerId);
        broadcast({ type: 'player_left', id: playerId });
      }
    });
  });

  // O heartbeat autenticado mantém jogadores ociosos conectados e remove sockets realmente abandonados.
  setInterval(() => {
    const now = Date.now();
    for (const [id, player] of players.entries()) {
      if (now - player.lastSeen <= 45000) continue;
      const client = clientSockets.get(id);
      if (client && client.readyState === WebSocket.OPEN) {
        player.lastSeen = now;
        client.close(4000, 'Conexão inativa');
      } else {
        players.delete(id);
        if (clientSockets.get(id) === client) clientSockets.delete(id);
        broadcast({ type: 'player_left', id });
      }
    }
  }, 15000);

  // Rotina Automática: Cron fazendinha-isa-npc-purchase (executa a cada 28 segundos)
  setInterval(() => {
    void executeNpcPurchaseCycle();
  }, 28000);
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Retrying or shutting down conflicting instance.`);
      process.exit(1);
    } else {
      console.error('HTTP server error:', err);
    }
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Fazendinha da Isa server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
