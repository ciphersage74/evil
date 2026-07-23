import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { NightBackground, PrimaryButton } from '../components/ui';
import { StarField } from '../components/StarField';
import { theme } from '../theme';

/**
 * Première impression de l'app : un écran de bienvenue soigné et animé.
 * Logo, lueur pulsante, étoiles scintillantes et apparition en fondu.
 */
export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start();

    // Lueur qui respire derrière le logo.
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [fade, rise, logoScale, glow]);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.6] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] });

  return (
    <NightBackground>
      <StarField />
      <Animated.View style={[styles.root, { opacity: fade }]}>
        <View style={styles.center}>
          <View style={styles.logoWrap}>
            <Animated.View
              style={[styles.glow, { opacity: glowOpacity, transform: [{ scale: glowScale }] }]}
            />
            <Animated.View style={{ transform: [{ scale: logoScale }] }}>
              <Image source={require('../../assets/adaptive-icon.png')} style={styles.logo} />
            </Animated.View>
          </View>

          <Animated.View style={{ transform: [{ translateY: rise }] }}>
            <Text style={styles.title}>Bébé Dort</Text>
            <Text style={styles.tagline}>
              Aidez bébé à s'endormir{'\n'}en quelques minutes
            </Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, { transform: [{ translateY: rise }] }]}>
          <PrimaryButton title="Commencer" onPress={onStart} />
          <Text style={styles.reassure}>Sans publicité · Essai gratuit · Annulable à tout moment</Text>
        </Animated.View>
      </Animated.View>
    </NightBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  glow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: theme.colors.lavender,
  },
  logo: { width: 168, height: 168, resizeMode: 'contain' },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  tagline: {
    color: theme.colors.textSecondary,
    fontSize: 17,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 24,
  },
  footer: { gap: 14 },
  reassure: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});
