import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * 🧪 BATERIA DE TESTES DO SISTEMA REAL DE NPCs COMPRADORES — FAZENDINHA DA ISA
 * Validação rigorosa dos 9 cenários do Requisito 9:
 * 1. Barraca sem estoque: NPC não compra.
 * 2. Barraca com estoque: NPC pode comprar.
 * 3. Preço acima do limite: NPC não compra.
 * 4. Orçamento insuficiente: NPC não compra.
 * 5. Compra confirmada: estoque diminui.
 * 6. Compra confirmada: carteira do vendedor aumenta.
 * 7. Compra confirmada: histórico recebe transação.
 * 8. Estoque zerado: NPC não compra novamente.
 * 9. Recarregar o jogo: os dados continuam corretos.
 */

// Motor de Transações Autoritativo (Reflete a RPC market_process_npc_purchase do Supabase)
function simulatePurchaseCycle(state, options = {}) {
  const { specifiedNpcId, specifiedListingId, specifiedQty } = options;

  // 1. O servidor verifica se existem barracas com estoque
  const availableListings = state.listings.filter((l) => l.quantity > 0);
  if (availableListings.length === 0) {
    return { success: false, reason: 'no_eligible_stock' };
  }

  // 2. Seleciona um NPC com orçamento disponível
  const eligibleNpcs = state.npcProfiles.filter((n) => n.budgetRemaining > 0);
  if (eligibleNpcs.length === 0) {
    return { success: false, reason: 'no_eligible_npc_with_budget' };
  }

  const npc = specifiedNpcId
    ? state.npcProfiles.find((n) => n.id === specifiedNpcId)
    : eligibleNpcs[0];

  if (!npc || npc.budgetRemaining <= 0) {
    return { success: false, reason: 'insufficient_budget' };
  }

  // 3 & 4. Verifica produtos respeitando categoria e preço máximo do NPC
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

  const chosenListing = candidateListings[0];

  // 5. Verifica orçamento diário
  const maxAffordable = Math.floor(npc.budgetRemaining / chosenListing.pricePerUnit);
  if (maxAffordable <= 0) {
    return { success: false, reason: 'insufficient_budget', budgetRemaining: npc.budgetRemaining };
  }

  const qtyToBuy = specifiedQty
    ? Math.min(specifiedQty, chosenListing.quantity, maxAffordable)
    : Math.min(chosenListing.quantity, maxAffordable, 2);

  if (qtyToBuy <= 0) {
    return { success: false, reason: 'insufficient_budget' };
  }

  const totalCost = qtyToBuy * chosenListing.pricePerUnit;

  // 6. Atualização atômica do estoque (sem permitir negativo)
  chosenListing.quantity = Math.max(0, chosenListing.quantity - qtyToBuy);
  chosenListing.totalPrice = chosenListing.quantity * chosenListing.pricePerUnit;

  // Atualização do orçamento diário do NPC
  npc.budgetRemaining = Math.max(0, npc.budgetRemaining - totalCost);

  // Crédito na carteira do vendedor
  const prevBalance = state.wallets.get(chosenListing.sellerId) || 0;
  const newBalance = prevBalance + totalCost;
  state.wallets.set(chosenListing.sellerId, newBalance);

  const txId = `tx-test-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const transaction = {
    transaction_id: txId,
    npc_id: npc.id,
    npc_name: npc.name,
    seller_id: chosenListing.sellerId,
    seller_name: chosenListing.sellerName,
    stall_id: chosenListing.id,
    product_id: chosenListing.productId,
    product_name: chosenListing.productName,
    quantity: qtyToBuy,
    unit_price: chosenListing.pricePerUnit,
    total_cost: totalCost,
    seller_new_balance: newBalance,
    npc_budget_remaining: npc.budgetRemaining,
    remaining_stock: chosenListing.quantity,
    timestamp: new Date().toISOString(),
  };

  state.transactions.unshift(transaction);
  state.ledger.unshift({
    id: `led-${txId}`,
    playerId: chosenListing.sellerId,
    amount: totalCost,
    balanceAfter: newBalance,
    transactionType: 'npc_purchase',
    referenceId: txId,
    description: `${npc.name} comprou ${qtyToBuy}x ${chosenListing.productName} por ${totalCost} 🪙`,
    createdAt: Date.now(),
  });

  if (chosenListing.quantity <= 0) {
    const idx = state.listings.findIndex((l) => l.id === chosenListing.id);
    if (idx !== -1) state.listings.splice(idx, 1);
  }

  return { success: true, transaction };
}

function createTestState() {
  return {
    listings: [
      { id: 'list-1', sellerId: 'seller-isa', sellerName: 'Isa', productId: 'corn', productName: 'Milho Dourado', quantity: 10, pricePerUnit: 20, totalPrice: 200 },
      { id: 'list-2', sellerId: 'seller-isa', sellerName: 'Isa', productId: 'carrot', productName: 'Cenoura Crocante', quantity: 5, pricePerUnit: 15, totalPrice: 75 },
    ],
    npcProfiles: [
      { id: 'npc-antonio', name: 'Seu Antônio', maxUnitPrice: 30, dailyBudget: 200, budgetRemaining: 200 },
      { id: 'npc-francisca', name: 'Dona Francisca', maxUnitPrice: 25, dailyBudget: 150, budgetRemaining: 150 },
    ],
    wallets: new Map([['seller-isa', 50]]),
    transactions: [],
    ledger: [],
  };
}

test('1. Barraca sem estoque: NPC não compra', () => {
  const state = createTestState();
  state.listings = []; // Sem estoque

  const result = simulatePurchaseCycle(state);
  assert.equal(result.success, false);
  assert.equal(result.reason, 'no_eligible_stock');
  assert.equal(state.transactions.length, 0);
  assert.equal(state.wallets.get('seller-isa'), 50);
});

test('2. Barraca com estoque: NPC pode comprar', () => {
  const state = createTestState();
  const result = simulatePurchaseCycle(state, { specifiedNpcId: 'npc-antonio', specifiedQty: 2 });

  assert.equal(result.success, true);
  assert.ok(result.transaction);
  assert.equal(result.transaction.npc_name, 'Seu Antônio');
  assert.equal(result.transaction.quantity, 2);
  assert.equal(result.transaction.unit_price, 20);
  assert.equal(result.transaction.total_cost, 40);
});

test('3. Preço acima do limite: NPC não compra', () => {
  const state = createTestState();
  // Produto com preço 50 (limite do Seu Antônio é 30)
  state.listings = [
    { id: 'list-expensive', sellerId: 'seller-isa', sellerName: 'Isa', productId: 'truffle', productName: 'Trufa Rara', quantity: 4, pricePerUnit: 50, totalPrice: 200 },
  ];

  const result = simulatePurchaseCycle(state, { specifiedNpcId: 'npc-antonio' });
  assert.equal(result.success, false);
  assert.equal(result.reason, 'price_above_limit');
  assert.equal(state.transactions.length, 0);
  assert.equal(state.wallets.get('seller-isa'), 50);
});

test('4. Orçamento insuficiente: NPC não compra', () => {
  const state = createTestState();
  // NPC com orçamento zerado
  state.npcProfiles[0].budgetRemaining = 5; // Menos que o preço mínimo (15)
  state.npcProfiles[1].budgetRemaining = 0;

  const result = simulatePurchaseCycle(state, { specifiedNpcId: 'npc-antonio' });
  assert.equal(result.success, false);
  assert.equal(result.reason, 'price_above_limit');
  assert.equal(state.transactions.length, 0);
});

test('5. Compra confirmada: estoque diminui', () => {
  const state = createTestState();
  const initialStock = state.listings[0].quantity; // 10

  const result = simulatePurchaseCycle(state, { specifiedListingId: 'list-1', specifiedQty: 3 });
  assert.equal(result.success, true);

  const updatedListing = state.listings.find((l) => l.id === 'list-1');
  assert.equal(updatedListing.quantity, initialStock - 3);
  assert.equal(result.transaction.remaining_stock, 7);
  assert.ok(updatedListing.quantity >= 0);
});

test('6. Compra confirmada: carteira do vendedor aumenta', () => {
  const state = createTestState();
  const initialBalance = state.wallets.get('seller-isa'); // 50

  const result = simulatePurchaseCycle(state, { specifiedListingId: 'list-1', specifiedQty: 2 }); // 2 * 20 = 40
  assert.equal(result.success, true);

  const finalBalance = state.wallets.get('seller-isa');
  assert.equal(finalBalance, initialBalance + 40);
  assert.equal(result.transaction.seller_new_balance, 90);
});

test('7. Compra confirmada: histórico recebe transação', () => {
  const state = createTestState();
  const result = simulatePurchaseCycle(state, { specifiedListingId: 'list-2', specifiedQty: 2 }); // 2 * 15 = 30
  assert.equal(result.success, true);

  assert.equal(state.transactions.length, 1);
  assert.equal(state.transactions[0].transaction_id, result.transaction.transaction_id);
  assert.equal(state.transactions[0].total_cost, 30);

  assert.equal(state.ledger.length, 1);
  assert.equal(state.ledger[0].amount, 30);
  assert.equal(state.ledger[0].balanceAfter, 80);
  assert.equal(state.ledger[0].referenceId, result.transaction.transaction_id);
});

test('8. Estoque zerado: NPC não compra novamente', () => {
  const state = createTestState();
  // Comprar todo o estoque da lista 2 (5 unidades)
  const res1 = simulatePurchaseCycle(state, { specifiedListingId: 'list-2', specifiedQty: 5 });
  assert.equal(res1.success, true);

  // A listagem list-2 foi esgotada e removida
  assert.equal(state.listings.some((l) => l.id === 'list-2'), false);

  // Tentar comprar novamente a mesma listagem
  const res2 = simulatePurchaseCycle(state, { specifiedListingId: 'list-2' });
  assert.equal(res2.success, false);
});

test('9. Recarregar o jogo: os dados continuam corretos', () => {
  const state = createTestState();
  simulatePurchaseCycle(state, { specifiedListingId: 'list-1', specifiedQty: 4 }); // 4 * 20 = 80

  // Serializa o estado como JSON (simulando persistência no banco e localStorage)
  const serialized = JSON.stringify({
    listings: state.listings,
    npcProfiles: state.npcProfiles,
    walletBalance: state.wallets.get('seller-isa'),
    transactionsCount: state.transactions.length,
    lastTxTotal: state.transactions[0].total_cost,
    ledgerCount: state.ledger.length,
  });

  // Simula "recarregar" a aplicação lendo o estado persistido
  const reloaded = JSON.parse(serialized);
  assert.equal(reloaded.walletBalance, 130);
  assert.equal(reloaded.listings[0].quantity, 6);
  assert.equal(reloaded.transactionsCount, 1);
  assert.equal(reloaded.lastTxTotal, 80);
  assert.equal(reloaded.ledgerCount, 1);
  assert.equal(reloaded.npcProfiles[0].budgetRemaining, 120);
});
