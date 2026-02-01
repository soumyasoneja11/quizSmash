/**
 * Audio Management System for QuizSmash
 * Handles all game sounds and audio feedback
 */

export type SoundType = 'correct' | 'incorrect' | 'timer-warn' | 'timer-end' | 'join' | 'victory' | 'round-start';

interface AudioConfig {
  volume: number;
  enabled: boolean;
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private config: AudioConfig = {
    volume: 0.7,
    enabled: true,
  };

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  /**
   * Generate a simple beep/tone using Web Audio API
   */
  private generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.config.enabled) {
        resolve();
        return;
      }

      try {
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.config.volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);

        setTimeout(resolve, duration * 1000);
      } catch (e) {
        console.warn('Error generating tone:', e);
        resolve();
      }
    });
  }

  /**
   * Play a correct answer sound (ascending tones)
   */
  async playCorrect(): Promise<void> {
    if (!this.config.enabled) return;
    
    const tones = [
      { freq: 523.25, dur: 0.1 }, // C5
      { freq: 659.25, dur: 0.1 }, // E5
      { freq: 783.99, dur: 0.2 }, // G5
    ];

    for (const tone of tones) {
      await this.generateTone(tone.freq, tone.dur, 'sine');
    }
  }

  /**
   * Play an incorrect answer sound (descending tones)
   */
  async playIncorrect(): Promise<void> {
    if (!this.config.enabled) return;

    const tones = [
      { freq: 349.23, dur: 0.15 }, // F4
      { freq: 293.66, dur: 0.15 }, // D4
      { freq: 246.94, dur: 0.3 },  // B3
    ];

    for (const tone of tones) {
      await this.generateTone(tone.freq, tone.dur, 'sine');
    }
  }

  /**
   * Play timer warning sound (rapid beeps)
   */
  async playTimerWarning(): Promise<void> {
    if (!this.config.enabled) return;

    for (let i = 0; i < 2; i++) {
      await this.generateTone(880, 0.1, 'square');
      await new Promise(r => setTimeout(r, 50));
    }
  }

  /**
   * Play timer end sound (low tone)
   */
  async playTimerEnd(): Promise<void> {
    if (!this.config.enabled) return;
    await this.generateTone(200, 0.3, 'sine');
  }

  /**
   * Play player join sound
   */
  async playJoin(): Promise<void> {
    if (!this.config.enabled) return;
    
    const tones = [
      { freq: 440, dur: 0.1 },
      { freq: 554.37, dur: 0.15 },
    ];

    for (const tone of tones) {
      await this.generateTone(tone.freq, tone.dur, 'sine');
    }
  }

  /**
   * Play victory/celebration sound (triumphant chord)
   */
  async playVictory(): Promise<void> {
    if (!this.config.enabled) return;

    // Play three tones simultaneously by overlapping
    const promises = [
      this.generateTone(523.25, 0.5, 'sine'),  // C5
      this.generateTone(659.25, 0.5, 'sine'),  // E5
      this.generateTone(783.99, 0.5, 'sine'),  // G5
    ];

    await Promise.all(promises);
  }

  /**
   * Play round start fanfare
   */
  async playRoundStart(): Promise<void> {
    if (!this.config.enabled) return;

    const tones = [
      { freq: 440, dur: 0.1 },
      { freq: 554.37, dur: 0.1 },
      { freq: 659.25, dur: 0.2 },
    ];

    for (const tone of tones) {
      await this.generateTone(tone.freq, tone.dur, 'sine');
    }
  }

  /**
   * Play a sound by type
   */
  async playSound(type: SoundType): Promise<void> {
    switch (type) {
      case 'correct':
        await this.playCorrect();
        break;
      case 'incorrect':
        await this.playIncorrect();
        break;
      case 'timer-warn':
        await this.playTimerWarning();
        break;
      case 'timer-end':
        await this.playTimerEnd();
        break;
      case 'join':
        await this.playJoin();
        break;
      case 'victory':
        await this.playVictory();
        break;
      case 'round-start':
        await this.playRoundStart();
        break;
    }
  }

  /**
   * Set master volume (0-1)
   */
  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.config.volume;
  }

  /**
   * Enable/disable all sounds
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

export const audioManager = new AudioManager();
