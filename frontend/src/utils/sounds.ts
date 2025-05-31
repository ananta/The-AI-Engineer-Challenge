// Sound effect URLs (using free sounds from mixkit.co)
const SOUNDS = {
  click: '/sounds/click.wav',
  send: '/sounds/send.wav',
  receive: '/sounds/receive.wav',
};

class SoundManager {
  private static instance: SoundManager;
  private sounds: { [key: string]: HTMLAudioElement } = {};
  private initialized = false;

  private constructor() {}

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      for (const [key, url] of Object.entries(SOUNDS)) {
        const audio = new Audio(url);
        audio.volume = 0.5;
        this.sounds[key] = audio;
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize sounds:', error);
    }
  }

  play(soundName: keyof typeof SOUNDS) {
    try {
      const sound = this.sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.play().catch(console.error);
      }
    } catch (error) {
      console.error('Failed to play sound:', error);
    }
  }
}

export const soundManager = SoundManager.getInstance(); 