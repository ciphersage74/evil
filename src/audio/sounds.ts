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
  { id: 'rain', label: 'Gentle Rain', emoji: '🌧️', tint: '#6FA8FF', premium: false, source: require('../../assets/sounds/rain.wav') },
  { id: 'womb', label: 'Womb Heartbeat', emoji: '❤️', tint: '#FF8FA3', premium: false, source: require('../../assets/sounds/womb.wav') },
  { id: 'white', label: 'White Noise', emoji: '🔅', tint: '#B9C4E0', premium: false, source: require('../../assets/sounds/white.wav') },
  { id: 'ocean', label: 'Ocean Waves', emoji: '🌊', tint: '#55C6D6', premium: false, source: require('../../assets/sounds/ocean.wav') },
  { id: 'heavy_rain', label: 'Heavy Rain', emoji: '⛈️', tint: '#4F7FE0', premium: true, source: require('../../assets/sounds/heavy_rain.wav') },
  { id: 'pink', label: 'Pink Noise', emoji: '🌸', tint: '#FFA8D0', premium: true, source: require('../../assets/sounds/pink.wav') },
  { id: 'brown', label: 'Brown Noise', emoji: '🌰', tint: '#D2A679', premium: true, source: require('../../assets/sounds/brown.wav') },
  { id: 'wind', label: 'Soft Wind', emoji: '🌬️', tint: '#9FE0C0', premium: true, source: require('../../assets/sounds/wind.wav') },
  { id: 'stream', label: 'Forest Stream', emoji: '💧', tint: '#7FD0FF', premium: true, source: require('../../assets/sounds/stream.wav') },
  { id: 'fan', label: 'Fan', emoji: '🌀', tint: '#C0C0D8', premium: true, source: require('../../assets/sounds/fan.wav') },
];

export const FREE_IDS = SOUNDS.filter((s) => !s.premium).map((s) => s.id);

export const getSound = (id: string) => SOUNDS.find((s) => s.id === id);
