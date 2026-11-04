/**
 * Procedural Web Audio API sound synthesizer
 * Zero external audio files required - authentic, pleasant country & farm audio
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private tempo: number = 110; // BPM

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGain && this.sfxGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.18;
      const targetSfx = this.isMuted ? 0 : 0.35;
      this.musicGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(targetSfx, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Soft Grass Footstep
  public playFootstep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 30, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.09);
  }

  // Plant Seed
  public playPlant() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Water Soil
  public playWater() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Splash bubble
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = i * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(450 + i * 150, t + delay);
      osc.frequency.exponentialRampToValueAtTime(750 + i * 100, t + delay + 0.1);

      gain.gain.setValueAtTime(0.12, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.11);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + delay);
      osc.stop(t + delay + 0.12);
    }
  }

  // Harvest Chime
  public playHarvest() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.38);
    });
  }

  // Golden Coin Clink (Som rico e brilhante de moeda/dinheiro recebido)
  public playCoin() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // Tom fundamental metálico (B5 -> E6)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, t); // B5
    osc1.frequency.setValueAtTime(1318.51, t + 0.075); // E6

    gain1.gain.setValueAtTime(0.32, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.42);

    // Harmônico de sino/brilho cristalino (B6 -> E7)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, t + 0.075); // B6
    osc2.frequency.setValueAtTime(2637.02, t + 0.12); // E7

    gain2.gain.setValueAtTime(0.001, t);
    gain2.gain.setValueAtTime(0.24, t + 0.075);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.075);
    osc2.stop(t + 0.45);

    // Resonância alta cintilante (G7)
    const osc3 = this.ctx.createOscillator();
    const gain3 = this.ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(3135.96, t + 0.075); // G7

    gain3.gain.setValueAtTime(0.001, t);
    gain3.gain.setValueAtTime(0.14, t + 0.075);
    gain3.gain.exponentialRampToValueAtTime(0.0005, t + 0.32);

    osc3.connect(gain3);
    gain3.connect(this.sfxGain);
    osc3.start(t + 0.075);
    osc3.stop(t + 0.35);
  }

  // Cow Moo
  public playCow() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.linearRampToValueAtTime(155, t + 0.2);
    osc.frequency.linearRampToValueAtTime(110, t + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.linearRampToValueAtTime(450, t + 0.2);
    filter.frequency.linearRampToValueAtTime(260, t + 0.6);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.7);
  }

  // Chicken Cluck
  public playChicken() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.1;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, start);
      osc.frequency.exponentialRampToValueAtTime(280, start + 0.07);

      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.08);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.09);
    }
  }

  // Pig Oink
  public playPig() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(130, t + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Level Up / Celebration
  public playLevelUp() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    melody.forEach((note, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.45);
    });
  }

  // Isa Happy Voice / Hello
  public playIsaHello() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Cheerful cute two-tone chirp
    const tones = [587.33, 880]; // D5, A5
    tones.forEach((tone, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.11;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(start);
      osc.stop(start + 0.25);
    });
  }

  // Button Click / Tap
  public playPop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.04);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Cheerful Country Background Music Loop
  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;

    // Simple, sweet pastoral country chord progression in C major
    // C - G - Am - F
    const chords = [
      [261.63, 329.63, 392.0], // C, E, G
      [196.0, 246.94, 293.66], // G, B, D
      [220.0, 261.63, 329.63], // A, C, E
      [174.61, 220.0, 261.63], // F, A, C
    ];

    const melodyNotes = [
      523.25, 659.25, 587.33, 523.25, 392.0, 440.0, 523.25, 587.33,
      659.25, 783.99, 659.25, 587.33, 523.25, 440.0, 392.0, 523.25,
    ];

    let step = 0;
    const beatIntervalMs = (60 / this.tempo) * 500; // eighth notes

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.isMuted) return;

      const t = this.ctx.currentTime;
      const chordIndex = Math.floor(step / 8) % chords.length;
      const currentChord = chords[chordIndex];

      // Bass note on beats 0, 4
      if (step % 4 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(currentChord[0] / 2, t);

        bassGain.gain.setValueAtTime(0.1, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.38);
      }

      // Soft marimba / guitar strum on offbeats
      if (step % 2 === 1) {
        currentChord.forEach((freq, idx) => {
          if (!this.ctx || !this.musicGain) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const offset = idx * 0.02;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + offset);

          gain.gain.setValueAtTime(0.035, t + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.22);

          osc.connect(gain);
          gain.connect(this.musicGain);

          osc.start(t + offset);
          osc.stop(t + offset + 0.25);
        });
      }

      // Gentle melodic chime
      if (step % 2 === 0 && Math.random() > 0.3) {
        const melodyNote = melodyNotes[step % melodyNotes.length];
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();

        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(melodyNote, t);

        melGain.gain.setValueAtTime(0.045, t);
        melGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

        melOsc.connect(melGain);
        melGain.connect(this.musicGain);

        melOsc.start(t);
        melOsc.stop(t + 0.3);
      }

      step++;
    }, beatIntervalMs);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const soundManager = new SoundManager();
