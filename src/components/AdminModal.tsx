import React, { useState } from 'react';
import { isaVoiceManager } from '../audio/isaVoiceManager';
import { soundManager } from '../audio/soundManager';
import confetti from 'canvas-confetti';
import { FarmLand, MarketListing } from '../types/game';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwnerRole: boolean;
  onTriggerRain: () => void;
  onInstantGrow: () => void;
  onAddCoins: (amount: number) => void;
  onResetGoal: () => void;
  playersCount: number;
  onlinePlayerNames: string[];
  lands: FarmLand[];
  marketListings: MarketListing[];
  onRefreshData?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isOwnerRole,
  onTriggerRain,
  onInstantGrow,
  onAddCoins,
  onResetGoal,
  playersCount,
  onlinePlayerNames,
  lands,
  marketListings,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'farm' | 'market' | 'lands' | 'events'>('overview');
  const [statusMsg, setStatusMsg] = useState('');

  const isAuthorized = isOwnerRole;


  if (!isOpen) return null;

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const sendAdminAction = async (action: string, data?: any) => {
    soundManager.playPop();
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      });
      const resData = await res.json();
      if (res.ok) {
        showStatus('Ação administrativa executada no servidor!');
        onRefreshData?.();
      } else {
        showStatus(`Erro: ${resData.error || 'Não autorizado'}`);
      }
    } catch {
      showStatus('Não foi possível confirmar a ação no servidor.');
    }
  };

  const handleParty = () => {
    soundManager.playLevelUp();
    isaVoiceManager.speak('Glória a Deus! Olha que festa linda na nossa fazendinha!', 'cheering');
    try {
      confetti({
        particleCount: 200,
        spread: 120,
        origin: { y: 0.4 },
      });
    } catch {
      // ignore
    }
  };

  const handleKickPlayer = async (name: string) => {
    if (!confirm(`Deseja moderar e desconectar o jogador "${name}"?`)) return;
    try {
      const response = await fetch('/api/admin/block-player', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: name }),
      });
      if (response.ok) showStatus(`Jogador "${name}" desconectado.`);
      else showStatus('Não foi possível confirmar a moderação no servidor.');
    } catch {
      showStatus('Não foi possível conectar ao servidor de moderação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 pointer-events-auto font-['Nunito',sans-serif]">
      <div className="bg-white border-4 border-purple-500 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 bg-purple-100 hover:bg-purple-200 text-purple-900 font-black rounded-full w-9 h-9 flex items-center justify-center border-2 border-purple-400 cursor-pointer"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-purple-200 mb-3">
          <span className="text-3xl">👑</span>
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-purple-950 flex items-center gap-2">
              Painel Oficial da Proprietária ISA
            </h3>
            <p className="text-xs text-purple-700 font-bold">
              Controle total da fazenda, jogadores, mercado, terras e eventos especiais
            </p>
          </div>
        </div>

        {/* Notification Toast */}
        {statusMsg && (
          <div className="bg-purple-100 border border-purple-400 text-purple-950 font-black text-xs px-3 py-1.5 rounded-xl mb-3 text-center animate-pulse">
            {statusMsg}
          </div>
        )}

        {/* Auth Gate */}
        {!isAuthorized ? (
          <div className="my-auto flex flex-col gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-xs font-bold text-purple-900">
              Esta área é restrita. Faça login como proprietária para continuar.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 mb-3 border-b border-purple-200 pb-2">
              {[
                { id: 'overview', label: '👥 Jogadores', icon: '👥' },
                { id: 'farm', label: '🌾 Fazenda & Clima', icon: '🌾' },
                { id: 'market', label: '🏪 Mercado', icon: '🏪' },
                { id: 'lands', label: '🗺️ Terrenos', icon: '🗺️' },
                { id: 'events', label: '🎉 Eventos & Falas', icon: '📣' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundManager.playPop();
                    setActiveTab(tab.id as any);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer transition flex items-center gap-1 ${
                    activeTab === tab.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {/* TAB 1: OVERVIEW & JOGADORES */}
              {activeTab === 'overview' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center">
                      <span className="text-[10px] text-purple-700 font-bold block">ONLINE AGORA</span>
                      <span className="text-xl font-black text-purple-950">{playersCount}</span>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center">
                      <span className="text-[10px] text-purple-700 font-bold block">ANÚNCIOS ATIVOS</span>
                      <span className="text-xl font-black text-purple-950">{marketListings.length}</span>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-center">
                      <span className="text-[10px] text-purple-700 font-bold block">TERRENOS TOTAL</span>
                      <span className="text-xl font-black text-purple-950">{lands.length}</span>
                    </div>
                  </div>

                  <div className="bg-purple-50/70 p-3 rounded-2xl border border-purple-200">
                    <h5 className="text-xs font-black text-purple-950 mb-2">
                      Fazendeiros Conectados na Sala:
                    </h5>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-purple-100 text-xs font-bold text-purple-900">
                        <span className="flex items-center gap-1.5">
                          <span className="text-base">👑</span>
                          <span>Isa (Proprietária da Fazenda)</span>
                        </span>
                        <span className="bg-pink-100 text-pink-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                          Anfitriã
                        </span>
                      </div>

                      {onlinePlayerNames.length === 0 ? (
                        <p className="text-xs text-purple-700 py-2 text-center">
                          Apenas você está nesta sala no momento. Abra outra aba para conectar visitantes!
                        </p>
                      ) : (
                        onlinePlayerNames.map((name, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 bg-white rounded-xl border border-purple-100 text-xs font-bold text-purple-900"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-base">👤</span>
                              <span>{name}</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-black">
                                Online
                              </span>
                              <button
                                onClick={() => handleKickPlayer(name)}
                                className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 font-black px-2 py-0.5 rounded cursor-pointer"
                              >
                                Desconectar
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FARM & WEATHER */}
              {activeTab === 'farm' && (
                <div className="space-y-2.5">
                  <p className="text-xs text-purple-800 font-bold">
                    Comandos mágicos globais na fazenda da Isa:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        onTriggerRain();
                        sendAdminAction('rain');
                        isaVoiceManager.speak('Que bênção! Uma chuva mágica refrescante está molhando toda a plantação!', 'jumping');
                      }}
                      className="p-3 bg-sky-100 hover:bg-sky-200 border-2 border-sky-400 rounded-2xl text-left font-bold text-xs text-sky-950 transition cursor-pointer"
                    >
                      <span className="text-2xl block mb-1">🌧️</span>
                      Chuva Mágica Geral
                      <span className="block text-[10px] text-sky-700 font-normal">Regar todas as plantas instantaneamente</span>
                    </button>

                    <button
                      onClick={() => {
                        onInstantGrow();
                        sendAdminAction('instant_grow');
                        isaVoiceManager.speak('Olha como tudo cresceu rápido! As espigas de milho estão no ponto de colheita!', 'cheering');
                      }}
                      className="p-3 bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 rounded-2xl text-left font-bold text-xs text-amber-950 transition cursor-pointer"
                    >
                      <span className="text-2xl block mb-1">⚡</span>
                      Crescimento Acelerado
                      <span className="block text-[10px] text-amber-700 font-normal">Amadurecer todos os talhões de plantio</span>
                    </button>

                    <button
                      onClick={() => onAddCoins(250)}
                      className="p-3 bg-emerald-100 hover:bg-emerald-200 border-2 border-emerald-400 rounded-2xl text-left font-bold text-xs text-emerald-950 transition cursor-pointer"
                    >
                      <span className="text-2xl block mb-1">🪙</span>
                      +250 Moedas Bônus
                      <span className="block text-[10px] text-emerald-700 font-normal">Adicionar moedas para compras</span>
                    </button>

                    <button
                      onClick={handleParty}
                      className="p-3 bg-pink-100 hover:bg-pink-200 border-2 border-pink-400 rounded-2xl text-left font-bold text-xs text-pink-950 transition cursor-pointer"
                    >
                      <span className="text-2xl block mb-1">🎉</span>
                      Festa na Roça
                      <span className="block text-[10px] text-pink-700 font-normal">Lançar confetes e celebração festiva</span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      onResetGoal();
                      sendAdminAction('reset_goal');
                    }}
                    className="w-full mt-1 py-2 text-xs font-black text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl cursor-pointer transition"
                  >
                    🔄 Reiniciar Meta Coletiva de Milho (zerar para novos testes)
                  </button>
                </div>
              )}

              {/* TAB 3: MERCADO & VENDAS */}
              {activeTab === 'market' && (
                <div className="space-y-3">
                  <p className="text-xs text-purple-800 font-bold">
                    Supervisão de ofertas ativas no Mercado da Fazendinha:
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {marketListings.length === 0 ? (
                      <div className="p-6 text-center text-xs text-purple-700 font-bold bg-purple-50 rounded-2xl">
                        Nenhum anúncio listado no momento. Os jogadores podem criar anúncios no balcão do Seu Zé!
                      </div>
                    ) : (
                      marketListings.map((listing) => (
                        <div
                          key={listing.id}
                          className="flex items-center justify-between p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-xs font-bold text-purple-900"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{listing.icon}</span>
                            <div>
                              <span className="font-black block">{listing.productName}</span>
                              <span className="text-[10px] text-purple-700">
                                Vendedor: {listing.sellerName} · Qtd: {listing.quantity}
                              </span>
                            </div>
                          </div>
                          <span className="bg-amber-200 text-amber-950 px-2 py-0.5 rounded-lg font-black text-xs">
                            {listing.pricePerUnit} 🪙 /un
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: TERRENOS & TALHÕES */}
              {activeTab === 'lands' && (
                <div className="space-y-3">
                  <p className="text-xs text-purple-800 font-bold">
                    Administração e configuração de preços dos Talhões Agrícolas:
                  </p>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {lands.map((land) => (
                      <div
                        key={land.id}
                        className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-purple-950">{land.code || 'TALHÃO'}</span>
                            <span className="text-purple-800 font-bold">• {land.name}</span>
                          </div>
                          <span className="text-[10px] text-purple-700 block mt-0.5">
                            {land.categoryLabel} • {land.areaM2} m² • {land.status === 'owned' ? `Dono: ${land.ownerName}` : 'Disponível'}
                          </span>
                        </div>

                        {/* Configurar Preço do Talhão */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <label className="text-[10px] font-black text-purple-900">Preço:</label>
                          <input
                            type="number"
                            defaultValue={land.price}
                            id={`price-input-${land.id}`}
                            className="w-20 bg-white border border-purple-300 rounded-lg px-2 py-0.5 text-xs font-black text-purple-950"
                          />
                          <button
                            onClick={() => {
                              const input = document.getElementById(`price-input-${land.id}`) as HTMLInputElement;
                              const newPrice = Number(input?.value);
                              if (newPrice > 0) {
                                sendAdminAction('update_land_price', { landId: land.id, price: newPrice });
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] px-2.5 py-1 rounded-lg cursor-pointer transition"
                          >
                            Salvar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (confirm('Deseja resetar a posse de todos os talhões para ficarem disponíveis novamente?')) {
                        sendAdminAction('reset_lands');
                      }
                    }}
                    className="w-full py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-black text-xs rounded-xl cursor-pointer transition"
                  >
                    🔄 Liberar Todos os Talhões para Venda Novamente
                  </button>
                </div>
              )}

              {/* TAB 5: EVENTOS & FALAS DA ISA */}
              {activeTab === 'events' && (
                <div className="space-y-3">
                  <p className="text-xs text-purple-800 font-bold">
                    Faça a ISA falar ou comemorar imediatamente com voz e animação sincronizadas:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        isaVoiceManager.speak('Obaaa! Temos visita! Seja muito bem-vindo à Fazendinha da Isa!', 'waving');
                        showStatus('Isa cumprimentou com voz alegre!');
                      }}
                      className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-left text-xs font-bold text-pink-950 cursor-pointer"
                    >
                      <span className="text-lg block mb-0.5">👋 Boas-Vindas</span>
                      &quot;Obaaa! Temos visita!&quot;
                    </button>

                    <button
                      onClick={() => {
                        isaVoiceManager.speak('Uhuuul! Parabéns! Você está ficando um grande fazendeiro!', 'cheering');
                        showStatus('Isa comemorou conquista!');
                      }}
                      className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-left text-xs font-bold text-pink-950 cursor-pointer"
                    >
                      <span className="text-lg block mb-0.5">🎉 Subiu de Nível</span>
                      &quot;Uhuuul! Parabéns!&quot;
                    </button>

                    <button
                      onClick={() => {
                        isaVoiceManager.speak('Olha só quanta coisa bonita! Glória a Deus! Nossa fazenda está prosperando!', 'jumping');
                        showStatus('Isa pulou de alegria!');
                      }}
                      className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-left text-xs font-bold text-pink-950 cursor-pointer"
                    >
                      <span className="text-lg block mb-0.5">🦘 Grande Colheita</span>
                      &quot;Olha só quanta coisa bonita!&quot;
                    </button>

                    <button
                      onClick={() => {
                        isaVoiceManager.speak('Que alegria! Nossa família de fazendeiros está crescendo!', 'clapping');
                        showStatus('Isa bateu palmas para terreno!');
                      }}
                      className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-left text-xs font-bold text-pink-950 cursor-pointer"
                    >
                      <span className="text-lg block mb-0.5">👏 Novo Terreno</span>
                      &quot;Que alegria! Nossa família...&quot;
                    </button>

                    <button
                      onClick={() => {
                        isaVoiceManager.speak('Conseguimos! Glória a Deus! Quando trabalhamos juntos, nossa fazenda fica ainda mais bonita!', 'dancing');
                        showStatus('Isa dançou comemorando!');
                      }}
                      className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-left text-xs font-bold text-pink-950 cursor-pointer"
                    >
                      <span className="text-lg block mb-0.5">💃 Meta Coletiva</span>
                      &quot;Conseguimos! Glória a Deus!&quot;
                    </button>

                    <button
                      onClick={() => {
                        isaVoiceManager.speak('Vamos lá? Ainda temos muito trabalho pela frente!', 'idle');
                        showStatus('Isa incentivou o trabalho!');
                      }}
                      className="p-2.5 bg-pink-50 hover:bg-pink-100 border border-pink-300 rounded-xl text-left text-xs font-bold text-pink-950 cursor-pointer"
                    >
                      <span className="text-lg block mb-0.5">🌻 Incentivar Trabalho</span>
                      &quot;Vamos lá? Ainda temos...&quot;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
