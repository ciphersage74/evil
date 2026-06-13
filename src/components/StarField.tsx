import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

type Star = { x: number; y: number; size: number; delay: number; duration: number };

/**
 * Champ d'étoiles scintillantes en fond, pour une ambiance nocturne premium.
 * 100 % dépendance-free (API Animated), positions figées au montage.
 */
export function StarField({ count = 26 }: { count?: number }) {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: count }).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.7,
        size: 1.5 + Math.random() * 2.5,
        delay: Math.random() * 2500,
        duration: 1400 + Math.random() * 2200,
      })),
    [count],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {stars.map((s, i) => (
        <Twinkle key={i} star={s} />
      ))}
    </View>
  );
}

function Twinkle({ star }: { star: Star }) {
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.9,
          duration: star.duration,
          delay: star.delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.15,
          duration: star.duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, star]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: star.x,
        top: star.y,
        width: star.size,
        height: star.size,
        borderRadius: star.size,
        backgroundColor: theme.colors.moon,
        opacity,
      }}
    />
  );
}
