import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import SkyBackground from '../../components/visual/SkyBackground';
import BubbleField from '../../components/visual/BubbleField';
import LogoBubble from '../../components/visual/LogoBubble';
import GlassButton from '../../components/visual/GlassButton';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'radio-outline',
    title: 'Find your people,\nblock by block.',
    subtitle: 'Bubble shows what\'s happening within a few streets of you, right now. Nothing from across the city. Nothing stale.',
  },
  {
    icon: 'chatbubble-ellipses-outline',
    title: 'Connect\nauthentically.',
    subtitle: 'Join bubbles, send signals, and start real conversations with mutual interest — no spam, no guessing.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Your privacy,\nalways protected.',
    subtitle: "Your exact location is never shared. You're always in control of who sees you and when.",
  },
];

export default function IntroCarouselScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  function handleSkip() {
    navigation.navigate('ProfileBasics');
  }

  function handleNext() {
    if (activeIndex < SLIDES.length - 1) {
      const nextIndex = activeIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    } else {
      navigation.navigate('ProfileBasics');
    }
  }

  function onViewableItemsChanged({ viewableItems }) {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };
  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  function renderSlide({ item }) {
    return (
      <View style={styles.slide}>
        {/* Cluster of logo bubbles as illustration */}
        <View style={styles.bubbleCluster}>
          <View style={[styles.clusterBubble, { top: 20, left: 50 }]}>
            <LogoBubble size={100} />
          </View>
          <View style={[styles.clusterBubble, { top: 60, left: 130 }]}>
            <LogoBubble size={70} />
          </View>
          <View style={[styles.clusterBubble, { top: 130, left: 70 }]}>
            <LogoBubble size={80} />
          </View>
          <View style={[styles.clusterBubble, { top: 160, left: 150 }]}>
            <LogoBubble size={55} />
          </View>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    );
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <View style={styles.inner}>
        {/* Skip top-right */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} accessibilityRole="button">
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
          style={styles.flatList}
        />

        {/* Dots + next arrow row */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <GlassButton
            label={activeIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            variant="primary"
            size="lg"
            onPress={handleNext}
          />
        </View>
      </View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  inner: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 32,
    paddingHorizontal: 28,
    paddingBottom: 40,
    zIndex: 2,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: theme.colors.inkFaint,
  },
  flatList: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH - 56,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  bubbleCluster: {
    position: 'relative',
    width: 240,
    height: 240,
    marginBottom: 40,
  },
  clusterBubble: {
    position: 'absolute',
  },
  slideTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    color: theme.colors.ink,
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 38,
  },
  slideSubtitle: {
    fontSize: 16,
    color: theme.colors.inkSoft,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  footer: {
    gap: 12,
    paddingBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.inkGhost,
  },
  dotActive: {
    width: 20,
    backgroundColor: theme.colors.skyDeep,
  },
});
