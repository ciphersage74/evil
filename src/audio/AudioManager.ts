import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { getSound } from './sounds';

export type AudioState = {
  mix: Record<string, number>; // id du son -> volume individuel (0..1)
  isPlaying: boolean;
  timerRemaining: number; // secondes restantes (0 = minuterie off)
};

type Listener = (state: AudioState) => void;

const FADE_MS = 8000; // fondu de sortie de la minuterie (ne réveille pas bébé)
const FADE_STEP_MS = 100;

/**
 * Source de vérité de la lecture. Singleton qui pilote expo-av :
 *  - plusieurs sons joués et mixés simultanément (volume par son),
 *  - lecture en arrière-plan / écran éteint (configurée dans init + app.json),
 *  - boucle continue via isLooping sur des fichiers déjà raccordés sans couture,
 *  - minuterie de sommeil avec fondu progressif.
 */
class AudioManagerImpl {
  private sounds = new Map<string, Audio.Sound>();
  private listeners = new Set<Listener>();
  private state: AudioState = { mix: {}, isPlaying: false, timerRemaining: 0 };
  private master = 1;
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private fadeHandle: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    await Audio.setAudioModeAsync({
      staysActiveInBackground: true, // continue écran éteint / app en fond
      playsInSilentModeIOS: true, // joue même en mode silencieux (iPhone)
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      playThroughEarpieceAndroid: false,
    });
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

  // ---- Mix -----------------------------------------------------------------

  async toggleSound(id: string) {
    if (this.state.mix[id] !== undefined) {
      await this.removeSound(id);
    } else {
      await this.addSound(id, 0.7);
    }
  }

  async setVolume(id: string, volume: number) {
    const v = Math.max(0, Math.min(1, volume));
    if (v <= 0.01) {
      await this.removeSound(id);
      return;
    }
    if (this.state.mix[id] === undefined) {
      await this.addSound(id, v);
      return;
    }
    this.emit({ mix: { ...this.state.mix, [id]: v } });
    await this.sounds.get(id)?.setVolumeAsync(v * this.master);
  }

  private async addSound(id: string, volume: number) {
    const meta = getSound(id);
    if (!meta) return;
    await this.init();
    try {
      const { sound } = await Audio.Sound.createAsync(meta.source, {
        isLooping: true,
        volume: volume * this.master,
        shouldPlay: true,
      });
      this.sounds.set(id, sound);
      this.emit({ mix: { ...this.state.mix, [id]: volume }, isPlaying: true });
      await activateKeepAwakeAsync('playback');
    } catch (e) {
      console.warn('addSound failed', id, e);
    }
  }

  private async removeSound(id: string) {
    const sound = this.sounds.get(id);
    if (sound) {
      this.sounds.delete(id);
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
    }
    const mix = { ...this.state.mix };
    delete mix[id];
    const isPlaying = Object.keys(mix).length > 0 && this.state.isPlaying;
    this.emit({ mix, isPlaying });
    if (Object.keys(mix).length === 0) this.cleanupTimers();
  }

  // ---- Lecture -------------------------------------------------------------

  async play() {
    if (Object.keys(this.state.mix).length === 0) return;
    this.setMaster(1);
    await Promise.all([...this.sounds.values()].map((s) => s.playAsync().catch(() => {})));
    await activateKeepAwakeAsync('playback');
    this.emit({ isPlaying: true });
  }

  async pause() {
    this.cleanupTimers();
    await Promise.all([...this.sounds.values()].map((s) => s.pauseAsync().catch(() => {})));
    deactivateKeepAwake('playback');
    this.emit({ isPlaying: false });
  }

  async togglePlay() {
    if (this.state.isPlaying) await this.pause();
    else await this.play();
  }

  async stopAll() {
    this.cleanupTimers();
    await Promise.all(
      [...this.sounds.values()].map(async (s) => {
        await s.stopAsync().catch(() => {});
        await s.unloadAsync().catch(() => {});
      }),
    );
    this.sounds.clear();
    deactivateKeepAwake('playback');
    this.emit({ mix: {}, isPlaying: false, timerRemaining: 0 });
  }

  /** Recharge un mix sauvegardé sans relancer la lecture. */
  async restoreMix(mix: Record<string, number>) {
    const ids = Object.keys(mix);
    if (ids.length === 0) return;
    await this.init();
    for (const id of ids) {
      const meta = getSound(id);
      if (!meta) continue;
      try {
        const { sound } = await Audio.Sound.createAsync(meta.source, {
          isLooping: true,
          volume: mix[id] * this.master,
          shouldPlay: true,
        });
        this.sounds.set(id, sound);
      } catch (e) {
        console.warn('restore failed', id, e);
      }
    }
    await activateKeepAwakeAsync('playback');
    this.emit({ mix, isPlaying: true });
  }

  // ---- Minuterie de sommeil ------------------------------------------------

  async setTimer(minutes: number) {
    this.cleanupTimers();
    if (minutes <= 0) {
      this.emit({ timerRemaining: 0 });
      return;
    }
    if (!this.state.isPlaying) await this.play();
    let remaining = minutes * 60;
    this.emit({ timerRemaining: remaining });
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

  private fadeOutAndPause() {
    let level = 1;
    const decrement = FADE_STEP_MS / FADE_MS;
    this.fadeHandle = setInterval(() => {
      level -= decrement;
      if (level <= 0) {
        if (this.fadeHandle) clearInterval(this.fadeHandle);
        this.fadeHandle = null;
        this.pause();
        this.setMaster(1); // réinitialise pour la prochaine lecture
      } else {
        this.setMaster(level);
      }
    }, FADE_STEP_MS);
  }

  private setMaster(level: number) {
    this.master = Math.max(0, Math.min(1, level));
    for (const [id, sound] of this.sounds) {
      const v = (this.state.mix[id] ?? 0) * this.master;
      sound.setVolumeAsync(v).catch(() => {});
    }
  }

  private cleanupTimers() {
    if (this.timerHandle) clearInterval(this.timerHandle);
    if (this.fadeHandle) clearInterval(this.fadeHandle);
    this.timerHandle = null;
    this.fadeHandle = null;
    if (this.state.timerRemaining !== 0) this.emit({ timerRemaining: 0 });
  }
}

export const AudioManager = new AudioManagerImpl();
