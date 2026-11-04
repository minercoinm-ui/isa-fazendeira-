import React, { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AVATAR_CATALOG } from '../types/game';
import { getSupabaseAuthRedirectUrl, isSupabaseConfigured, supabase } from '../services/supabase';

interface SupabaseAccountAccessProps {
  nickname: string;
  avatarId: string;
  onAuthenticated: (identity: { id: string; nickname: string; avatar: string }) => void | Promise<void>;
}

function sanitizeNickname(value: string) {
  return value.replace(/[^\p{L}\s]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 18);
}

function formatAuthError(error: unknown): string {
  const authError = error && typeof error === 'object' ? (error as { code?: string; status?: number; message?: string }) : {};
  if (authError.code === 'email_not_confirmed') return 'Por favor, confirme seu e-mail pelo link que enviamos antes de entrar.';
  if (authError.code === 'weak_password') return 'A senha deve ter pelo menos 6 caracteres.';
  if (authError.status === 429 || authError.code?.includes('rate_limit')) return 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.';
  if (
    authError.code === 'invalid_credentials' ||
    authError.message?.toLowerCase().includes('invalid login credentials')
  ) {
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.';
  }
  if (authError.code === 'user_already_exists' || authError.code === 'email_exists') {
    return 'Já existe uma conta com este e-mail. Faça login ou recupere sua senha.';
  }
  return 'Não foi possível concluir a autenticação. Verifique seus dados e tente novamente.';
}

function isKnownAvatar(value: unknown): value is string {
  return typeof value === 'string' && AVATAR_CATALOG.some((avatar) => avatar.id === value);
}

export const SupabaseAccountAccess: React.FC<SupabaseAccountAccessProps> = ({
  nickname,
  avatarId,
  onAuthenticated,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const authClient = supabase;
    if (!authClient) {
      setIsCheckingSession(false);
      return;
    }

    let active = true;
    const applySession = (nextSession: Session | null) => {
      if (active) setSession(nextSession);
    };

    const {
      data: { subscription },
    } = authClient.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    const restoreSession = async () => {
      try {
        const callbackUrl = new URL(window.location.href);
        const code = callbackUrl.searchParams.get('code');
        if (callbackUrl.pathname === '/auth/callback' && code) {
          const { data, error } = await authClient.auth.exchangeCodeForSession(code);
          callbackUrl.searchParams.delete('code');
          window.history.replaceState({}, document.title, `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`);
          if (!active) return;
          if (error) {
            setErrorMessage(formatAuthError(error));
            setIsCheckingSession(false);
            return;
          }
          if (data.session) {
            applySession(data.session);
            setStatusMessage('E-mail confirmado com sucesso! Você já pode entrar na fazendinha.');
          }
        }

        const { data, error } = await authClient.auth.getSession();
        if (!active) return;
        if (error) {
          console.warn('Falha ao restaurar sessão:', error.message);
        }
        applySession(data.session);
        setIsCheckingSession(false);
      } catch (err) {
        if (!active) return;
        console.warn('Erro na restauração de sessão:', err);
        setIsCheckingSession(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const finishAuthentication = async (authenticatedSession: Session, fallbackNickname: string, fallbackAvatar: string) => {
    if (!supabase) return;
    const metadata = authenticatedSession.user.user_metadata ?? {};
    const storedNickname = typeof metadata.nickname === 'string' ? sanitizeNickname(metadata.nickname) : '';
    const finalNickname = storedNickname || sanitizeNickname(fallbackNickname) || 'Fazendeiro';
    const storedAvatar = isKnownAvatar(metadata.avatar_id) ? metadata.avatar_id : null;
    const finalAvatar = storedAvatar || (isKnownAvatar(fallbackAvatar) ? fallbackAvatar : AVATAR_CATALOG[0].id);

    if (metadata.nickname !== finalNickname || metadata.avatar_id !== finalAvatar) {
      try {
        await supabase.auth.updateUser({ data: { nickname: finalNickname, avatar_id: finalAvatar } });
      } catch (e) {
        console.warn('Erro ao atualizar metadata do usuário:', e);
      }
    }

    setSession(authenticatedSession);
    setErrorMessage('');
    try {
      await onAuthenticated({ id: authenticatedSession.user.id, nickname: finalNickname, avatar: finalAvatar });
    } catch (err) {
      console.error('Erro ao carregar dados pós-autenticação:', err);
      setErrorMessage('Conta autenticada, mas houve uma falha ao iniciar o mundo. Tente novamente.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!supabase || !isSupabaseConfigured) {
      setErrorMessage('O serviço de autenticação está indisponível no momento. Tente novamente em instantes.');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const safeNickname = sanitizeNickname(nickname);

    if (!normalizedEmail) {
      setErrorMessage('Informe seu e-mail para continuar.');
      return;
    }

    if (mode === 'forgot_password') {
      setIsSubmitting(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getSupabaseAuthRedirectUrl(),
        });
        if (error) {
          setErrorMessage(formatAuthError(error));
        } else {
          setStatusMessage('Enviamos um link de recuperação para seu e-mail! Verifique sua caixa de entrada.');
        }
      } catch {
        setErrorMessage('Erro de conexão ao solicitar recuperação de senha.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Informe sua senha para continuar.');
      return;
    }

    if (mode === 'signup' && safeNickname.length < 2) {
      setErrorMessage('Escolha um apelido com pelo menos duas letras acima.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getSupabaseAuthRedirectUrl(),
            data: { nickname: safeNickname, avatar_id: avatarId },
          },
        });
        if (error) {
          setErrorMessage(formatAuthError(error));
          return;
        }
        if (data.session) {
          await finishAuthentication(data.session, safeNickname, avatarId);
        } else {
          setStatusMessage('Conta criada com sucesso! Enviamos um link de confirmação para o seu e-mail antes do primeiro acesso.');
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (error) {
        setErrorMessage(formatAuthError(error));
        return;
      }
      if (!data.session) {
        setErrorMessage('A autenticação não retornou uma sessão válida.');
        return;
      }
      await finishAuthentication(data.session, safeNickname, avatarId);
    } catch {
      setErrorMessage('Erro de conexão ao autenticar. Verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!supabase || !session) return;
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setSession(null);
        setErrorMessage('Sua sessão expirou. Faça login novamente para continuar.');
        return;
      }
      await finishAuthentication(data.session, nickname, avatarId);
    } catch {
      setErrorMessage('Não foi possível restaurar sua sessão. Faça login novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setErrorMessage('');
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignora erro de rede no logout
    }
    setSession(null);
    setStatusMessage('Você saiu da sua conta.');
  };

  const sessionNickname = session?.user.user_metadata?.nickname;

  return (
    <section className="mt-4 rounded-3xl border-3 border-amber-300 bg-white/95 p-4 sm:p-5 shadow-lg" aria-label="Acesso de fazendeiro">
      {/* Session Active Card */}
      {session && (
        <div className="mb-4 rounded-2xl border-2 border-emerald-400 bg-emerald-50/90 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-sm font-black text-emerald-950">
              Sessão Ativa: {typeof sessionNickname === 'string' ? sanitizeNickname(sessionNickname) : 'Fazendeiro Autenticado'}
            </p>
          </div>
          <p className="text-xs text-emerald-800 font-bold mb-3">
            Sua conta está conectada e pronta para acessar a fazendinha com persistência na nuvem.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting || isCheckingSession}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 px-4 py-3 text-sm font-black text-white shadow transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              🌾 Entrar na Fazendinha
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSubmitting}
              className="rounded-xl border-2 border-amber-300 bg-white hover:bg-amber-50 px-3 py-2 text-xs font-black text-amber-950 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              Trocar de Conta
            </button>
          </div>
        </div>
      )}

      {/* Auth Tabs */}
      {!session && (
        <>
          <div className="mb-3 flex gap-2" role="group" aria-label="Tipo de acesso">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setStatusMessage('');
              }}
              aria-pressed={mode === 'login'}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-black transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              🔑 Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setStatusMessage('');
              }}
              aria-pressed={mode === 'signup'}
              className={`flex-1 rounded-xl px-3 py-2.5 text-xs font-black transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              🌱 Criar Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot_password');
                setErrorMessage('');
                setStatusMessage('');
              }}
              aria-pressed={mode === 'forgot_password'}
              className={`rounded-xl px-3 py-2.5 text-xs font-black transition cursor-pointer ${
                mode === 'forgot_password'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
              title="Recuperar senha de acesso"
            >
              ❓ Esqueci a Senha
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="farmer-email" className="mb-1 block text-xs font-black text-amber-950">
                E-mail da sua Conta
              </label>
              <input
                id="farmer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                placeholder="seu.email@exemplo.com"
                maxLength={254}
                className="w-full rounded-xl border-2 border-amber-300 bg-amber-50/60 px-3.5 py-2.5 text-sm font-bold text-amber-950 outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            {mode !== 'forgot_password' && (
              <div>
                <label htmlFor="farmer-password" className="mb-1 block text-xs font-black text-amber-950">
                  Senha de Acesso
                </label>
                <input
                  id="farmer-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                  placeholder="Sua senha secreta"
                  minLength={6}
                  maxLength={128}
                  className="w-full rounded-xl border-2 border-amber-300 bg-amber-50/60 px-3.5 py-2.5 text-sm font-bold text-amber-950 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            )}

            {errorMessage && (
              <p className="rounded-xl bg-red-100 border border-red-300 px-3 py-2 text-xs font-bold text-red-900" role="alert">
                ⚠️ {errorMessage}
              </p>
            )}

            {statusMessage && (
              <p className="rounded-xl bg-emerald-100 border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-950" role="status">
                ✅ {statusMessage}
              </p>
            )}

            {isCheckingSession && (
              <p className="text-xs font-bold text-amber-700 text-center py-1">
                Verificando sessão salva...
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isCheckingSession}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 px-4 py-3.5 text-sm font-black text-amber-950 shadow-md transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting
                ? 'Conectando...'
                : mode === 'signup'
                ? 'Cadastrar e Entrar na Fazendinha'
                : mode === 'login'
                ? 'Entrar na Fazendinha'
                : 'Enviar Link de Recuperação'}
            </button>
          </form>
        </>
      )}
    </section>
  );
};
