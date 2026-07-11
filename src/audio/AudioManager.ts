import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';
import { getSound } from './sounds';

export type AudioState = {
  /** Id du son actuellement sélectionné (un seul à la fois), ou null. */
  currentSound: string | null;
  isPlaying: boolean;
  timerRemaining: number; // secondes restantes (0 = minuterie off)
  /** Durée choisie pour la minuterie en minutes (0 = off). */
  timerMinutes: number;
  /** Volume maître réglé par le parent (0..1). */
  volume: number;
  /** true quand la session gratuite vient d'expirer -> déclenche le paywall. */
  freeLimitHit: boolean;
};

type Listener = (state: AudioState) => void;

const FADE_MS = 8000; // fondu de sortie (ne réveille pas bébé)
const FADE_STEP_MS = 100;

// Sécurité auditive (AAP : volume bas, appareil à ~2 m du berceau, durée limitée).
export const SAFE_VOLUME_MAX = 0.7;
const DEFAULT_VOLUME = 0.55;

// Levier de conversion : sessions gratuites limitées + arrière-plan réservé au premium.
const FREE_SESSION_SECONDS = 15 * 60;

/**
 * Lecture d'un seul son à la fois (plus simple et intuitif qu'un mixeur).
 *  - Volume unique (maître) avec zone de sécurité auditive.
 *  - Lecture en arrière-plan / écran éteint : RÉSERVÉE AUX PREMIUM. Les
 *    utilisateurs gratuits voient la lecture se mettre en pause quand l'app
 *    passe en fond (ce qui rend la limite de 15 min cohérente et fait de la
 *    lecture "toute la nuit" un vrai avantage payant).
 */
class AudioManagerImpl {
  private sound: Audio.Sound | null = null;
  private currentId: string | null = null;
  private listeners = new Set<Listener>();
  private state: AudioState = {
    currentSound: null,
    isPlaying: false,
    timerRemaining: 0,
    timerMinutes: 0,
    volume: DEFAULT_VOLUME,
    freeLimitHit: false,
  };
  private userVolume = DEFAULT_VOLUME;
  private fadeLevel = 1;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private fadeHandle: ReturnType<typeof setInterval> | null = null;
  private freeSessionHandle: ReturnType<typeof setTimeout> | null = null;
  private premium = false;
  private initialized = false;

  /** Renseigné par l'app : premium = pas de limite + lecture en arrière-plan. */
  setPremium(value: boolean) {
    const changed = this.premium !== value;
    this.premium = value;
    if (value) {
      this.clearFreeSession();
      if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
    }
    if (changed && this.initialized) this.applyAudioMode();
  }

  acknowledgeFreeLimit() {
    if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await this.applyAudioMode();
    AppState.addEventListener('change', this.onAppStateChange);
  }

  private async applyAudioMode() {
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: this.premium, // arrière-plan = premium uniquement
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      });
    } catch (e) {
      console.warn('setAudioModeAsync a échoué', e);
    }
  }

  private onAppStateChange = (next: AppStateStatus) => {
    // Gratuit : pas de lecture en fond -> pause quand on quitte le premier plan.
    if ((next === 'background' || next === 'inactive') && !this.premium && this.state.isPlaying) {
      this.pause();
    }
  };

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  private emit(patch: Partial<AudioState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l(this.state));
  }

  // ---- Sélection du son (un seul à la fois) --------------------------------

  async selectSound(id: string) {
    if (id === this.currentId && this.sound) {
      // Déjà sélectionné : on s'assure que ça joue.
      if (!this.state.isPlaying) await this.play();
      return;
    }
    await this.unloadCurrent();
    const meta = getSound(id);
    if (!meta) return;
    await this.init();
    try {
      const { sound } = await Audio.Sound.createAsync(meta.source, {
        isLooping: true,
        volume: this.gain(),
        shouldPlay: true,
      });
      this.sound = sound;
      this.currentId = id;
      this.emit({ currentSound: id, isPlaying: true });
      this.startFreeSession();
    } catch (e) {
      console.warn('selectSound failed', id, e);
    }
  }

  private async unloadCurrent() {
    if (this.sound) {
      const s = this.sound;
      this.sound = null;
      this.currentId = null;
      await s.stopAsync().catch(() => {});
      await s.unloadAsync().catch(() => {});
    }
  }

  // ---- Lecture -------------------------------------------------------------

  async play() {
    if (!this.sound) return;
    this.setFadeLevel(1);
    await this.sound.playAsync().catch(() => {});
    this.emit({ isPlaying: true });
    this.startFreeSession();
  }

  async pause() {
    this.cleanupTimers();
    this.clearFreeSession();
    if (this.sound) await this.sound.pauseAsync().catch(() => {});
    this.emit({ isPlaying: false });
  }

  async togglePlay() {
    if (this.state.isPlaying) await this.pause();
    else await this.play();
  }

  async stopAll() {
    this.cleanupTimers();
    this.clearFreeSession();
    await this.unloadCurrent();
    this.emit({ currentSound: null, isPlaying: false, timerRemaining: 0 });
  }

  // ---- Minuterie de sommeil ------------------------------------------------

  async setTimer(minutes: number) {
    this.cleanupTimers();
    if (minutes <= 0) {
      this.emit({ timerRemaining: 0, timerMinutes: 0 });
      return;
    }
    if (!this.state.isPlaying) await this.play();
    let remaining = minutes * 60;
    this.emit({ timerRemaining: remaining, timerMinutes: minutes });
    this.timerHandle = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        this.cleanupTimers();
        this.fadeOutAndPause();
      } else {
        this.emit({ timerRemaining: remaining });
      }
    }, 1000);
  }

  private fadeOutAndPause(onDone?: () => void) {
    let level = 1;
    const decrement = FADE_STEP_MS / FADE_MS;
    this.fadeHandle = setInterval(() => {
      level -= decrement;
      if (level <= 0) {
        if (this.fadeHandle) clearInterval(this.fadeHandle);
        this.fadeHandle = null;
        this.pause();
        this.setFadeLevel(1);
        onDone?.();
      } else {
        this.setFadeLevel(level);
      }
    }, FADE_STEP_MS);
  }

  // ---- Session gratuite limitée --------------------------------------------

  private startFreeSession() {
    if (this.premium) return;
    if (this.freeSessionHandle != null) return;
    if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
    this.freeSessionHandle = setTimeout(() => {
      this.freeSessionHandle = null;
      this.fadeOutAndPause(() => this.emit({ freeLimitHit: true }));
    }, FREE_SESSION_SECONDS * 1000);
  }

  private clearFreeSession() {
    if (this.freeSessionHandle != null) {
      clearTimeout(this.freeSessionHandle);
      this.freeSessionHandle = null;
    }
  }

  // ---- Volume maître + sécurité auditive -----------------------------------

  private gain() {
    return this.userVolume * this.fadeLevel;
  }

  setUserVolume(volume: number) {
    this.userVolume = Math.max(0, Math.min(1, volume));
    this.applyGain();
    this.emit({ volume: this.userVolume });
  }

  private setFadeLevel(level: number) {
    this.fadeLevel = Math.max(0, Math.min(1, level));
    this.applyGain();
  }

  private applyGain() {
    this.sound?.setVolumeAsync(this.gain()).catch(() => {});
  }

  private cleanupTimers() {
    if (this.timerHandle) clearInterval(this.timerHandle);
    if (this.fadeHandle) clearInterval(this.fadeHandle);
    this.timerHandle = null;
    this.fadeHandle = null;
    if (this.state.timerRemaining !== 0 || this.state.timerMinutes !== 0) {
      this.emit({ timerRemaining: 0, timerMinutes: 0 });
    }
  }
}

export const AudioManager = new AudioManagerImpl();
