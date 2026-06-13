import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import { NightBackground, PrimaryButton } from '../components/ui';
import { StarField } from '../components/StarField';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const PAGES = [
  {
    emoji: '🌧️',
    title: 'Des sons que les bébés adorent',
    body: 'Pluie douce, battements de cœur du ventre et bruit blanc apaisant — conçus pour endormir les nouveau-nés.',
  },
  {
    emoji: '🌙',
    title: 'Joue toute la nuit, sans coupure',
    body: "Le son ne s'arrête jamais en pleine nuit et ne boucle jamais de façon audible. Vraiment infini, même hors-ligne.",
  },
  {
    emoji: '🚫',
    title: 'Aucune publicité. Jamais.',
    body: 'Pas de vidéo à regarder avant de dormir. Ouvrez et lancez, c\'est tout. Du calme pour bébé, du calme pour vous.',
  },
];

export function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const isLast = index === PAGES.length - 1;

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const next = () => {
    if (isLast) onFinish();
    else listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <NightBackground>
      <StarField count={18} />
      <View style={styles.root}>
        <FlatList
          ref={listRef}
          data={PAGES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, i) => String(i)}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          renderItem={({ item }) => (
            <View style={[styles.page, { width }]}>
              <Text style={styles.emoji}>{item.emoji}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
          )}
        />
        <View style={styles.dots}>
          {PAGES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.footer}>
          <PrimaryButton title={isLast ? 'Commencer' : 'Suivant'} onPress={next} />
        </View>
      </View>
    </NightBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: 60, paddingBottom: 40 },
  page: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, flex: 1 },
  emoji: { fontSize: 96, marginBottom: 32 },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', marginVertical: 24 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(154,166,204,0.3)',
    marginHorizontal: 4,
  },
  dotActive: { width: 24, backgroundColor: theme.colors.lavender },
  footer: { paddingHorizontal: 24 },
});
