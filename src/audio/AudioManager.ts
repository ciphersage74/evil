import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
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

// Levier de conversion : 15 min de lecture par session pour les gratuits.
const FREE_SESSION_SECONDS = 15 * 60;

/**
 * Lecture d'un seul son à la fois (plus simple et intuitif qu'un mixeur).
 *  - Volume unique (maître) avec zone de sécurité auditive.
 *  - Lecture en arrière-plan / écran éteint POUR TOUS (gratuit inclus) : le son
 *    continue quand on verrouille le téléphone ou utilise une autre app.
 *  - Gratuit : 15 min de lecture cumulée par session (le compteur tourne aussi
 *    en arrière-plan, la pause ne le réinitialise pas) puis fondu + paywall.
 *    Premium : illimité.
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
  private freeTicker: ReturnType<typeof setInterval> | null = null;
  /** Secondes de lecture cumulées de la session gratuite (pause ≠ reset). */
  private freeElapsed = 0;
  private premium = false;
  private initialized = false;

  /** Renseigné par l'app : premium = pas de limite de durée. */
  setPremium(value: boolean) {
    this.premium = value;
    if (value) {
      this.stopFreeTracking();
      this.freeElapsed = 0;
      if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
    }
  }

  acknowledgeFreeLimit() {
    if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true, // écran éteint / autre app : le son continue
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      });
    } catch (e) {
      console.warn('setAudioModeAsync a échoué', e);
    }
  }

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
    this.stopFreeTracking();
    if (this.sound) await this.sound.pauseAsync().catch(() => {});
    this.emit({ isPlaying: false });
  }

  async togglePlay() {
    if (this.state.isPlaying) await this.pause();
    else await this.play();
  }

  async stopAll() {
    this.cleanupTimers();
    this.stopFreeTracking();
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
  // Compte les secondes réellement jouées (y compris écran éteint / en fond).
  // La pause suspend le compteur sans le réinitialiser. Quand la limite est
  // atteinte : fondu, paywall, et le compteur repart à zéro pour la prochaine
  // session (pas de blocage définitif — frustrer sans punir).

  private startFreeSession() {
    if (this.premium) return;
    if (this.freeTicker != null) return;
    if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
    this.freeTicker = setInterval(() => {
      if (!this.state.isPlaying) return;
      this.freeElapsed += 1;
      if (this.freeElapsed >= FREE_SESSION_SECONDS) {
        this.stopFreeTracking();
        this.freeElapsed = 0;
        this.fadeOutAndPause(() => this.emit({ freeLimitHit: true }));
      }
    }, 1000);
  }

  private stopFreeTracking() {
    if (this.freeTicker != null) {
      clearInterval(this.freeTicker);
      this.freeTicker = null;
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
