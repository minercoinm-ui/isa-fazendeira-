export const PRESET_CHAT_MESSAGES = [
  'Olá, pessoal da fazendinha!',
  'Alguém quer trocar produtos?',
  'Vamos cuidar dos animais!',
  'Minha colheita está pronta!',
  'Que fazenda bonita!',
  'Bom trabalho, fazendeiro!',
] as const;

export type CropType =
  | 'corn'
  | 'soy'
  | 'bean'
  | 'wheat'
  | 'rice'
  | 'tomato'
  | 'carrot'
  | 'strawberry'
  | 'pumpkin'
  | 'lettuce';

export type AnimalType = 'cow' | 'chicken' | 'pig' | 'sheep';

export type ProductId =
  | 'corn'
  | 'soy'
  | 'bean'
  | 'wheat'
  | 'rice'
  | 'tomato'
  | 'carrot'
  | 'strawberry'
  | 'pumpkin'
  | 'lettuce'
  | 'egg'
  | 'milk'
  | 'wool';

export interface CropInfo {
  id: CropType;
  name: string;
  seedCost: number;
  sellValue: number;
  growthTime: number; // in seconds
  xpReward: number;
  icon: string;
  description: string;
}

export const CROPS_CATALOG: Record<CropType, CropInfo> = {
  corn: {
    id: 'corn',
    name: 'Milho',
    seedCost: 10,
    sellValue: 25,
    growthTime: 22,
    xpReward: 20,
    icon: '🌽',
    description: 'Milho doce e nutritivo para a barraca e os animais.',
  },
  soy: {
    id: 'soy',
    name: 'Soja',
    seedCost: 14,
    sellValue: 36,
    growthTime: 26,
    xpReward: 25,
    icon: '🌱',
    description: 'Grão nutritivo muito procurado pelos comerciantes do mercado.',
  },
  bean: {
    id: 'bean',
    name: 'Feijão',
    seedCost: 12,
    sellValue: 32,
    growthTime: 24,
    xpReward: 22,
    icon: '🫘',
    description: 'Feijão fresquinho indispensável na mesa da fazendinha.',
  },
  wheat: {
    id: 'wheat',
    name: 'Trigo',
    seedCost: 16,
    sellValue: 42,
    growthTime: 28,
    xpReward: 30,
    icon: '🌾',
    description: 'Trigo dourado para farinha e pães artesanais.',
  },
  rice: {
    id: 'rice',
    name: 'Arroz',
    seedCost: 15,
    sellValue: 38,
    growthTime: 26,
    xpReward: 28,
    icon: '🍚',
    description: 'Arroz branquinho colhido na várzea.',
  },
  tomato: {
    id: 'tomato',
    name: 'Tomate',
    seedCost: 12,
    sellValue: 30,
    growthTime: 25,
    xpReward: 22,
    icon: '🍅',
    description: 'Tomates vermelhos suculentos e frescos.',
  },
  carrot: {
    id: 'carrot',
    name: 'Cenoura',
    seedCost: 8,
    sellValue: 20,
    growthTime: 18,
    xpReward: 16,
    icon: '🥕',
    description: 'Cenouras frescas direto da terra.',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Morango',
    seedCost: 22,
    sellValue: 55,
    growthTime: 32,
    xpReward: 40,
    icon: '🍓',
    description: 'Morangos docinhos para quitutes e geleias.',
  },
  pumpkin: {
    id: 'pumpkin',
    name: 'Abóbora',
    seedCost: 25,
    sellValue: 70,
    growthTime: 36,
    xpReward: 48,
    icon: '🎃',
    description: 'Abóbora graúda para doces da fazenda.',
  },
  lettuce: {
    id: 'lettuce',
    name: 'Alface',
    seedCost: 8,
    sellValue: 18,
    growthTime: 16,
    xpReward: 14,
    icon: '🥬',
    description: 'Folhas verdes e frescas da horta.',
  },
};

export const MARKET_PRODUCT_INFO: Record<
  ProductId,
  { name: string; icon: string; category: string; defaultPrice: number; description: string }
> = {
  corn: { name: 'Milho', icon: '🌽', category: 'Grãos', defaultPrice: 25, description: 'Milho fresco colhido na roça' },
  soy: { name: 'Soja', icon: '🌱', category: 'Grãos', defaultPrice: 36, description: 'Soja de primeira linha' },
  bean: { name: 'Feijão', icon: '🫘', category: 'Grãos', defaultPrice: 32, description: 'Feijão novo ensacado' },
  wheat: { name: 'Trigo', icon: '🌾', category: 'Grãos', defaultPrice: 42, description: 'Trigo selecionado' },
  rice: { name: 'Arroz', icon: '🍚', category: 'Grãos', defaultPrice: 38, description: 'Arroz branquinho' },
  tomato: { name: 'Tomate', icon: '🍅', category: 'Legumes', defaultPrice: 30, description: 'Tomates maduros' },
  carrot: { name: 'Cenoura', icon: '🥕', category: 'Legumes', defaultPrice: 20, description: 'Cenouras frescas' },
  strawberry: { name: 'Morango', icon: '🍓', category: 'Frutas', defaultPrice: 55, description: 'Morangos doces' },
  pumpkin: { name: 'Abóbora', icon: '🎃', category: 'Legumes', defaultPrice: 70, description: 'Abóbora graúda' },
  lettuce: { name: 'Alface', icon: '🥬', category: 'Hortaliças', defaultPrice: 18, description: 'Folhas frescas' },
  egg: { name: 'Ovos', icon: '🥚', category: 'Granja', defaultPrice: 15, description: 'Ovos caipiras' },
  milk: { name: 'Leite', icon: '🥛', category: 'Laticínios', defaultPrice: 35, description: 'Leite puro e fresco' },
  wool: { name: 'Lã', icon: '🧶', category: 'Pecuária', defaultPrice: 40, description: 'Lã macia tosquiada' },
};

export interface FarmPlot {
  id: number;
  cropType: CropType | null;
  stage: number; // 0 = empty/tilled, 1 = seed, 2 = sprout, 3 = developing, 4 = grown, 5 = mature/ready
  watered: boolean;
  plantedAt: number | null;
  growthTime: number; // in seconds
}

export interface FarmAnimal {
  id: string;
  type: AnimalType;
  name: string;
  x: number;
  z: number;
  hunger: number; // 0 to 100
  lastFedAt: number;
  readyToProduce: boolean;
  produceType: 'milk' | 'egg' | 'truffle' | 'wool';
  produceCount: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'seed' | 'crop' | 'product' | 'tool';
  count: number;
  icon: string;
  value: number;
}

export interface CommunityGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
}

export interface IsaMission {
  id: string;
  title: string;
  description: string;
  isaDialogue: string;
  requiredAction: 'talk' | 'plant_corn' | 'harvest_corn' | 'feed_animal' | 'water_crop' | 'community' | 'buy_land' | 'market_sell';
  requiredCount: number;
  currentCount: number;
  rewardCoins: number;
  rewardXp: number;
  completed: boolean;
  claimed: boolean;
}

export interface RemotePlayer {
  id: string;
  nickname: string;
  avatar: string;
  color: string;
  role?: 'visitor' | 'isa_owner';
  x: number;
  y: number;
  z: number;
  rotation: number;
  isMoving: boolean;
  action?: string;
  lastSeen: number;
  message?: {
    text: string;
    time: number;
  };
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: string;
  role: 'visitor' | 'isa_owner';
  level: number;
  xp: number;
  nextLevelXp: number;
  coins: number;
  inventory: Record<string, InventoryItem>;
  ownedLandIds: string[];
}

export interface MarketListing {
  id: string;
  stallId: string;
  sellerId: string;
  sellerName: string;
  productId: ProductId;
  productName: string;
  icon: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
  createdAt: number;
  category?: string;
}

export interface MarketTransaction {
  id: string;
  listingId?: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  productId: ProductId;
  quantity: number;
  totalCost: number;
  timestamp: number;
}

export interface LandConstruction {
  id: string;
  type: 'fence' | 'shed' | 'animal_pen' | 'garden_bed' | 'lantern';
  label: string;
  x: number;
  z: number;
}

export type TalhaoCategory =
  | 'small'
  | 'medium'
  | 'large'
  | 'special'
  | 'river'
  | 'lake';

export interface FarmLand {
  id: string;
  code?: string; // Ex: 'TALHÃO 001'
  name: string;
  category?: TalhaoCategory;
  categoryLabel?: string;
  description: string;
  price: number;
  areaM2: number;
  plotsCount?: number; // Slots de plantio individual
  plots?: FarmPlot[];
  soilPrepared?: boolean;
  ownerId: string | null;
  ownerName: string | null;
  status: 'available' | 'owned' | 'locked';
  x: number;
  z: number;
  width: number;
  depth: number;
  color?: string;
  constructions: LandConstruction[];
}

// Compradores Automáticos do Mercado (NPCs)
export interface MarketOrderItem {
  productId: ProductId;
  productName: string;
  icon: string;
  count: number;
}

export interface MarketOrder {
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

export interface MarketBuyerNPC {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  personality: string;
  dialogueGreeting: string;
  orders: MarketOrder[];
}

export type IsaAnimationState =
  | 'idle'
  | 'laughing'
  | 'jumping'
  | 'clapping'
  | 'dancing'
  | 'waving'
  | 'cheering'
  | 'surprised'
  | 'thanking';

export interface IsaReactionEvent {
  id: string;
  type: 'level_up' | 'great_harvest' | 'community_goal' | 'buy_land' | 'player_join' | 'idle_encouragement' | 'milestone';
  speech: string;
  animation: IsaAnimationState;
  timestamp: number;
}

// Catálogo com 12 Avatares Oficiais em 3D
export interface AvatarDefinition {
  id: string;
  name: string;
  title: string;
  icon: string;
  desc: string;
  skinColor: number;
  hairColor: number;
  shirtColor: number;
  pantsColor: number;
  hatColor: number;
  hatType: 'straw' | 'cap' | 'bandana' | 'bow' | 'none';
  hairStyle: 'short' | 'curly' | 'pigtails' | 'braids' | 'wavy';
}

export const AVATAR_CATALOG: AvatarDefinition[] = [
  {
    id: 'leo',
    name: 'Léo',
    title: 'Menino Fazendeiro de Chapéu',
    icon: '👦',
    desc: 'Camisa verde xadrez, chapéu de fazendeiro e calça jeans azul.',
    skinColor: 0xf5c396,
    hairColor: 0x451a03,
    shirtColor: 0x16a34a,
    pantsColor: 0x1d4ed8,
    hatColor: 0x854d0e,
    hatType: 'straw',
    hairStyle: 'short',
  },
  {
    id: 'nina',
    name: 'Nina',
    title: 'Menina Fazendeira de Jardineira',
    icon: '👧',
    desc: 'Camiseta amarela alegre, jardineira jeans e marias-chiquinhas.',
    skinColor: 0xeb9c68,
    hairColor: 0x1c1917,
    shirtColor: 0xeab308,
    pantsColor: 0x2563eb,
    hatColor: 0xd97706,
    hatType: 'straw',
    hairStyle: 'pigtails',
  },
  {
    id: 'theo',
    name: 'Theo',
    title: 'Menino com Roupa Rural',
    icon: '🧢',
    desc: 'Camisa xadrez vermelha, boné esportivo e tênis marrom.',
    skinColor: 0xf5c396,
    hairColor: 0x78350f,
    shirtColor: 0xdc2626,
    pantsColor: 0x475569,
    hatColor: 0xb91c1c,
    hatType: 'cap',
    hairStyle: 'short',
  },
  {
    id: 'bella',
    name: 'Bella',
    title: 'Menina com Vestido e Botas',
    icon: '🌸',
    desc: 'Vestidinho floral lilás, flor no cabelo e botinhas delicadas.',
    skinColor: 0xa16207,
    hairColor: 0x09090b,
    shirtColor: 0xc084fc,
    pantsColor: 0x9333ea,
    hatColor: 0xf472b6,
    hatType: 'bow',
    hairStyle: 'wavy',
  },
  {
    id: 'bento',
    name: 'Bento',
    title: 'Fazendeiro com Camisa Xadrez',
    icon: '🤠',
    desc: 'Camisa xadrez azul marinho, chapéu de couro e fivela caipira.',
    skinColor: 0xe0a97b,
    hairColor: 0x27272a,
    shirtColor: 0x0284c7,
    pantsColor: 0x334155,
    hatColor: 0x78350f,
    hatType: 'straw',
    hairStyle: 'short',
  },
  {
    id: 'lia',
    name: 'Lia',
    title: 'Fazendeira com Chapéu de Palha',
    icon: '🌾',
    desc: 'Chapéu de palha grande com fita vermelha e trança comprida.',
    skinColor: 0xf5c396,
    hairColor: 0x854d0e,
    shirtColor: 0xf97316,
    pantsColor: 0x1e3a8a,
    hatColor: 0xfde047,
    hatType: 'straw',
    hairStyle: 'braids',
  },
  {
    id: 'davi',
    name: 'Davi',
    title: 'Menino com Macacão Jeans',
    icon: '🚜',
    desc: 'Macacão jeans índigo resistente, camiseta laranja e botinas.',
    skinColor: 0xd49b6a,
    hairColor: 0x171717,
    shirtColor: 0xea580c,
    pantsColor: 0x1e40af,
    hatColor: 0xa16207,
    hatType: 'none',
    hairStyle: 'short',
  },
  {
    id: 'maya',
    name: 'Maya',
    title: 'Menina com Jardineira Rosa',
    icon: '🎀',
    desc: 'Jardineira rosa-bebê, camiseta branca e laço de fita na cabeça.',
    skinColor: 0x8d5b4c,
    hairColor: 0x18181b,
    shirtColor: 0xf472b6,
    pantsColor: 0xdb2777,
    hatColor: 0xfbcfe8,
    hatType: 'bow',
    hairStyle: 'curly',
  },
  {
    id: 'zeca',
    name: 'Zeca',
    title: 'Fazendeiro com Roupa Verde',
    icon: '🌱',
    desc: 'Macacão verde musgo, camiseta bege e botina de campo.',
    skinColor: 0xf3b88c,
    hairColor: 0x3f2e18,
    shirtColor: 0x65a30d,
    pantsColor: 0x365314,
    hatColor: 0xca8a04,
    hatType: 'straw',
    hairStyle: 'short',
  },
  {
    id: 'mel',
    name: 'Mel',
    title: 'Fazendeira com Roupas Amarelas',
    icon: '🌻',
    desc: 'Camisa amarelo-girassol, jardineira jeans claro e broche de flor.',
    skinColor: 0xfcd34d,
    hairColor: 0x713f12,
    shirtColor: 0xfacc15,
    pantsColor: 0x38bdf8,
    hatColor: 0xeab308,
    hatType: 'bow',
    hairStyle: 'wavy',
  },
  {
    id: 'kaua',
    name: 'Kauã',
    title: 'Menino com Cabelo Cacheado',
    icon: '✨',
    desc: 'Cabelos cacheados volumosos pretos, jardineira terracota e bota.',
    skinColor: 0x694336,
    hairColor: 0x09090b,
    shirtColor: 0xf97316,
    pantsColor: 0x9a3412,
    hatColor: 0x431407,
    hatType: 'none',
    hairStyle: 'curly',
  },
  {
    id: 'aninha',
    name: 'Aninha',
    title: 'Menina com Tranças',
    icon: '👧🏽',
    desc: 'Tranças longas com laços coloridos, vestido lavanda e bochechas rosadas.',
    skinColor: 0xb57850,
    hairColor: 0x18181b,
    shirtColor: 0xa855f7,
    pantsColor: 0x7e22ce,
    hatColor: 0xc084fc,
    hatType: 'bow',
    hairStyle: 'braids',
  },
];

export interface MarketNpcProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  icon: string;
  preferred_category: string;
  max_unit_price: number;
  daily_budget: number;
  budget_remaining: number;
  personality: string;
}

export interface NpcPurchaseTransaction {
  transaction_id: string;
  npc_id: string;
  npc_name: string;
  npc_avatar: string;
  npc_icon: string;
  seller_id: string;
  seller_name: string;
  stall_id?: string;
  product_id: string;
  product_name: string;
  icon: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  seller_new_balance: number;
  npc_budget_remaining: number;
  remaining_stock: number;
  timestamp: string;
}

export interface NpcCronStatus {
  cronName: string;
  active: boolean;
  frequencySeconds: number;
  lastRun: string | null;
  lastPurchase: NpcPurchaseTransaction | null;
  totalPurchases: number;
  totalCoinsSpent: number;
  errors: string[];
  npcs: MarketNpcProfile[];
}

export interface FarmExpansionPackage {
  id: string;
  name: string;
  description: string;
  plotCount: number;
  plotIds: number[];
  price: number;
  icon: string;
}

export const FARM_EXPANSION_PACKAGES: FarmExpansionPackage[] = [
  {
    id: 'exp-east',
    name: 'Horta Leste (Lado do Moinho)',
    description: '4 novos canteiros férteis organizados ao leste da horta central.',
    plotCount: 4,
    plotIds: [16, 17, 18, 19],
    price: 150,
    icon: '🌾',
  },
  {
    id: 'exp-stream',
    name: 'Canteiros do Riacho',
    description: '4 novos canteiros arejados próximos à brisa do riacho e da ponte.',
    plotCount: 4,
    plotIds: [20, 21, 22, 23],
    price: 300,
    icon: '💧',
  },
  {
    id: 'exp-orchard',
    name: 'Horta Nobre do Pomar',
    description: '4 canteiros com solo enriquecido para cultivo de morango, abóbora e soja.',
    plotCount: 4,
    plotIds: [24, 25, 26, 27],
    price: 500,
    icon: '🍓',
  },
  {
    id: 'exp-safra',
    name: 'Grande Safra da Isa',
    description: 'A maior expansão da fazenda! 4 canteiros amplos para safras em larga escala.',
    plotCount: 4,
    plotIds: [28, 29, 30, 31],
    price: 800,
    icon: '🚜',
  },
];
