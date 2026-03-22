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
import { Header } from '../components/ui';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

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
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      <Header
        title="Create Bubble"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>What kind of bubble are you creating?</Text>

        <View style={styles.grid}>
          {CATEGORIES.map((cat) => {
            const iconName = CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.Other;
            return (
              <TouchableOpacity
                key={cat.name}
                style={styles.card}
                onPress={() => handleSelect(cat.name)}
                accessibilityRole="button"
                accessibilityLabel={cat.name}
              >
                <View style={styles.iconWrapper}>
                  <Ionicons name={iconName} size={28} color={theme.colors.brand} />
                </View>
                <Text style={styles.cardLabel}>{cat.name}</Text>
                <Text style={styles.cardDesc}>{cat.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgDeep },
  container: { padding: theme.spacing.xl, paddingBottom: 48 },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  card: {
    width: '47.5%',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    padding: 16,
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  iconWrapper: {
    marginBottom: theme.spacing.sm,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
});
