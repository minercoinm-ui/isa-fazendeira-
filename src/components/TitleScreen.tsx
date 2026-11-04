import React, { useState } from 'react';
import bannerImg from '../assets/fazendinha_banner.jpg';
import isaImg from '../assets/isa_portrait.jpg';
import { soundManager } from '../audio/soundManager';
import { AVATAR_CATALOG } from '../types/game';
import { Avatar3DPreview } from './Avatar3DPreview';
import { SupabaseAccountAccess } from './SupabaseAccountAccess';
import { supabase } from '../services/supabase';

interface TitleScreenProps {
  onStartGame: (nickname: string, avatar: string, role?: 'visitor' | 'isa_owner', playerId?: string) => void | Promise<void>;
  playersOnlineCount: number;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStartGame, playersOnlineCount }) => {
  const [nickname, setNickname] = useState('Amiguinho');
  const [selectedAvatar, setSelectedAvatar] = useState('leo');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Isa Owner Secure Authentication
  const [showIsaLogin, setShowIsaLogin] = useState(false);
  const [isaPassword, setIsaPassword] = useState('');
  const [isaLoginError, setIsaLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const selectedDef = AVATAR_CATALOG.find((a) => a.id === selectedAvatar) || AVATAR_CATALOG[0];

  const handleIsaOwnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isaPassword.trim()) {
      setIsaLoginError('Por favor, informe a credencial de acesso.');
      return;
    }
    setIsAuthenticating(true);
    setIsaLoginError('');
    try {
      if (!supabase) {
        setIsaLoginError('O serviço de autenticação está temporariamente indisponível.');
        return;
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setIsaLoginError('Entre primeiro com uma conta cadastrada antes de validar o acesso especial.');
        return;
      }
      const res = await fetch('/api/auth/isa-login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: isaPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        soundManager.playLevelUp();
        soundManager.startMusic();
        await onStartGame('Isa (Proprietária)', 'isa', 'isa_owner', sessionData.session.user.id);
      } else {
        setIsaLoginError('Credencial incorreta.');
      }
    } catch {
      setIsaLoginError('Não foi possível validar o acesso da proprietária. Tente novamente.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="absolute inset-0 z-10 w-full h-full bg-gradient-to-b from-sky-300 via-amber-100 to-emerald-200 flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto font-['Nunito',sans-serif]">
      {/* Decorative Clouds */}
      <div className="absolute top-4 left-6 text-white/70 text-4xl select-none pointer-events-none animate-pulse">☁️</div>
      <div className="absolute top-12 right-12 text-white/80 text-5xl select-none pointer-events-none">☁️</div>
      <div className="absolute bottom-8 left-12 text-yellow-500/80 text-3xl select-none pointer-events-none">🌻</div>
      <div className="absolute bottom-8 right-16 text-yellow-500/80 text-3xl select-none pointer-events-none">🌽</div>

      {/* Top Bar with Online Counter and Help Buttons */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 bg-white/95 px-4 py-1.5 rounded-full shadow-md border-2 border-emerald-400 text-emerald-800 font-bold text-xs sm:text-sm">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>{playersOnlineCount > 0 ? `${playersOnlineCount} Fazendeiros Online` : 'Entre na fazenda para interagir'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundManager.playPop();
              setShowHowToPlay(true);
            }}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-400 font-extrabold px-3 py-1.5 rounded-full text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            ❓ Como Jogar
          </button>
          <button
            onClick={() => {
              soundManager.playPop();
              setShowAbout(true);
            }}
            className="bg-sky-100 hover:bg-sky-200 text-sky-900 border-2 border-sky-400 font-extrabold px-3 py-1.5 rounded-full text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            ℹ️ Sobre a Fazenda
          </button>
        </div>
      </div>

      {/* Main Center Content */}
      <div className="w-full max-w-3xl flex flex-col items-center my-auto z-10 py-2">
        {/* Banner Logo */}
        <div className="relative w-full max-w-sm mb-2 transform hover:scale-[1.01] transition">
          <img
            src={bannerImg}
            alt="Fazendinha da Isa"
            className="w-full h-auto rounded-3xl shadow-xl border-4 border-amber-300 object-cover"
          />
        </div>

        {/* Character Isa Welcome Card */}
        <div className="w-full bg-white/95 border-4 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-xl mb-3">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={isaImg}
                alt="Isa Proprietária"
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-pink-400 shadow-md object-cover"
              />
              <span className="absolute -bottom-1 -right-1 bg-pink-500 text-white text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border-2 border-white shadow">
                ISA ⭐
              </span>
            </div>

            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl sm:text-2xl font-black text-amber-950">
                Oi! Eu sou a Isa! 🌻
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 font-bold mt-1">
                Seja muito bem-vindo à nossa fazendinha! Entre com sua conta ou cadastre-se para plantar, cuidar dos bichinhos e participar da feira!
              </p>
            </div>
          </div>

          <hr className="my-3 border-amber-200" />

          {/* Nickname Input (used on signup or profile display) */}
          <div className="mb-4">
            <label className="block text-xs font-black uppercase tracking-wider text-amber-900 mb-1">
              Seu Apelido de Fazendeiro:
            </label>
            <input
              type="text"
              maxLength={18}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Digite seu nome..."
              className="w-full bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-2 font-bold text-amber-950 focus:outline-none focus:border-amber-500 text-sm shadow-inner"
            />
          </div>

          {/* 12 Avatars Selection + 3D Realtime Interactive Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-amber-900">
                Escolha seu Personagem 3D:
              </label>
              <span className="text-xs font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                {selectedDef.name} — {selectedDef.title}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Left/Center: 12 Avatars Grid */}
              <div className="md:col-span-8 grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                {AVATAR_CATALOG.map((av) => {
                  const isSelected = selectedAvatar === av.id;
                  return (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => {
                        soundManager.playPop();
                        setSelectedAvatar(av.id);
                      }}
                      className={`flex flex-col items-center p-2 rounded-2xl border-2 transition cursor-pointer text-center ${
                        isSelected
                          ? 'bg-amber-300 border-amber-600 shadow-md font-black scale-102'
                          : 'bg-amber-50/70 border-amber-200 hover:border-amber-400 hover:bg-amber-100'
                      }`}
                    >
                      <span className="text-2xl mb-0.5">{av.icon}</span>
                      <span className="text-xs font-bold text-amber-950 truncate w-full">{av.name}</span>
                      <span className="text-[10px] text-amber-700 truncate w-full">{av.title.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right: Live Interactive 3D Avatar Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-amber-200/60 rounded-2xl border-2 border-amber-300 p-2 shadow-inner">
                <Avatar3DPreview avatarId={selectedAvatar} width={180} height={190} />
                <p className="text-[11px] text-center text-amber-900 font-extrabold mt-1">
                  {selectedDef.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Mandatory Secure Authentication (Supabase Auth) */}
          <SupabaseAccountAccess
            nickname={nickname}
            avatarId={selectedAvatar}
            onAuthenticated={async ({ id, nickname: authenticatedNickname, avatar }) => {
              soundManager.playPop();
              soundManager.startMusic();
              await onStartGame(authenticatedNickname, avatar, 'visitor', id);
            }}
          />

          {/* Secure Owner ISA Login Trigger */}
          <div className="pt-3 text-center">
            <button
              type="button"
              onClick={() => {
                soundManager.playPop();
                setShowIsaLogin(true);
                setIsaLoginError('');
                setIsaPassword('');
              }}
              className="text-xs font-black text-pink-800 hover:text-pink-950 bg-pink-100 hover:bg-pink-200 px-3.5 py-1.5 rounded-full border border-pink-300 transition cursor-pointer"
            >
              👑 Acesso Restrito da Proprietária ISA
            </button>
          </div>
        </div>
      </div>

      {/* Control Hint Footer */}
      <div className="z-10 text-center text-xs text-amber-900 font-extrabold bg-amber-200/90 px-4 py-1.5 rounded-full border border-amber-400 shadow-sm mb-1">
        💻 Computador: Teclas WASD ou Setas para andar · Tecla [E] para Ação | 📱 Celular: Joystick virtual na tela
      </div>

      {/* Modal: Como Jogar */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
          <div className="bg-white border-4 border-amber-400 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 bg-amber-100 hover:bg-amber-200 text-amber-900 font-black rounded-full w-8 h-8 flex items-center justify-center border-2 border-amber-400 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl sm:text-2xl font-black text-amber-900 mb-3 flex items-center gap-2">
              <span>🌾</span> Como Jogar na Fazendinha da Isa
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm text-amber-900 max-h-[65vh] overflow-y-auto pr-1">
              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <p className="font-black text-amber-950">1. Central de Talhões & Terras Próprias</p>
                <p>Visite a Central de Talhões no mapa para comprar seu próprio pedaço de terra e plantar de forma independente!</p>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <p className="font-black text-amber-950">2. Culturas & Variedade Agrícola</p>
                <p>Plante milho, soja, feijão, trigo, arroz, tomate, cenoura, morango e abóbora! Cada cultivo tem seu tempo e rendimento.</p>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <p className="font-black text-amber-950">3. Mercado & Compradores da Roça</p>
                <p>Entregue pedidos aos comerciantes (Seu Antônio, Dona Francisca, Tião) ou anuncie para outros jogadores na feira.</p>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                <p className="font-black text-amber-950">4. Animais da Fazenda</p>
                <p>Alimente a vaca Mimosa, recolha ovos frescos com a galinha Pipa e faça carinho no porquinho Baconzinho!</p>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white font-black py-2.5 rounded-xl shadow cursor-pointer"
            >
              Entendido! Vamos lá! 🌻
            </button>
          </div>
        </div>
      )}

      {/* Modal: Sobre a Fazenda */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
          <div className="bg-white border-4 border-sky-400 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 bg-sky-100 hover:bg-sky-200 text-sky-900 font-black rounded-full w-8 h-8 flex items-center justify-center border-2 border-sky-400 cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl sm:text-2xl font-black text-sky-950 mb-3 flex items-center gap-2">
              <span>🏡</span> Sobre a Fazendinha da Isa
            </h3>

            <div className="space-y-3 text-xs sm:text-sm text-sky-900">
              <p>
                <strong>Fazendinha da Isa</strong> é um universo agrícola 3D online multiplayer acolhedor, educativo e cooperativo criado com Three.js e tecnologia web de alto desempenho.
              </p>
              <div className="bg-sky-50 p-3 rounded-xl border border-sky-200 text-xs space-y-1">
                <p className="font-black text-sky-950">🛡️ Proteção de Crianças e LGPD:</p>
                <p>• O e-mail serve exclusivamente para autenticação e não aparece para outros jogadores.</p>
                <p>• Não pedimos telefone nem localização.</p>
                <p>• Comunicação por mensagens predefinidas e amigáveis.</p>
              </div>
            </div>

            <button
              onClick={() => setShowAbout(false)}
              className="w-full mt-4 bg-sky-500 hover:bg-sky-600 text-white font-black py-2.5 rounded-xl shadow cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Login Exclusivo da ISA */}
      {showIsaLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 pointer-events-auto">
          <div className="bg-white border-4 border-pink-400 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowIsaLogin(false)}
              className="absolute top-4 right-4 bg-pink-100 hover:bg-pink-200 text-pink-900 font-black rounded-full w-8 h-8 flex items-center justify-center border-2 border-pink-400 cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center mb-4">
              <span className="text-4xl block mb-1">👑</span>
              <h3 className="text-xl font-black text-pink-950">Acesso Oficial da ISA</h3>
              <p className="text-xs text-pink-800 mt-1">Identificação da proprietária da fazenda no servidor</p>
            </div>
            <form onSubmit={handleIsaOwnerSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-pink-900 mb-1">Credencial de Acesso:</label>
                <input
                  type="password"
                  value={isaPassword}
                  onChange={(e) => setIsaPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-pink-50 border-2 border-pink-300 rounded-xl px-3 py-2 font-bold text-pink-950 focus:outline-none focus:border-pink-500"
                  autoFocus
                  autoComplete="off"
                />
                {isaLoginError && <p className="text-xs text-red-600 font-bold mt-1.5">{isaLoginError}</p>}
              </div>
              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-black py-2.5 rounded-xl shadow cursor-pointer transition disabled:opacity-50"
              >
                {isAuthenticating ? 'Validando...' : 'Entrar como Proprietária ISA ⭐'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
