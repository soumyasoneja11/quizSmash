// src/audio.ts

type SoundType = 
  | 'join' 
  | 'leave' 
  | 'correct' 
  | 'incorrect' 
  | 'timer-warn' 
  | 'timer-end' 
  | 'round-start' 
  | 'victory'
  | 'cyber-beep'
  | 'laser'
  | 'power-up'
  | 'error';

class AudioManager {
  private enabled = true;
  private volume = 0.7;
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private bgm: HTMLAudioElement | null = null;

  constructor() {
    // Preload cyberpunk sound effects
    this.preloadSounds();
  }

  private preloadSounds() {
    const soundSources: Record<SoundType, string> = {
      'join': 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
      'leave': 'https://assets.mixkit.co/sfx/preview/mixkit-retro-game-emergency-alarm-1000.mp3',
      'correct': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
      'incorrect': 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
      'timer-warn': 'https://assets.mixkit.co/sfx/preview/mixkit-sci-fi-alarm-905.mp3',
      'timer-end': 'https://assets.mixkit.co/sfx/preview/mixkit-retro-arcade-game-over-470.mp3',
      'round-start': 'https://assets.mixkit.co/sfx/preview/mixkit-game-show-intro-331.mp3',
      'victory': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-notification-2018.mp3',
      'cyber-beep': 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
      'laser': 'https://assets.mixkit.co/sfx/preview/mixkit-laser-weapon-shot-1671.mp3',
      'power-up': 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.mp3',
      'error': 'https://assets.mixkit.co/sfx/preview/mixkit-warning-alarm-buzzer-958.mp3',
    };

    Object.entries(soundSources).forEach(([type, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      this.sounds.set(type as SoundType, audio);
    });
  }

  async playSound(type: SoundType) {
    if (!this.enabled) return;

    try {
      const sound = this.sounds.get(type);
      if (sound) {
        sound.currentTime = 0;
        sound.volume = this.volume;
        await sound.play();
      }
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  playBGM() {
    if (this.bgm) {
      this.bgm.loop = true;
      this.bgm.volume = this.volume * 0.3;
      this.bgm.play();
    }
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.stopBGM();
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.bgm) {
      this.bgm.volume = this.volume * 0.3;
    }
  }

  getVolume() {
    return this.volume;
  }

  isEnabled() {
    return this.enabled;
  }
}

export const audioManager = new AudioManager();