import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORY_ICONS } from '../constants/icons';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import ScreenHeader from '../components/visual/ScreenHeader';
import GlassButton from '../components/visual/GlassButton';
import SectionLabel from '../components/visual/SectionLabel';

const CATEGORIES = [
  { name: 'Social', description: 'Hang out and chat' },
  { name: 'Study', description: 'Learn together' },
  { name: 'Food & Drinks', description: 'Grab a bite' },
  { name: 'Sports', description: 'Get active' },
  { name: 'Music', description: 'Share the vibe' },
  { name: 'Nightlife', description: 'Party nearby' },
  { name: 'Outdoors', description: 'Explore outside' },
  { name: 'Gaming', description: 'Play together' },
  { name: 'Tech', description: 'Geek out' },
  { name: 'Art', description: 'Get creative' },
  { name: 'Other', description: 'Something else' },
];

export default function CreateTypeChooserScreen({ navigation }) {
  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeInUp(enterAnim, { duration: 320 }).start();
  }, []);

  function handleSelect(category) {
    navigation.navigate('CreateTimeAndPlace', { category });
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField />
      <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
        <ScreenHeader
          title="New Bubble"
          onBack={() => navigation.goBack()}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>What are you floating?</Text>
          <Text style={styles.subheading}>Pick a shape. You can change almost everything later.</Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('DropMessage')}
            accessibilityRole="button"
            accessibilityLabel="Drop a Message"
            style={styles.dropMessageTouch}
          >
            <GlassCard style={styles.dropMessageCard}>
              <View style={styles.dropMessageIcon}>
                <Ionicons name="pin" size={22} color={theme.colors.ink} />
              </View>
              <View style={styles.dropMessageText}>
                <Text style={styles.dropMessageTitle}>Drop a Message</Text>
                <Text style={styles.dropMessageDesc}>Leave a note anchored to this spot for people nearby to discover</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.inkMuted} />
            </GlassCard>
          </TouchableOpacity>

          <SectionLabel style={styles.sectionLabel}>Or create a bubble</SectionLabel>

          <View style={styles.grid}>
            {CATEGORIES.map((cat) => {
              const iconName = CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.Other;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={styles.cardTouch}
                  onPress={() => handleSelect(cat.name)}
                  accessibilityRole="button"
                  accessibilityLabel={cat.name}
                >
                  <GlassCard style={styles.card}>
                    <View style={styles.iconWrapper}>
                      <Ionicons name={iconName} size={26} color={theme.colors.skyDeep} />
                    </View>
                    <Text style={styles.cardLabel}>{cat.name}</Text>
                    <Text style={styles.cardDesc}>{cat.description}</Text>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: theme.spacing.xl, paddingBottom: 100 },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.ink,
    letterSpacing: -0.6,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: theme.colors.inkMuted,
    marginBottom: theme.spacing.xl,
    lineHeight: 20,
  },
  dropMessageTouch: { marginBottom: theme.spacing.xl },
  dropMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  dropMessageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropMessageText: { flex: 1 },
  dropMessageTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.ink,
    marginBottom: 3,
  },
  dropMessageDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    lineHeight: 17,
  },
  sectionLabel: { marginBottom: theme.spacing.md },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  cardTouch: { width: '47.5%', marginBottom: 4 },
  card: {
    padding: 16,
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginBottom: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.ink,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    lineHeight: 17,
  },
});
