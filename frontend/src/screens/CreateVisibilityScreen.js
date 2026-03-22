import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Header } from '../components/ui';
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';

const VISIBILITY_OPTIONS = [
  {
    key: 'public',
    icon: 'globe-outline',
    title: 'Public',
    desc: 'Anyone nearby can see and join',
  },
  {
    key: 'friends',
    icon: 'people-outline',
    title: 'Friends Only',
    desc: 'Only your connections can join',
  },
  {
    key: 'invite',
    icon: 'mail-outline',
    title: 'Invite Only',
    desc: 'Only people you invite can join',
  },
];

export default function CreateVisibilityScreen({ navigation, route }) {
  const params = route.params;
  const [visibility, setVisibility] = useState('public');

  const enterAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeInUp(enterAnim, { duration: 320 }).start();
  }, []);

  function handleNext() {
    navigation.navigate('CreatePreview', { ...params, visibility });
  }

  return (
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      <Header
        title="Visibility"
        subtitle="Step 3 of 4"
        onBack={() => navigation.goBack()}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Who can see and join your bubble?</Text>

        <View style={styles.optionList}>
          {VISIBILITY_OPTIONS.map((opt) => {
            const isSelected = visibility === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => setVisibility(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                  <Ionicons
                    name={opt.icon}
                    size={24}
                    color={isSelected ? theme.colors.brand : theme.colors.textSecondary}
                  />
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                    {opt.title}
                  </Text>
                  <Text style={styles.cardDesc}>{opt.desc}</Text>
                </View>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={theme.colors.brand}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Button
          title="Next"
          onPress={handleNext}
          size="lg"
          style={styles.nextBtn}
        />
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
  },
  optionList: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    padding: 16,
    gap: 14,
  },
  cardSelected: {
    borderColor: theme.colors.brand,
    backgroundColor: theme.colors.brandMuted,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(123,97,255,0.2)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: theme.colors.brand,
  },
  cardDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  nextBtn: { marginTop: 32 },
});
