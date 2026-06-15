import { AVPlaybackSource } from 'expo-av';

/**
 * Catalogue des ambiances. Les fichiers sont générés par `tools/generate_sounds.py`
 * (bruits synthétisés, libres de droits, bouclés sans couture audible) puis lus en
 * boucle par expo-av. Remplace-les par tes propres samples si tu le souhaites.
 */
export type Sound = {
  id: string;
  label: string;
  emoji: string;
  tint: string;
  premium: boolean;
  source: AVPlaybackSource;
};

export const SOUNDS: Sound[] = [
  { id: 'rain', label: 'Pluie douce', emoji: '🌧️', tint: '#6FA8FF', premium: false, source: require('../../assets/sounds/rain.wav') },
  { id: 'womb', label: 'Cœur maternel', emoji: '❤️', tint: '#FF8FA3', premium: false, source: require('../../assets/sounds/womb.wav') },
  { id: 'white', label: 'Bruit blanc', emoji: '🔅', tint: '#B9C4E0', premium: false, source: require('../../assets/sounds/white.wav') },
  { id: 'ocean', label: 'Vagues océan', emoji: '🌊', tint: '#55C6D6', premium: false, source: require('../../assets/sounds/ocean.wav') },
  { id: 'heavy_rain', label: 'Pluie forte', emoji: '⛈️', tint: '#4F7FE0', premium: true, source: require('../../assets/sounds/heavy_rain.wav') },
  { id: 'pink', label: 'Bruit rose', emoji: '🌸', tint: '#FFA8D0', premium: true, source: require('../../assets/sounds/pink.wav') },
  { id: 'brown', label: 'Bruit brun', emoji: '🌰', tint: '#D2A679', premium: true, source: require('../../assets/sounds/brown.wav') },
  { id: 'wind', label: 'Vent doux', emoji: '🌬️', tint: '#9FE0C0', premium: true, source: require('../../assets/sounds/wind.wav') },
  { id: 'stream', label: 'Ruisseau', emoji: '💧', tint: '#7FD0FF', premium: true, source: require('../../assets/sounds/stream.wav') },
  { id: 'fan', label: 'Ventilateur', emoji: '🌀', tint: '#C0C0D8', premium: true, source: require('../../assets/sounds/fan.wav') },
];

export const FREE_IDS = SOUNDS.filter((s) => !s.premium).map((s) => s.id);

export const getSound = (id: string) => SOUNDS.find((s) => s.id === id);
