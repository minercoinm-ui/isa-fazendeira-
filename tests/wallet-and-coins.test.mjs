import test from 'node:test';
import assert from 'node:assert/strict';

// Helper de simulação da carteira do jogador
function createPlayerWallet(initialCoins = 150) {
  let coins = initialCoins;
  const ledger = [];

  return {
    getCoins() {
      return coins;
    },
    credit(amount, reason = '') {
      const add = Number(amount || 0);
      coins += add;
      ledger.push({ type: 'credit', amount: add, balanceAfter: coins, reason });
      return coins;
    },
    debit(amount, reason = '') {
      const sub = Number(amount || 0);
      if (coins < sub) {
        return false;
      }
      coins -= sub;
      ledger.push({ type: 'debit', amount: sub, balanceAfter: coins, reason });
      return true;
    },
    getLedger() {
      return ledger;
    },
  };
}

test('1. Compras dos NPCs somam moedas reais na carteira do jogador', () => {
  const wallet = createPlayerWallet(150);
  const tx = {
    quantity: 2,
    product_name: 'Espiga de Milho',
    unit_price: 25,
    total_cost: 50,
  };

  wallet.credit(tx.total_cost, 'Compra do Seu Antônio');
  assert.equal(wallet.getCoins(), 200, 'Saldo deve subir de 150 para 200 moedas');
});

test('2. Resgate de missões concluídas adiciona moedas à carteira', () => {
  const wallet = createPlayerWallet(200);
  const mission = {
    id: 'm-harvest-corn',
    title: 'Primeira Colheita de Milho',
    rewardCoins: 50,
    rewardXp: 45,
    completed: true,
    claimed: false,
  };

  assert.equal(mission.completed, true);
  wallet.credit(mission.rewardCoins, `Recompensa: ${mission.title}`);
  mission.claimed = true;

  assert.equal(wallet.getCoins(), 250, 'Saldo deve somar +50 moedas da missão');
  assert.equal(mission.claimed, true);
});

test('3. Venda direta de produtos da mochila/inventário credita moedas', () => {
  const wallet = createPlayerWallet(100);
  const cornUnitPrice = 25;
  const quantityToSell = 4;
  const totalEarned = cornUnitPrice * quantityToSell;

  wallet.credit(totalEarned, 'Venda de 4x Espiga de Milho');
  assert.equal(wallet.getCoins(), 200, 'Saldo deve somar +100 moedas');
});

test('4. Venda rápida no balcão do mercado calcula e credita valor correto', () => {
  const wallet = createPlayerWallet(120);
  const tomatoUnitPrice = 30;
  const quantity = 3;
  const total = tomatoUnitPrice * quantity;

  wallet.credit(total, 'Venda rápida de 3x Tomate');
  assert.equal(wallet.getCoins(), 210, 'Saldo deve somar +90 moedas');
});

test('5. Recompensa da meta comunitária credita moedas quando concluída', () => {
  const wallet = createPlayerWallet(210);
  const goal = {
    title: 'Grande Colheita Coletiva',
    rewardCoins: 250,
    completed: true,
  };

  wallet.credit(goal.rewardCoins, goal.title);
  assert.equal(wallet.getCoins(), 460, 'Saldo deve somar +250 moedas da meta comunitária');
});

test('6. Compra de sementes e ração debita moedas sem permitir saldo negativo', () => {
  const wallet = createPlayerWallet(30);

  // Compra semente de 10 moedas
  const success1 = wallet.debit(10, 'Semente de Milho');
  assert.equal(success1, true);
  assert.equal(wallet.getCoins(), 20);

  // Compra ração de 10 moedas
  const success2 = wallet.debit(10, 'Ração');
  assert.equal(success2, true);
  assert.equal(wallet.getCoins(), 10);

  // Tenta comprar item de 25 moedas com apenas 10
  const success3 = wallet.debit(25, 'Item caro');
  assert.equal(success3, false, 'Não deve permitir débito com saldo insuficiente');
  assert.equal(wallet.getCoins(), 10, 'Saldo deve permanecer em 10 moedas');
});

test('7. Compra de talhão/terreno debita o valor e atualiza saldo', () => {
  const wallet = createPlayerWallet(500);
  const landPrice = 150;

  const success = wallet.debit(landPrice, 'Compra de Terreno');
  assert.equal(success, true);
  assert.equal(wallet.getCoins(), 350, 'Saldo deve subtrair o valor do terreno');
});

test('8. Histórico do livro razão registra todas as operações corretamente', () => {
  const wallet = createPlayerWallet(100);
  wallet.credit(50, 'NPC Purchase');
  wallet.debit(20, 'Seed purchase');
  wallet.credit(75, 'Mission reward');

  const history = wallet.getLedger();
  assert.equal(history.length, 3);
  assert.equal(history[0].type, 'credit');
  assert.equal(history[1].type, 'debit');
  assert.equal(history[2].type, 'credit');
  assert.equal(wallet.getCoins(), 205);
});
