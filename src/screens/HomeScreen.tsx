import Slider from '@react-native-community/slider';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AudioManager, SAFE_VOLUME_MAX } from '../audio/AudioManager';
import { openManageSubscriptions } from '../billing/purchases';
import { SOUNDS, Sound } from '../audio/sounds';
import { useAudio } from '../audio/useAudio';
import { Chip, NightBackground } from '../components/ui';
import { PaywallReason } from './PaywallScreen';
import { theme } from '../theme';

// À remplacer par vos vraies URLs avant publication (requis par les stores).
const PRIVACY_URL = 'https://dreamdrops.app/privacy';
const TERMS_URL = 'https://dreamdrops.app/terms';

type Props = {
  premium: boolean;
  batteryTipDismissed: boolean;
  onDismissBatteryTip: () => void;
  onOpenPaywall: (reason: PaywallReason) => void;
  onRestore: () => void;
};

export function HomeScreen({
  premium,
  batteryTipDismissed,
  onDismissBatteryTip,
  onOpenPaywall,
  onRestore,
}: Props) {
  const { mix, isPlaying, timerRemaining, volume } = useAudio();
  const [showTimer, setShowTimer] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const activeCount = Object.keys(mix).length;

  const onTap = (sound: Sound) => {
    if (sound.premium && !premium) {
      onOpenPaywall('locked');
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
            {!premium && activeCount > 0 && (
              <Pressable onPress={() => onOpenPaywall('limit')}>
                <Text style={styles.freeNote}>
                  Aperçu gratuit · sessions de 15 min — débloquez toute la nuit
                </Text>
              </Pressable>
            )}
          </View>
          {!premium && (
            <Pressable style={styles.premiumPill} onPress={() => onOpenPaywall('manual')}>
              <Text style={styles.premiumPillText}>✨ Premium</Text>
            </Pressable>
          )}
          <Pressable style={styles.gear} onPress={() => setShowSettings(true)} hitSlop={8}>
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>
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

        {/* Volume maître avec zone de sécurité auditive (unique sur le marché) */}
        <MasterVolume
          volume={volume}
          onChange={(v) => AudioManager.setUserVolume(v)}
          onInfo={() => setShowSafety(true)}
        />

        {/* Barre de contrôle */}
        <View style={styles.controls}>
          <Pressable style={styles.timerBtn} onPress={() => setShowTimer(true)}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerLabel}>
              {timerRemaining > 0 ? formatTime(timerRemaining) : 'Minuterie'}
            </Text>
          </Pressable>

          <PlayControl
            isPlaying={isPlaying}
            enabled={activeCount > 0}
            onPress={() => AudioManager.togglePlay()}
          />

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

      <SafetyModal visible={showSafety} onClose={() => setShowSafety(false)} />

      <SettingsModal
        visible={showSettings}
        premium={premium}
        onClose={() => setShowSettings(false)}
        onRestore={() => {
          onRestore();
          setShowSettings(false);
        }}
        onSafety={() => {
          setShowSettings(false);
          setShowSafety(true);
        }}
      />
    </NightBackground>
  );
}

function SettingsModal({
  visible,
  premium,
  onClose,
  onRestore,
  onSafety,
}: {
  visible: boolean;
  premium: boolean;
  onClose: () => void;
  onRestore: () => void;
  onSafety: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Réglages</Text>

        {premium && (
          <SettingsRow
            icon="💳"
            title="Gérer / résilier l'abonnement"
            subtitle="Ouvre vos abonnements dans le store"
            onPress={() => {
              openManageSubscriptions();
              onClose();
            }}
          />
        )}
        <SettingsRow icon="🔄" title="Restaurer mes achats" onPress={onRestore} />
        <SettingsRow icon="👶" title="Sommeil sûr — conseils pédiatres" onPress={onSafety} />
        <SettingsRow
          icon="🔒"
          title="Politique de confidentialité"
          onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
        />
        <SettingsRow
          icon="📄"
          title="Conditions d'utilisation"
          onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
        />
        <Text style={styles.version}>DreamDrops v1.0.0</Text>
        <View style={{ height: 16 }} />
      </View>
    </Modal>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.settingsRow} onPress={onPress}>
      <Text style={styles.settingsIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingsTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingsSub}>{subtitle}</Text>}
      </View>
      <Text style={styles.settingsChevron}>›</Text>
    </Pressable>
  );
}

function MasterVolume({
  volume,
  onChange,
  onInfo,
}: {
  volume: number;
  onChange: (v: number) => void;
  onInfo: () => void;
}) {
  const loud = volume > SAFE_VOLUME_MAX;
  const trackColor = loud ? theme.colors.danger : theme.colors.softBlue;
  return (
    <View style={styles.volumeWrap}>
      <View style={styles.volumeHeader}>
        <Text style={styles.volumeLabel}>Volume</Text>
        <Pressable onPress={onInfo} hitSlop={8} style={styles.safeBadge}>
          <Text style={styles.safeBadgeText}>
            {loud ? '⚠️ Volume élevé' : '👶 Volume sûr'} · en savoir plus
          </Text>
        </Pressable>
      </View>
      <Slider
        minimumValue={0}
        maximumValue={1}
        value={volume}
        onValueChange={onChange}
        minimumTrackTintColor={trackColor}
        maximumTrackTintColor={theme.colors.surfaceVariant}
        thumbTintColor={trackColor}
      />
      {loud && (
        <Text style={styles.volumeWarn}>
          Éloignez le téléphone d'au moins 2 m du berceau pour protéger l'audition de bébé.
        </Text>
      )}
    </View>
  );
}

function SafetyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Sommeil sûr 👶</Text>
        <Text style={styles.sheetSub}>
          Recommandations des pédiatres (AAP) pour un usage du bruit blanc sans risque
          pour l'audition de bébé :
        </Text>
        <SafetyItem icon="🔉" text="Gardez le volume bas — restez dans la zone « Volume sûr »." />
        <SafetyItem icon="📏" text="Placez le téléphone à au moins 2 m (7 pieds) du berceau." />
        <SafetyItem icon="⏱️" text="Limitez la durée : utilisez la minuterie d'endormissement." />
        <SafetyItem icon="👂" text="Repère simple : vous devez pouvoir parler normalement dans la pièce." />
        <View style={{ height: 24 }} />
      </View>
    </Modal>
  );
}

function SafetyItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.safetyItem}>
      <Text style={styles.safetyIcon}>{icon}</Text>
      <Text style={styles.safetyText}>{text}</Text>
    </View>
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

function PlayControl({
  isPlaying,
  enabled,
  onPress,
}: {
  isPlaying: boolean;
  enabled: boolean;
  onPress: () => void;
}) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    }
    pulse.setValue(0);
  }, [isPlaying, pulse]);

  const glowScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  return (
    <View style={styles.playWrap}>
      {isPlaying && (
        <Animated.View
          pointerEvents="none"
          style={[styles.playGlow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
        />
      )}
      <Pressable
        style={[styles.playBtn, !enabled && styles.playBtnDisabled]}
        disabled={!enabled}
        onPress={onPress}
      >
        <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
      </Pressable>
    </View>
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
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const startCustom = () => {
    const minutes = parseInt(customValue, 10);
    if (!Number.isNaN(minutes) && minutes > 0) {
      onPick(Math.min(minutes, 720)); // garde-fou : 12 h max
      setCustomValue('');
      setCustomOpen(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Minuterie de sommeil</Text>
        <Text style={styles.sheetSub}>Choisissez la durée — le son s'estompe en douceur à la fin</Text>
        <View style={styles.chips}>
          {options.map((m) => (
            <Chip
              key={m}
              label={m === 0 ? 'Désactivée' : `${m} min`}
              active={current > 0 && Math.ceil(current / 60) === m}
              onPress={() => onPick(m)}
            />
          ))}
          <Chip label="Personnalisée" active={customOpen} onPress={() => setCustomOpen((o) => !o)} />
        </View>

        {customOpen && (
          <View style={styles.customRow}>
            <TextInput
              style={styles.customInput}
              value={customValue}
              onChangeText={(t) => setCustomValue(t.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="ex. 75"
              placeholderTextColor={theme.colors.textSecondary}
              maxLength={3}
            />
            <Text style={styles.customUnit}>min</Text>
            <Pressable style={styles.customBtn} onPress={startCustom}>
              <Text style={styles.customBtnText}>Démarrer</Text>
            </Pressable>
          </View>
        )}
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
  freeNote: { color: theme.colors.moon, fontSize: 12, marginTop: 4, fontWeight: '600' },
  premiumPill: {
    backgroundColor: 'rgba(255,233,168,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  premiumPillText: { color: theme.colors.moon, fontWeight: '600' },
  gear: { marginLeft: 10, padding: 4 },
  gearIcon: { fontSize: 20 },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  },
  settingsIcon: { fontSize: 20 },
  settingsTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
  settingsSub: { color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 },
  settingsChevron: { color: theme.colors.textSecondary, fontSize: 22 },
  version: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 16 },
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
  volumeWrap: { paddingHorizontal: 24, paddingTop: 4 },
  volumeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  volumeLabel: { color: theme.colors.textSecondary, fontSize: 13, fontWeight: '600' },
  safeBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  safeBadgeText: { color: theme.colors.textSecondary, fontSize: 11, fontWeight: '600' },
  volumeWarn: { color: theme.colors.danger, fontSize: 11, marginTop: 2 },
  safetyItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 7 },
  safetyIcon: { fontSize: 20 },
  safetyText: { color: theme.colors.textPrimary, fontSize: 14, flex: 1, lineHeight: 19 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  customInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: 16,
  },
  customUnit: { color: theme.colors.textSecondary, fontSize: 14 },
  customBtn: {
    backgroundColor: theme.colors.lavender,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  customBtnText: { color: theme.colors.night, fontWeight: '700' },
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
  playWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  playGlow: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: theme.colors.lavender,
  },
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
