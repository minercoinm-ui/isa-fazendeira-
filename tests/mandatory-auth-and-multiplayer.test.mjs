import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';

function makeSupabaseAuthJwt(sub, email, nickname, avatarId) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    sub,
    email,
    aud: 'authenticated',
    role: 'authenticated',
    user_metadata: {
      nickname,
      avatar_id: avatarId,
    },
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).toString('base64');
  const signature = Buffer.from('mock_signature').toString('base64');
  return `${header}.${payload}.${signature}`;
}

test('1. Acesso sem autenticação (sem token) é rejeitado pelo servidor com 4401', async () => {
  const ws = new WebSocket('ws://localhost:3000/ws/farm');
  
  const result = await new Promise((resolve) => {
    let authErrorReceived = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'join',
        nickname: 'Visitante Invasor',
        avatar: 'leo',
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'auth_error') {
        authErrorReceived = true;
      }
    });

    ws.on('close', (code, reason) => {
      resolve({ code, reason: reason.toString(), authErrorReceived });
    });
  });

  assert.equal(result.authErrorReceived, true, 'Deve enviar mensagem auth_error');
  assert.equal(result.code, 4401, 'Deve fechar o socket com código 4401 (Authentication required)');
});

test('2. Token de convidado (guest-token ou guest-*) é rejeitado estritamente', async () => {
  const ws = new WebSocket('ws://localhost:3000/ws/farm');

  const result = await new Promise((resolve) => {
    let authErrorReceived = false;

    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'join',
        accessToken: 'guest-token',
        nickname: 'Visitante Fake',
        avatar: 'theo',
      }));
    });

    ws.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'auth_error') {
        authErrorReceived = true;
      }
    });

    ws.on('close', (code, reason) => {
      resolve({ code, reason: reason.toString(), authErrorReceived });
    });
  });

  assert.equal(result.authErrorReceived, true, 'Deve recusar token guest-token');
  assert.equal(result.code, 4401, 'Deve fechar com código 4401');
});

test('3. Dois jogadores autenticados conectam simultaneamente com seus respectivos auth.uid() e se movimentam', async () => {
  const uid1 = 'user-alpha-1111';
  const token1 = makeSupabaseAuthJwt(uid1, 'maria@fazendinha.com', 'Mariazinha', 'nina');

  const uid2 = 'user-beta-2222';
  const token2 = makeSupabaseAuthJwt(uid2, 'joao@fazendinha.com', 'Joaozinho', 'bento');

  let ws1Welcome = null;
  let ws2Welcome = null;
  let ws1SawPlayer2Join = null;
  let ws2SawPlayer1Moved = null;
  let ws1SawPlayer2Moved = null;
  let ws2SawPlayer1Left = null;

  // 1. Conectar Jogador 1 (Mariazinha)
  const ws1 = new WebSocket('ws://localhost:3000/ws/farm');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout conectando ws1')), 4000);
    ws1.on('open', () => {
      ws1.send(JSON.stringify({
        type: 'join',
        accessToken: token1,
        nickname: 'Mariazinha',
        avatar: 'nina',
        x: 0,
        y: 0,
        z: 0,
        rotation: 0,
      }));
    });

    ws1.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'welcome') {
        ws1Welcome = msg;
        clearTimeout(timeout);
        resolve();
      }
      if (msg.type === 'player_joined') {
        ws1SawPlayer2Join = msg.player;
      }
      if (msg.type === 'player_moved' && msg.id === uid2) {
        ws1SawPlayer2Moved = msg;
      }
    });
  });

  assert.ok(ws1Welcome, 'Jogador 1 deve receber welcome');
  assert.equal(ws1Welcome.playerId, uid1, 'ID do Jogador 1 deve ser seu auth.uid() oficial');

  // 2. Conectar Jogador 2 (Joaozinho)
  const ws2 = new WebSocket('ws://localhost:3000/ws/farm');
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout conectando ws2')), 4000);
    ws2.on('open', () => {
      ws2.send(JSON.stringify({
        type: 'join',
        accessToken: token2,
        nickname: 'Joaozinho',
        avatar: 'bento',
        x: 10,
        y: 0,
        z: 5,
        rotation: Math.PI / 2,
      }));
    });

    ws2.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'welcome') {
        ws2Welcome = msg;
        clearTimeout(timeout);
        resolve();
      }
      if (msg.type === 'player_moved' && msg.id === uid1) {
        ws2SawPlayer1Moved = msg;
      }
      if (msg.type === 'player_left' && msg.id === uid1) {
        ws2SawPlayer1Left = msg;
      }
    });
  });

  assert.ok(ws2Welcome, 'Jogador 2 deve receber welcome');
  assert.equal(ws2Welcome.playerId, uid2, 'ID do Jogador 2 deve ser seu auth.uid() oficial');

  // Aguardar sincronização de entrada
  await new Promise((r) => setTimeout(r, 120));
  assert.ok(ws1SawPlayer2Join, 'Jogador 1 deve receber notificação de entrada do Jogador 2');
  assert.equal(ws1SawPlayer2Join.id, uid2);
  assert.equal(ws1SawPlayer2Join.nickname, 'Joaozinho');

  // 3. Jogador 1 se movimenta no mundo
  ws1.send(JSON.stringify({
    type: 'move',
    x: 15.5,
    y: 0,
    z: -8.2,
    rotation: 1.57,
    isMoving: true,
  }));

  await new Promise((r) => setTimeout(r, 120));
  assert.ok(ws2SawPlayer1Moved, 'Jogador 2 deve receber atualização de movimento do Jogador 1');
  assert.equal(ws2SawPlayer1Moved.id, uid1);
  assert.equal(ws2SawPlayer1Moved.x, 15.5);
  assert.equal(ws2SawPlayer1Moved.z, -8.2);

  // 4. Jogador 2 se movimenta no mundo
  ws2.send(JSON.stringify({
    type: 'move',
    x: -12.0,
    y: 0,
    z: 22.4,
    rotation: 3.14,
    isMoving: false,
  }));

  await new Promise((r) => setTimeout(r, 120));
  assert.ok(ws1SawPlayer2Moved, 'Jogador 1 deve receber atualização de movimento do Jogador 2');
  assert.equal(ws1SawPlayer2Moved.id, uid2);
  assert.equal(ws1SawPlayer2Moved.x, -12.0);
  assert.equal(ws1SawPlayer2Moved.z, 22.4);

  // 5. Tentativa de forjar identidade (Jogador 1 tenta mover o Jogador 2)
  let spoofedReceived = false;
  const spoofHandler = (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'player_moved' && msg.id === uid2 && msg.x === 999) {
      spoofedReceived = true;
    }
  };
  ws2.on('message', spoofHandler);

  ws1.send(JSON.stringify({
    type: 'move',
    id: uid2, // Tentativa de personificar Jogador 2
    x: 999,
    y: 0,
    z: 999,
  }));

  await new Promise((r) => setTimeout(r, 120));
  assert.equal(spoofedReceived, false, 'Servidor deve ignorar spoofing de ID de outro jogador');

  // 6. Desconexão do Jogador 1
  ws1.close();
  await new Promise((r) => setTimeout(r, 150));
  assert.ok(ws2SawPlayer1Left, 'Jogador 2 deve ser notificado que o Jogador 1 saiu do mundo');
  assert.equal(ws2SawPlayer1Left.id, uid1);

  ws2.close();
  await new Promise((r) => setTimeout(r, 50));
});
