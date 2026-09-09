/**
 * placeholder 사운드. WebAudio 로 직접 합성한다. (임시 에셋 — 명세 61, 64)
 * Phase 7 에서 public/assets/audio 의 실제 음원으로 교체한다.
 */

/** 배경음 트랙. 장소에 따라 바뀐다. */
export type BgmTrack = 'village' | 'minigame';

export type SfxName =
  | 'step'
  | 'correct'
  | 'wrong'
  | 'coin'
  | 'harvest'
  | 'place'
  | 'door'
  | 'animal'
  | 'levelUp'
  | 'tap';

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

interface ToneOptions {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  glideTo?: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private bgmNextTime = 0;
  private sfxEnabled = true;
  private bgmEnabled = true;
  private track: BgmTrack = 'village';

  /** 사용자 입력 이후에 호출해야 브라우저 정책상 소리가 난다. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.24;
      this.sfxGain.connect(this.ctx.destination);
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.07;
      this.bgmGain.connect(this.ctx.destination);
    } catch (error) {
      console.warn('[audio] 오디오를 켤 수 없습니다.', error);
    }
  }

  setSfxEnabled(on: boolean): void {
    this.sfxEnabled = on;
  }

  setBgmEnabled(on: boolean): void {
    this.bgmEnabled = on;
    if (on) this.startBgm();
    else this.stopBgm();
  }

  private tone({ freq, start, duration, type = 'triangle', gain = 1, glideTo }: ToneOptions): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  play(name: SfxName): void {
    if (!this.sfxEnabled) return;
    this.unlock();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (name) {
      case 'correct':
        // 밝은 3화음 아르페지오
        [72, 76, 79, 84].forEach((note, i) =>
          this.tone({ freq: midiToFreq(note), start: now + i * 0.065, duration: 0.22, gain: 0.7 }),
        );
        break;
      case 'wrong':
        // 부드럽게 내려가는 두 음. 실패음처럼 들리지 않게 한다. (명세 57)
        this.tone({ freq: midiToFreq(69), start: now, duration: 0.18, gain: 0.4, type: 'sine' });
        this.tone({ freq: midiToFreq(66), start: now + 0.11, duration: 0.24, gain: 0.35, type: 'sine' });
        break;
      case 'coin':
        this.tone({ freq: midiToFreq(88), start: now, duration: 0.1, gain: 0.5 });
        this.tone({ freq: midiToFreq(93), start: now + 0.07, duration: 0.16, gain: 0.45 });
        break;
      case 'harvest':
        this.tone({ freq: midiToFreq(74), start: now, duration: 0.14, gain: 0.55 });
        this.tone({ freq: midiToFreq(81), start: now + 0.08, duration: 0.2, gain: 0.5 });
        break;
      case 'place':
        this.tone({ freq: midiToFreq(60), start: now, duration: 0.11, gain: 0.5, type: 'sine' });
        this.tone({ freq: midiToFreq(67), start: now + 0.05, duration: 0.13, gain: 0.35, type: 'sine' });
        break;
      case 'door':
        this.tone({ freq: midiToFreq(55), start: now, duration: 0.3, gain: 0.4, type: 'sine', glideTo: midiToFreq(62) });
        break;
      case 'animal':
        this.tone({ freq: midiToFreq(71), start: now, duration: 0.16, gain: 0.4, type: 'sawtooth', glideTo: midiToFreq(76) });
        break;
      case 'levelUp':
        [67, 72, 76, 79, 84].forEach((note, i) =>
          this.tone({ freq: midiToFreq(note), start: now + i * 0.085, duration: 0.3, gain: 0.6 }),
        );
        break;
      case 'step':
        this.tone({ freq: 140 + Math.random() * 30, start: now, duration: 0.05, gain: 0.18, type: 'sine' });
        break;
      case 'tap':
      default:
        this.tone({ freq: midiToFreq(79), start: now, duration: 0.07, gain: 0.35, type: 'sine' });
        break;
    }
  }

  /* --------------------------------- BGM --------------------------------- */

  /**
   * 배경음 트랙.
   * village: 편안하고 반복해도 지치지 않는 루프
   * minigame: 빠르고 조금 긴장되는 단조 루프 (요청 5)
   */
  private static readonly TRACKS: Record<
    BgmTrack,
    { pattern: number[][]; beat: number; gain: number; wave: OscillatorType }
  > = {
    village: {
      pattern: [
        [60, 64, 67, 72],
        [57, 60, 64, 69],
        [53, 57, 60, 65],
        [55, 59, 62, 67],
      ],
      beat: 0.42,
      gain: 0.07,
      wave: 'triangle',
    },
    minigame: {
      // Am - F - G - Am. 단조라 조금 조급한 느낌이 난다.
      pattern: [
        [57, 60, 64, 60],
        [53, 57, 60, 57],
        [55, 59, 62, 59],
        [57, 64, 60, 64],
      ],
      beat: 0.19,
      gain: 0.075,
      wave: 'sawtooth',
    },
  };

  /** 지금 트랙을 바꾼다. 같은 트랙이면 아무 일도 하지 않는다. */
  setBgmTrack(track: BgmTrack): void {
    if (this.track === track) return;
    this.track = track;
    if (this.bgmTimer !== null) {
      this.stopBgm();
      this.startBgm();
    }
  }

  startBgm(): void {
    if (!this.bgmEnabled) return;
    this.unlock();
    if (!this.ctx || this.bgmTimer !== null) return;
    if (this.bgmGain) this.bgmGain.gain.value = AudioEngine.TRACKS[this.track].gain;
    this.bgmNextTime = this.ctx.currentTime + 0.1;
    this.bgmStep = 0;
    this.bgmTimer = window.setInterval(() => this.scheduleBgm(), 120);
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private scheduleBgm(): void {
    if (!this.ctx || !this.bgmGain) return;
    const { pattern, beat, wave } = AudioEngine.TRACKS[this.track];
    while (this.bgmNextTime < this.ctx.currentTime + 0.6) {
      const chord = pattern[Math.floor(this.bgmStep / 4) % pattern.length];
      const note = chord[this.bgmStep % 4];
      this.bgmNote(midiToFreq(note + 12), this.bgmNextTime, beat * 1.6, 0.5, wave);
      if (this.bgmStep % 4 === 0) {
        this.bgmNote(midiToFreq(chord[0] - 12), this.bgmNextTime, beat * 3.4, 0.42, wave);
      }
      this.bgmNextTime += beat;
      this.bgmStep += 1;
    }
  }

  private bgmNote(
    freq: number,
    start: number,
    duration: number,
    gain: number,
    wave: OscillatorType = 'triangle',
  ): void {
    if (!this.ctx || !this.bgmGain) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + 0.08);
    env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(env);
    env.connect(this.bgmGain);
    osc.start(start);
    osc.stop(start + duration + 0.1);
  }
}

export const audio = new AudioEngine();
