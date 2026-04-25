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
import { theme } from '../theme';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';
import GlassCard from '../components/visual/GlassCard';
import GlassButton from '../components/visual/GlassButton';
import GlassChip from '../components/visual/GlassChip';
import ScreenHeader from '../components/visual/ScreenHeader';

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
    <SkyBackground variant="sky">
      <BubbleField />
      <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
        <ScreenHeader
          title="Who can see"
          onBack={() => navigation.goBack()}
          right={<GlassChip label="4 / 5" />}
        />
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Set the surface.</Text>
          <Text style={styles.subtitle}>Who can see and join your bubble?</Text>

          <View style={styles.optionList}>
            {VISIBILITY_OPTIONS.map((opt) => {
              const isSelected = visibility === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setVisibility(opt.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <GlassCard style={[styles.card, isSelected && styles.cardSelected]}>
                    <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                      <Ionicons
                        name={opt.icon}
                        size={24}
                        color={isSelected ? theme.colors.skyDeep : theme.colors.inkMuted}
                      />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={[styles.cardTitle, isSelected && styles.cardTitleSelected]}>
                        {opt.title}
                      </Text>
                      <Text style={styles.cardDesc}>{opt.desc}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.radioFill}>
                        <View style={styles.radioInner} />
                      </View>
                    )}
                    {!isSelected && <View style={styles.radioEmpty} />}
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>

          <GlassButton
            label="Next"
            onPress={handleNext}
            variant="primary"
            size="lg"
            style={styles.nextBtn}
          />
        </ScrollView>
      </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { padding: theme.spacing.xl, paddingBottom: 100 },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.ink,
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.inkMuted,
    marginBottom: theme.spacing.xl,
  },
  optionList: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: theme.colors.skyDeep,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.glassTint,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxSelected: {
    backgroundColor: 'rgba(93,144,191,0.15)',
    borderColor: theme.colors.skyDeep,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.ink,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: theme.colors.skyDeep,
  },
  cardDesc: {
    fontSize: 12,
    color: theme.colors.inkMuted,
    lineHeight: 17,
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.inkGhost,
  },
  radioFill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.skyDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.skyDeep,
  },
  nextBtn: { marginTop: 32 },
});
