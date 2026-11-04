import test from 'node:test';
import assert from 'node:assert/strict';

// Perfis padrão oficiais cadastrados em market_npc_profiles no Supabase
export const DEFAULT_NPC_PREFERRED_PRODUCTS = {
  'npc-antonio': {
    productId: 'corn',
    name: 'Milho Dourado',
    icon: '🌽',
    category: 'crop',
  },
  'npc-francisca': {
    productId: 'carrot',
    name: 'Cenoura Crocante',
    icon: '🥕',
    category: 'crop',
  },
  'npc-tiao': {
    productId: 'wheat',
    name: 'Trigo Dourado',
    icon: '🌾',
    category: 'grains',
  },
  'npc-benta': {
    productId: 'milk',
    name: 'Balde de Leite',
    icon: '🥛',
    category: 'product',
  },
  'npc-carlinhos': {
    productId: 'strawberry',
    name: 'Morango Silvestre',
    icon: '🍓',
    category: 'fruits',
  },
};

export function resolveNpcPreferredProduct(profileOrId) {
  const id = typeof profileOrId === 'string' ? profileOrId : profileOrId.id;
  const fallback = DEFAULT_NPC_PREFERRED_PRODUCTS[id] || {
    productId: 'corn',
    name: 'Milho Dourado',
    icon: '🌽',
    category: 'crop',
  };

  if (typeof profileOrId === 'string') {
    return { ...fallback };
  }

  const anyProfile = profileOrId;
  if (anyProfile.preferred_product || anyProfile.preferred_crop) {
    const prodKey = String(anyProfile.preferred_product || anyProfile.preferred_crop).toLowerCase();
    const map = {
      corn: { productId: 'corn', name: 'Milho Dourado', icon: '🌽' },
      carrot: { productId: 'carrot', name: 'Cenoura Crocante', icon: '🥕' },
      tomato: { productId: 'tomato', name: 'Tomate Vermelhinho', icon: '🍅' },
      wheat: { productId: 'wheat', name: 'Trigo Dourado', icon: '🌾' },
      milk: { productId: 'milk', name: 'Balde de Leite', icon: '🥛' },
      strawberry: { productId: 'strawberry', name: 'Morango Silvestre', icon: '🍓' },
    };
    if (map[prodKey]) {
      return map[prodKey];
    }
  }

  const cat = String(profileOrId.preferred_category || '').toLowerCase();
  const personality = String(profileOrId.personality || '').toLowerCase();

  if (personality.includes('cenoura')) {
    return { productId: 'carrot', name: 'Cenoura Crocante', icon: '🥕', category: 'crop' };
  }
  if (personality.includes('milho')) {
    return { productId: 'corn', name: 'Milho Dourado', icon: '🌽', category: 'crop' };
  }
  if (personality.includes('leite')) {
    return { productId: 'milk', name: 'Balde de Leite', icon: '🥛', category: 'product' };
  }
  if (personality.includes('trigo') || personality.includes('soja') || cat === 'grains') {
    return { productId: 'wheat', name: 'Trigo Dourado', icon: '🌾', category: 'grains' };
  }
  if (personality.includes('morango') || cat === 'fruits') {
    return { productId: 'strawberry', name: 'Morango Silvestre', icon: '🍓', category: 'fruits' };
  }

  return { ...fallback };
}

test('1. Perfis Oficiais dos 5 NPCs no Supabase possuem produtos e ícones cadastrados', () => {
  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-antonio'].productId, 'corn');
  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-antonio'].icon, '🌽');

  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-francisca'].productId, 'carrot');
  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-francisca'].icon, '🥕');

  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-tiao'].productId, 'wheat');
  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-tiao'].icon, '🌾');

  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-benta'].productId, 'milk');
  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-benta'].icon, '🥛');

  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-carlinhos'].productId, 'strawberry');
  assert.equal(DEFAULT_NPC_PREFERRED_PRODUCTS['npc-carlinhos'].icon, '🍓');
});

test('2. resolveNpcPreferredProduct mapeia corretamente perfis dinâmicos do Supabase', () => {
  // Teste com id simples
  const antonio = resolveNpcPreferredProduct('npc-antonio');
  assert.equal(antonio.productId, 'corn');
  assert.equal(antonio.icon, '🌽');

  // Teste com registro vindo do banco Supabase com personality e preferred_category
  const supabaseRowFrancisca = {
    id: 'npc-francisca',
    name: 'Dona Francisca',
    preferred_category: 'crop',
    personality: 'Gosta de cenouras crocantes e quitutes frescos.',
  };
  const francisca = resolveNpcPreferredProduct(supabaseRowFrancisca);
  assert.equal(francisca.productId, 'carrot');
  assert.equal(francisca.icon, '🥕');

  // Teste com produto explícito definido no banco
  const customNpc = {
    id: 'npc-custom',
    name: 'Comprador Visitante',
    preferred_product: 'tomato',
  };
  const resolved = resolveNpcPreferredProduct(customNpc);
  assert.equal(resolved.productId, 'tomato');
  assert.equal(resolved.icon, '🍅');
});

test('3. Detecção de entrada na área de barraca (stall zone) ativa o balão de pensamento', () => {
  const marketPos = { x: -12, z: 5 };
  const stallOffset = -1.2;
  const stallPos = { x: marketPos.x + stallOffset, z: marketPos.z + 2.5 };

  function checkInStallZone(npcPos, state) {
    const distToMarket = Math.hypot(npcPos.x - marketPos.x, npcPos.z - marketPos.z);
    const distToStall = Math.hypot(npcPos.x - stallPos.x, npcPos.z - stallPos.z);
    return (
      distToMarket <= 5.2 ||
      distToStall <= 3.2 ||
      state === 'buying' ||
      (state === 'walking_to_stall' && distToMarket <= 6.2)
    );
  }

  // Posição no moinho/casa do Seu Antônio (longe da barraca)
  const homePos = { x: -7.0, z: 11.5 };
  assert.equal(checkInStallZone(homePos, 'idle'), false, 'Não deve exibir balão na posição de descanso');

  // Posição na frente da barraca do mercado
  const atStallPos = { x: stallPos.x, z: stallPos.z };
  assert.equal(checkInStallZone(atStallPos, 'buying'), true, 'Deve exibir balão ao estar na barraca');

  // NPC se aproximando e entrando no raio da barraca
  const enteringPos = { x: -11.0, z: 6.0 };
  assert.equal(checkInStallZone(enteringPos, 'walking_to_stall'), true, 'Deve exibir balão ao entrar na área da barraca');
});

test('4. Dinâmica de escala e flutuação do balão de pensamento', () => {
  let currentScale = 0;
  const targetScale = 1.85;
  const delta = 0.03; // ~30ms frame

  // Simula interpolação de entrada (lerp)
  for (let i = 0; i < 20; i++) {
    currentScale += (targetScale - currentScale) * Math.min(1, delta * 8.5);
  }
  assert.ok(currentScale > 1.5, 'A escala do balão deve inflar suavemente em direção a 1.85');

  // Bobbing de flutuação
  const baseHeight = 2.95;
  const time = 1.5;
  const bob = Math.sin(time * 3.2) * 0.08;
  const finalY = baseHeight + bob;

  assert.ok(finalY >= baseHeight - 0.08 && finalY <= baseHeight + 0.08, 'A altura do balão deve oscilar suavemente em torno de 2.95m');
});
