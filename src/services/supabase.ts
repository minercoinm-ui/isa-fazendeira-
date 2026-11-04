import { createClient, SupabaseClient } from '@supabase/supabase-js';

const publicEnv = import.meta.env as unknown as Record<string, string | undefined>;

function getStoredConfig(key: string): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val && val.trim().length > 0) return val.trim();
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
  return undefined;
}

export const DEFAULT_SUPABASE_PROJECT_ID = 'bwfldkhbcevauosxvmwr';
export const DEFAULT_SUPABASE_URL = `https://${DEFAULT_SUPABASE_PROJECT_ID}.supabase.co`;

export function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  let clean = url.trim().replace(/\/+$/, '');
  clean = clean.replace(/\/rest\/v1\/?$/, '');
  return clean.replace(/\/+$/, '');
}

const activeUrl = sanitizeSupabaseUrl(
  getStoredConfig('fazendinha_supabase_url') ||
  publicEnv.VITE_SUPABASE_URL ||
  publicEnv.NEXT_PUBLIC_SUPABASE_URL ||
  publicEnv.SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
);

const activeAnonKey =
  getStoredConfig('fazendinha_supabase_anon_key') ||
  publicEnv.VITE_SUPABASE_ANON_KEY ||
  publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  publicEnv.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  activeUrl &&
  activeUrl.trim().length > 0 &&
  activeAnonKey &&
  activeAnonKey.trim().length > 20 &&
  !activeAnonKey.includes('MY_') &&
  !activeAnonKey.includes('YOUR_') &&
  activeUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(activeUrl!, activeAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        persistSession: true,
      },
    })
  : null;

export function getSupabaseConfigValues() {
  const customUrl = getStoredConfig('fazendinha_supabase_url');
  const customKey = getStoredConfig('fazendinha_supabase_anon_key');
  return {
    projectId: DEFAULT_SUPABASE_PROJECT_ID,
    url: activeUrl || DEFAULT_SUPABASE_URL,
    anonKey: activeAnonKey || '',
    isCustom: Boolean(customUrl && customKey),
    isConfigured: isSupabaseConfigured,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string) {
  if (typeof window !== 'undefined' && window.localStorage) {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    window.localStorage.setItem('fazendinha_supabase_url', cleanUrl);
    window.localStorage.setItem('fazendinha_supabase_anon_key', cleanKey);
    fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, anonKey: cleanKey }),
    }).catch(() => {});
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }
}

export function clearSupabaseConfig() {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem('fazendinha_supabase_url');
    window.localStorage.removeItem('fazendinha_supabase_anon_key');
    fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: DEFAULT_SUPABASE_URL, anonKey: '' }),
    }).catch(() => {});
    setTimeout(() => {
      window.location.reload();
    }, 150);
  }
}

// Sincronizar credenciais salvas com o servidor ao inicializar
if (typeof window !== 'undefined') {
  const storedKey = getStoredConfig('fazendinha_supabase_anon_key');
  const storedUrl = getStoredConfig('fazendinha_supabase_url') || DEFAULT_SUPABASE_URL;
  if (storedKey && storedKey.length > 20) {
    fetch('/api/supabase/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: storedUrl, anonKey: storedKey }),
    }).catch(() => {});
  }
}

export function getSupabaseAuthRedirectUrl() {
  const redirectUrl = publicEnv.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL;
  return redirectUrl || `${window.location.origin}/auth/callback`;
}

export async function logGameEvent(eventType: string, details: Record<string, any>, nickname?: string) {
  if (!supabase) return;
  try {
    await supabase.from('game_events').insert({
      event_type: eventType,
      details,
      player_nickname: nickname || 'Fazendeiro Visitante',
    });
  } catch (e) {
    console.warn('Supabase event log error:', e);
  }
}
