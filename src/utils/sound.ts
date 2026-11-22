class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private musicEnabled: boolean = true;
  private musicTimer: number | null = null;
  private musicStep: number = 0;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;

  constructor() {
    try {
      const saved = localStorage.getItem('lahori_nashta_muted');
      if (saved === 'true') {
        this.muted = true;
      }
      const savedMusic = localStorage.getItem('lahori_nashta_music');
      if (savedMusic === 'false') {
        this.musicEnabled = false;
      }
    } catch {
      // ignore storage errors
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    try {
      localStorage.setItem('lahori_nashta_muted', String(mute));
    } catch {
      // ignore
    }
    if (mute) {
      this.stopMusic();
    } else if (this.musicEnabled) {
      this.startMusic();
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    try {
      localStorage.setItem('lahori_nashta_music', String(enabled));
    } catch {
      // ignore
    }
    if (enabled && !this.muted) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Warm procedural Androon Lahore morning folk music:
   * - Soft Tanpura Sa-Pa drone (D3 + A3)
   * - Plucked Rabab / Sitar folk melody in Raag Bhairavi / Punjabi Pahadi
   * - Gentle Dholak / Tabla morning groove
   */
  public startMusic(): void {
    if (this.muted || !this.musicEnabled) return;
    if (this.musicTimer !== null) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    try {
      // Start soft tanpura drone
      if (!this.droneGain) {
        const dGain = ctx.createGain();
        dGain.gain.setValueAtTime(0.018, ctx.currentTime);
        dGain.connect(ctx.destination);

        const o1 = ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.setValueAtTime(146.83, ctx.currentTime); // D3 (Sa)
        o1.connect(dGain);
        o1.start();

        const o2 = ctx.createOscillator();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(220.0, ctx.currentTime); // A3 (Pa)
        const o2Gain = ctx.createGain();
        o2Gain.gain.setValueAtTime(0.4, ctx.currentTime);
        o2.connect(o2Gain);
        o2Gain.connect(dGain);
        o2.start();

        this.droneOsc1 = o1;
        this.droneOsc2 = o2;
        this.droneGain = dGain;
      }

      // Punjabi Pahadi morning folk melody (D4=293.66, E4=329.63, F#4=369.99, G4=392, A4=440, B4=493.88, D5=587.33)
      const melody: (number | null)[] = [
        293.66, 369.99, 440.0, null,
        493.88, 440.0, 369.99, 329.63,
        293.66, 329.63, 369.99, 440.0,
        587.33, 493.88, 440.0, null,
        493.88, 587.33, 493.88, 440.0,
        392.0, 369.99, 329.63, null,
        293.66, 369.99, 329.63, 293.66,
        220.0, 293.66, null, null,
      ];

      this.musicTimer = window.setInterval(() => {
        if (this.muted || !this.musicEnabled) return;
        const c = this.ensureContext();
        if (!c || c.state !== 'running') return;

        const step = this.musicStep % melody.length;
        const now = c.currentTime;

        // 1. Rabab / Sitar pluck
        const note = melody[step];
        if (note) {
          this.playRababPluck(c, note, now);
        }

        // 2. Dholak / Tabla 8-beat Keherwa groove (Dha - Ge - Na - Tin - Na - Ka - Dhin - Na)
        const beat = step % 8;
        if (beat === 0 || beat === 3 || beat === 6) {
          this.playTablaBass(c, now, beat === 0 ? 0.05 : 0.032);
        }
        if (beat === 2 || beat === 4 || beat === 7) {
          this.playTablaTap(c, now);
        }

        this.musicStep += 1;
      }, 270);
    } catch {
      // ignore audio failures
    }
  }

  public stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    try {
      if (this.droneOsc1) {
        this.droneOsc1.stop();
        this.droneOsc1.disconnect();
        this.droneOsc1 = null;
      }
      if (this.droneOsc2) {
        this.droneOsc2.stop();
        this.droneOsc2.disconnect();
        this.droneOsc2 = null;
      }
      if (this.droneGain) {
        this.droneGain.disconnect();
        this.droneGain = null;
      }
    } catch {
      // ignore cleanup
    }
  }

  private playRababPluck(ctx: AudioContext, freq: number, now: number): void {
    const osc = ctx.createOscillator();
    const harm = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    harm.type = 'triangle';
    harm.frequency.setValueAtTime(freq * 2, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1950, now);
    filter.frequency.exponentialRampToValueAtTime(520, now + 0.38);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.036, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.48);

    const harmGain = ctx.createGain();
    harmGain.gain.setValueAtTime(0.25, now);

    osc.connect(filter);
    harm.connect(harmGain);
    harmGain.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    harm.start(now);
    osc.stop(now + 0.5);
    harm.stop(now + 0.5);
  }

  private playTablaBass(ctx: AudioContext, now: number, level: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(128, now);
    osc.frequency.exponentialRampToValueAtTime(64, now + 0.14);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  private playTablaTap(ctx: AudioContext, now: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);
    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public unlockAndPlayMusic(): void {
    if (!this.muted && this.musicEnabled) {
      this.startMusic();
    }
  }

  public playTap(): void {
    this.unlockAndPlayMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(760, now + 0.06);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }

  public playDrop(): void {
    this.unlockAndPlayMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(175, now + 0.12);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch {
      // ignore
    }
  }

  public playSizzle(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const bufferSize = Math.floor(ctx.sampleRate * 0.24);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.Q.setValueAtTime(1.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    } catch {
      // ignore
    }
  }

  public playPour(): void {
    this.unlockAndPlayMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(480, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.21);
    } catch {
      // ignore
    }
  }

  public playBubble(): void {
    this.unlockAndPlayMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(590, now + 0.09);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // ignore
    }
  }

  public playBoilAlert(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [0, 0.14].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now + offset);
        gain.gain.setValueAtTime(0.11, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.11);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {
      // ignore
    }
  }

  public playChime(): void {
    this.unlockAndPlayMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.09, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.26);
      });
    } catch {
      // ignore
    }
  }

  public playSuccessFanfare(): void {
    this.unlockAndPlayMusic();
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.1, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.36);
      });
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
