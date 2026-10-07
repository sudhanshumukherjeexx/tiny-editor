import { useCallback, useEffect, useRef } from 'react';

export type KeySound = 'key' | 'enter' | 'space';

/**
 * Tiny synthesised typewriter sounds via Web Audio — no audio files.
 * The AudioContext is created lazily on the first keypress (a user
 * gesture), which satisfies browser autoplay rules.
 */
class TypewriterSynth {
  private ctx: AudioContext | null = null;
  private noise: AudioBuffer | null = null;
  private last = 0;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    const length = Math.floor(this.ctx.sampleRate * 0.08);
    this.noise = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
    return this.ctx;
  }

  play(kind: KeySound) {
    const ctx = this.ensure();
    if (!ctx || !this.noise) return;
    if (ctx.state === 'suspended') void ctx.resume();

    // Avoid a machine-gun effect when keys repeat.
    const now = ctx.currentTime;
    if (now - this.last < 0.035) return;
    this.last = now;

    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.85 + Math.random() * 0.3;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = kind === 'enter' ? 900 : kind === 'space' ? 1400 : 2400 + Math.random() * 600;
    filter.Q.value = 0.9;

    const gain = ctx.createGain();
    const peak = kind === 'enter' ? 0.11 : 0.06;
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === 'enter' ? 0.12 : 0.06));

    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(now);
    src.stop(now + 0.15);

    if (kind === 'enter') {
      // A small, soft carriage-return bell.
      const osc = ctx.createOscillator();
      const bell = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1760;
      bell.gain.setValueAtTime(0.0001, now + 0.05);
      bell.gain.exponentialRampToValueAtTime(0.025, now + 0.06);
      bell.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      osc.connect(bell).connect(ctx.destination);
      osc.start(now + 0.05);
      osc.stop(now + 0.55);
    }
  }

  close() {
    void this.ctx?.close();
    this.ctx = null;
  }
}

export function useTypewriterSound(enabled: boolean) {
  const synth = useRef<TypewriterSynth | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled && synth.current) {
      synth.current.close();
      synth.current = null;
    }
  }, [enabled]);

  return useCallback((event: KeyboardEvent) => {
    if (!enabledRef.current || event.metaKey || event.ctrlKey || event.altKey) return;
    let kind: KeySound | null = null;
    if (event.key === 'Enter') kind = 'enter';
    else if (event.key === ' ') kind = 'space';
    else if (event.key.length === 1 || event.key === 'Backspace') kind = 'key';
    if (!kind) return;
    synth.current ??= new TypewriterSynth();
    synth.current.play(kind);
  }, []);
}
