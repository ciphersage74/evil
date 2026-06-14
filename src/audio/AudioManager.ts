import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { getSound } from './sounds';

export type AudioState = {
  mix: Record<string, number>; // id du son -> volume individuel (0..1)
  isPlaying: boolean;
  timerRemaining: number; // secondes restantes (0 = minuterie off)
  /** Volume maître réglé par le parent (0..1). */
  volume: number;
  /** true quand la session gratuite vient d'expirer -> déclenche le paywall. */
  freeLimitHit: boolean;
};

type Listener = (state: AudioState) => void;

const FADE_MS = 8000; // fondu de sortie de la minuterie (ne réveille pas bébé)
const FADE_STEP_MS = 100;

// Sécurité auditive (recommandations AAP : volume bas, appareil à ~2 m du berceau,
// durée limitée). Au-delà de ce seuil, l'UI prévient le parent. Différenciateur
// qu'aucune app concurrente de bruit pour bébé ne propose.
export const SAFE_VOLUME_MAX = 0.7;
const DEFAULT_VOLUME = 0.55;

// Levier de conversion : les utilisateurs gratuits ont des sessions limitées.
// Le bénéfice clé "joue toute la nuit" devient une raison concrète de passer
// premium (modèle prouvé : les paywalls à essai convertissent ~5x le freemium).
const FREE_SESSION_SECONDS = 15 * 60;

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
  private state: AudioState = {
    mix: {},
    isPlaying: false,
    timerRemaining: 0,
    volume: DEFAULT_VOLUME,
    freeLimitHit: false,
  };
  private userVolume = DEFAULT_VOLUME; // volume maître réglé par le parent
  private fadeLevel = 1; // multiplicateur interne (fondu minuterie / session)
  private timerHandle: ReturnType<typeof setInterval> | null = null;
  private fadeHandle: ReturnType<typeof setInterval> | null = null;
  private freeSessionHandle: ReturnType<typeof setTimeout> | null = null;
  private premium = false;
  private initialized = false;

  /** Renseigné par l'app : les premium n'ont aucune limite de session. */
  setPremium(value: boolean) {
    this.premium = value;
    if (value) {
      this.clearFreeSession();
      if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
    }
  }

  /** L'UI appelle ceci après avoir traité la fin de session (ouverture paywall). */
  acknowledgeFreeLimit() {
    if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    // Non bloquant : si la config échoue, la lecture (au moins au premier plan)
    // doit quand même fonctionner. On tente le mode complet, puis un repli minimal.
    try {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true, // continue écran éteint / app en fond
        playsInSilentModeIOS: true, // joue même en mode silencieux (iPhone)
        shouldDuckAndroid: true,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
      });
    } catch (e) {
      console.warn('setAudioModeAsync (complet) a échoué, repli minimal', e);
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
        });
      } catch (e2) {
        console.warn('setAudioModeAsync (minimal) a échoué', e2);
      }
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
    await this.sounds.get(id)?.setVolumeAsync(v * this.gain());
  }

  private async addSound(id: string, volume: number) {
    const meta = getSound(id);
    if (!meta) return;
    await this.init();
    try {
      const { sound } = await Audio.Sound.createAsync(meta.source, {
        isLooping: true,
        volume: volume * this.gain(),
        shouldPlay: true,
      });
      this.sounds.set(id, sound);
      this.emit({ mix: { ...this.state.mix, [id]: volume }, isPlaying: true });
      await activateKeepAwakeAsync('playback');
      this.startFreeSession();
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
    this.setFadeLevel(1);
    await Promise.all([...this.sounds.values()].map((s) => s.playAsync().catch(() => {})));
    await activateKeepAwakeAsync('playback');
    this.emit({ isPlaying: true });
    this.startFreeSession();
  }

  async pause() {
    this.cleanupTimers();
    this.clearFreeSession();
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
    this.clearFreeSession();
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
          volume: mix[id] * this.gain(),
          shouldPlay: true,
        });
        this.sounds.set(id, sound);
      } catch (e) {
        console.warn('restore failed', id, e);
      }
    }
    await activateKeepAwakeAsync('playback');
    this.emit({ mix, isPlaying: true });
    this.startFreeSession();
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

  private fadeOutAndPause(onDone?: () => void) {
    let level = 1;
    const decrement = FADE_STEP_MS / FADE_MS;
    this.fadeHandle = setInterval(() => {
      level -= decrement;
      if (level <= 0) {
        if (this.fadeHandle) clearInterval(this.fadeHandle);
        this.fadeHandle = null;
        this.pause();
        this.setFadeLevel(1); // réinitialise pour la prochaine lecture
        onDone?.();
      } else {
        this.setFadeLevel(level);
      }
    }, FADE_STEP_MS);
  }

  // ---- Session gratuite limitée (levier de conversion) ---------------------

  private startFreeSession() {
    if (this.premium) return;
    if (this.freeSessionHandle != null) return; // déjà en cours
    if (this.state.freeLimitHit) this.emit({ freeLimitHit: false });
    this.freeSessionHandle = setTimeout(() => {
      this.freeSessionHandle = null;
      // Fondu doux (ne réveille pas bébé) puis signale au paywall.
      this.fadeOutAndPause(() => this.emit({ freeLimitHit: true }));
    }, FREE_SESSION_SECONDS * 1000);
  }

  private clearFreeSession() {
    if (this.freeSessionHandle != null) {
      clearTimeout(this.freeSessionHandle);
      this.freeSessionHandle = null;
    }
  }

  // ---- Volume maître (parent) + sécurité auditive --------------------------

  /** Volume effectif = choix parent × fondu interne. */
  private gain() {
    return this.userVolume * this.fadeLevel;
  }

  /** Volume maître réglé par le parent (0..1). Appliqué immédiatement. */
  setUserVolume(volume: number) {
    this.userVolume = Math.max(0, Math.min(1, volume));
    this.applyGains();
    this.emit({ volume: this.userVolume });
  }

  /** Multiplicateur interne pour les fondus (minuterie / fin de session). */
  private setFadeLevel(level: number) {
    this.fadeLevel = Math.max(0, Math.min(1, level));
    this.applyGains();
  }

  private applyGains() {
    const g = this.gain();
    for (const [id, sound] of this.sounds) {
      sound.setVolumeAsync((this.state.mix[id] ?? 0) * g).catch(() => {});
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
