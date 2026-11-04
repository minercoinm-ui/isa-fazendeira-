/**
 * Sistema Inteligente Oficial de Voz e Reações da ISA
 * Voz de Garotinha: doce, alegre, infantil, espontânea e natural em português brasileiro (pt-BR)
 * 
 * Regras Estritas:
 * - Fala SOMENTE em acontecimentos importantes (boas-vindas, novo nível, grande colheita, novo talhão, meta coletiva).
 * - Intervalo mínimo de 3 minutos entre falas espontâneas.
 * - Não fala a cada plantação/colheita comum nem a cada movimento/menu.
 * - Suporta mutar áudio enquanto preserva animações e legendas sincronizadas.
 */

import { soundManager } from './soundManager';
import { IsaAnimationState } from '../types/game';

type SubtitleListener = (speech: { text: string; animation: IsaAnimationState } | null) => void;

export type SpeechEventPriority = 'critical' | 'high' | 'normal' | 'idle';

export interface SpeakOptions {
  animation?: IsaAnimationState;
  priority?: SpeechEventPriority;
  bypassCooldown?: boolean;
  onComplete?: () => void;
}

class IsaVoiceManager {
  private isVoiceMuted: boolean = false;
  private isSpeaking: boolean = false;
  private lastSpokenTime: number = 0;
  private lastSpokenText: string = '';
  private subtitleListeners: Set<SubtitleListener> = new Set();
  private activeSubtitleTimeout: number | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  // Intervalo mínimo estrito de 3 minutos (180.000 ms) entre falas espontâneas
  private readonly SPONTANEOUS_COOLDOWN_MS = 180000;
  // Intervalo mínimo de 12 segundos entre falas de eventos para não sobrepor
  private readonly EVENT_MIN_GAP_MS = 12000;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prioriza vozes femininas infantis/doces em pt-BR
    const ptVoices = voices.filter(
      (v) => v.lang.includes('pt-BR') || v.lang.includes('pt_BR') || v.lang.startsWith('pt')
    );
    const preferred =
      ptVoices.find((v) => /Google.*português/i.test(v.name) || /Luciana/i.test(v.name) || /Letícia/i.test(v.name) || /Francisca/i.test(v.name) || /female/i.test(v.name)) ||
      ptVoices[0] ||
      null;
    this.selectedVoice = preferred;
  }

  public setVoiceMuted(muted: boolean) {
    this.isVoiceMuted = muted;
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  public getVoiceMuted(): boolean {
    return this.isVoiceMuted;
  }

  public subscribeSubtitles(listener: SubtitleListener): () => void {
    this.subtitleListeners.add(listener);
    return () => {
      this.subtitleListeners.delete(listener);
    };
  }

  private notifySubtitles(data: { text: string; animation: IsaAnimationState } | null) {
    for (const listener of this.subtitleListeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Subtitle listener error:', err);
      }
    }
  }

  public clear(): void {
    if (this.activeSubtitleTimeout) {
      clearTimeout(this.activeSubtitleTimeout);
      this.activeSubtitleTimeout = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeaking = false;
    this.notifySubtitles(null);
  }

  /**
   * Dispara fala oficial e animação sincronizada da Isa
   */
  public speak(
    text: string,
    animation: IsaAnimationState = 'cheering',
    options?: SpeakOptions
  ) {
    if (!text || text.trim().length === 0) return;

    const now = Date.now();
    const priority = options?.priority || 'normal';

    // Regra 1: Evitar repetições imediatas da mesma frase
    if (text === this.lastSpokenText && now - this.lastSpokenTime < 30000) {
      return;
    }

    // Regra 2: Cooldown de 3 minutos para falas de prioridade baixa/espontâneas
    if (priority === 'idle' && !options?.bypassCooldown) {
      if (now - this.lastSpokenTime < this.SPONTANEOUS_COOLDOWN_MS) {
        return;
      }
    } else {
      // Para outros eventos, respeita folga de 12 segundos para não atropelar falas
      if (!options?.bypassCooldown && now - this.lastSpokenTime < this.EVENT_MIN_GAP_MS) {
        return;
      }
    }

    this.lastSpokenTime = now;
    this.lastSpokenText = text;
    this.isSpeaking = true;

    // 1. SEMPRE exibe a legenda na tela e ativa a animação 3D da ISA (mesmo com som desligado)
    this.notifySubtitles({ text, animation });

    // 2. Chime suave do sininho
    if (!this.isVoiceMuted) {
      soundManager.playIsaHello();
    }

    // 3. Execução da síntese vocal se o áudio NÃO estiver mutado
    const durationEstimateMs = Math.max(3000, text.length * 75);

    if (
      !this.isVoiceMuted &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window
    ) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        if (this.selectedVoice) {
          utterance.voice = this.selectedVoice;
        }
        // Voz de Garotinha: tom alto e doce (pitch 1.5), ritmo levemente animado (rate 1.05)
        utterance.pitch = 1.5;
        utterance.rate = 1.05;
        utterance.volume = 0.95;

        utterance.onend = () => {
          this.finishSpeech(options?.onComplete);
        };
        utterance.onerror = () => {
          this.finishSpeech(options?.onComplete);
        };

        window.speechSynthesis.speak(utterance);

        // Fallback de segurança se o TTS do navegador congelar
        if (this.activeSubtitleTimeout) clearTimeout(this.activeSubtitleTimeout);
        this.activeSubtitleTimeout = window.setTimeout(() => {
          this.finishSpeech(options?.onComplete);
        }, durationEstimateMs + 1000);

        return;
      } catch (e) {
        console.warn('TTS fallback:', e);
      }
    }

    // Temporizador de exibição da legenda quando áudio está mutado ou sem TTS
    if (this.activeSubtitleTimeout) clearTimeout(this.activeSubtitleTimeout);
    this.activeSubtitleTimeout = window.setTimeout(() => {
      this.finishSpeech(options?.onComplete);
    }, durationEstimateMs);
  }

  private finishSpeech(onComplete?: () => void) {
    if (this.activeSubtitleTimeout) {
      clearTimeout(this.activeSubtitleTimeout);
      this.activeSubtitleTimeout = null;
    }
    this.notifySubtitles(null);
    this.isSpeaking = false;
    onComplete?.();
  }

  // --- MÉTODOS OFICIAIS DE EVENTOS IMPORTANTES ---

  /** Quando um jogador entra pela primeira vez */
  public onPlayerWelcome(nickname: string) {
    this.speak(
      `Obaaa! Seja bem-vindo à nossa fazendinha, ${nickname}!`,
      'waving',
      { priority: 'critical', bypassCooldown: true }
    );
  }

  /** Quando uma missão for concluída */
  public onMissionCompleted() {
    this.speak(
      'Conseguimos! Muito bem!',
      'clapping',
      { priority: 'high', bypassCooldown: true }
    );
  }

  /** Quando conquistar um novo nível */
  public onLevelUp() {
    this.speak(
      'Uhuuul! Estamos crescendo!',
      'cheering',
      { priority: 'critical', bypassCooldown: true }
    );
  }

  /** Quando realizar uma grande colheita de milho/grãos */
  public onGreatHarvest() {
    this.speak(
      'Glória a Deus! Que colheita linda!',
      'jumping',
      { priority: 'high' }
    );
  }

  /** Quando o jogador comprar seu primeiro talhão */
  public onFirstLandPurchased() {
    this.speak(
      'Que legal! Agora você tem sua própria plantação!',
      'clapping',
      { priority: 'critical', bypassCooldown: true }
    );
  }

  /** Quando a meta coletiva for atingida */
  public onCommunityGoalReached() {
    this.speak(
      'Glória a Deus! Nossa fazenda está linda demais!',
      'dancing',
      { priority: 'critical', bypassCooldown: true }
    );
  }
}

export const isaVoiceManager = new IsaVoiceManager();
