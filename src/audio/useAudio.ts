import { useSyncExternalStore } from 'react';
import { AudioManager, AudioState } from './AudioManager';

/** Abonne un composant à l'état de lecture global. */
export function useAudio(): AudioState {
  return useSyncExternalStore(
    (cb) => AudioManager.subscribe(cb),
    () => AudioManager.getState(),
    () => AudioManager.getState(),
  );
}
