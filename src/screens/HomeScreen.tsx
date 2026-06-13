import Slider from '@react-native-community/slider';
import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AudioManager } from '../audio/AudioManager';
import { SOUNDS, Sound } from '../audio/sounds';
import { useAudio } from '../audio/useAudio';
import { Chip, NightBackground } from '../components/ui';
import { theme } from '../theme';

type Props = {
  premium: boolean;
  batteryTipDismissed: boolean;
  onDismissBatteryTip: () => void;
  onOpenPaywall: () => void;
};

export function HomeScreen({
  premium,
  batteryTipDismissed,
  onDismissBatteryTip,
  onOpenPaywall,
}: Props) {
  const { mix, isPlaying, timerRemaining } = useAudio();
  const [showTimer, setShowTimer] = useState(false);
  const activeCount = Object.keys(mix).length;

  const onTap = (sound: Sound) => {
    if (sound.premium && !premium) {
      onOpenPaywall();
      return;
    }
    AudioManager.toggleSound(sound.id);
  };

  return (
    <NightBackground>
      <View style={styles.root}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>DreamDrops</Text>
            <Text style={styles.subtitle}>
              {activeCount === 0
                ? 'Touchez un son pour démarrer'
                : `${activeCount} son${activeCount > 1 ? 's' : ''} en lecture`}
            </Text>
          </View>
          {!premium && (
            <Pressable style={styles.premiumPill} onPress={onOpenPaywall}>
              <Text style={styles.premiumPillText}>✨ Premium</Text>
            </Pressable>
          )}
        </View>

        {/* Conseil batterie : corrige "le son s'arrête la nuit" */}
        {isPlaying && !batteryTipDismissed && Platform.OS === 'android' && (
          <BatteryTip onDismiss={onDismissBatteryTip} />
        )}

        {/* Grille de sons */}
        <ScrollView contentContainerStyle={styles.grid}>
          {SOUNDS.map((sound) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              volume={mix[sound.id]}
              locked={sound.premium && !premium}
              onTap={() => onTap(sound)}
              onVolume={(v) => AudioManager.setVolume(sound.id, v)}
            />
          ))}
        </ScrollView>

        {/* Barre de contrôle */}
        <View style={styles.controls}>
          <Pressable style={styles.timerBtn} onPress={() => setShowTimer(true)}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerLabel}>
              {timerRemaining > 0 ? formatTime(timerRemaining) : 'Minuterie'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.playBtn, activeCount === 0 && styles.playBtnDisabled]}
            disabled={activeCount === 0}
            onPress={() => AudioManager.togglePlay()}
          >
            <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
          </Pressable>

          <View style={{ width: 56 }} />
        </View>
      </View>

      <TimerModal
        visible={showTimer}
        current={timerRemaining}
        onClose={() => setShowTimer(false)}
        onPick={(m) => {
          AudioManager.setTimer(m);
          setShowTimer(false);
        }}
      />
    </NightBackground>
  );
}

function SoundCard({
  sound,
  volume,
  locked,
  onTap,
  onVolume,
}: {
  sound: Sound;
  volume?: number;
  locked: boolean;
  onTap: () => void;
  onVolume: (v: number) => void;
}) {
  const selected = volume !== undefined;
  return (
    <Pressable
      onPress={onTap}
      style={[
        styles.card,
        selected && { backgroundColor: hexA(sound.tint, 0.22), borderColor: sound.tint, borderWidth: 1.5 },
      ]}
    >
      {locked && <Text style={styles.lock}>🔒</Text>}
      <Text style={styles.cardEmoji}>{sound.emoji}</Text>
      <Text style={[styles.cardLabel, selected && { color: theme.colors.textPrimary }]} numberOfLines={2}>
        {sound.label}
      </Text>
      {selected && (
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={volume}
          onValueChange={onVolume}
          minimumTrackTintColor={sound.tint}
          maximumTrackTintColor={hexA(sound.tint, 0.25)}
          thumbTintColor={sound.tint}
        />
      )}
    </Pressable>
  );
}

function BatteryTip({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.tip}>
      <Text style={styles.tipTitle}>Gardez le son toute la nuit</Text>
      <Text style={styles.tipBody}>
        Certains téléphones arrêtent les apps pour économiser la batterie. Autorisez
        DreamDrops à fonctionner sans restriction pour que le son ne se coupe jamais.
      </Text>
      <View style={styles.tipActions}>
        <Pressable
          style={styles.tipCta}
          onPress={() => {
            Linking.openSettings().catch(() => {});
            onDismiss();
          }}
        >
          <Text style={styles.tipCtaText}>Ouvrir les réglages</Text>
        </Pressable>
        <Pressable onPress={onDismiss} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
          <Text style={styles.tipDismiss}>Plus tard</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TimerModal({
  visible,
  current,
  onClose,
  onPick,
}: {
  visible: boolean;
  current: number;
  onClose: () => void;
  onPick: (minutes: number) => void;
}) {
  const options = [0, 15, 30, 45, 60, 90, 120];
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Minuterie de sommeil</Text>
        <Text style={styles.sheetSub}>Le son s'estompe en douceur à la fin</Text>
        <View style={styles.chips}>
          {options.map((m) => (
            <Chip
              key={m}
              label={m === 0 ? 'Désactivée' : `${m} min`}
              active={current > 0 && Math.ceil(current / 60) === m}
              onPress={() => onPick(m)}
            />
          ))}
        </View>
      </View>
    </Modal>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Applique une opacité (alpha 0..1) à une couleur hex #RRGGBB. */
function hexA(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appName: { color: theme.colors.textPrimary, fontSize: 24, fontWeight: '700' },
  subtitle: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 2 },
  premiumPill: {
    backgroundColor: 'rgba(255,233,168,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumPillText: { color: theme.colors.moon, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    width: '31%',
    aspectRatio: 0.82,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderColor: 'transparent',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    marginBottom: 12,
  },
  cardEmoji: { fontSize: 32, marginBottom: 6 },
  cardLabel: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' },
  lock: { position: 'absolute', top: 8, right: 8, fontSize: 12 },
  slider: { width: '100%', height: 28, marginTop: 4 },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  timerBtn: { alignItems: 'center', width: 56 },
  timerIcon: { fontSize: 22 },
  timerLabel: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnDisabled: { backgroundColor: theme.colors.surface },
  playIcon: { color: theme.colors.night, fontSize: 26, fontWeight: '700' },
  tip: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: theme.radius.md,
    backgroundColor: 'rgba(255,233,168,0.12)',
  },
  tipTitle: { color: theme.colors.moon, fontWeight: '700', fontSize: 15 },
  tipBody: { color: theme.colors.textSecondary, fontSize: 13, marginTop: 4, lineHeight: 18 },
  tipActions: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  tipCta: {
    backgroundColor: 'rgba(255,233,168,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  tipCtaText: { color: theme.colors.moon, fontWeight: '600' },
  tipDismiss: { color: theme.colors.lavender, fontWeight: '600' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
  sheetSub: { color: theme.colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
});
