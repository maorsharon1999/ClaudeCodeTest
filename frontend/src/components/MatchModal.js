import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { Avatar, Button } from '../components/ui';
import { theme } from '../theme';
import { springScale, pulseLoop } from '../utils/animations';

// Animated decorative dot
function PulseDot({ size = 8, color = theme.colors.brand, delay = 0, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const opLoop = pulseLoop(opacity, { minOpacity: 0.2, maxOpacity: 0.8, duration: 1000 });
    const scLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.3, duration: 1000, useNativeDriver: true, delay }),
        Animated.timing(scale, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
      ])
    );
    opLoop.start();
    scLoop.start();
    return () => {
      opLoop.stop();
      scLoop.stop();
    };
  }, []);

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        },
        style,
      ]}
    />
  );
}

export default function MatchModal({ visible, user, onChat, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      springScale(scaleAnim, 1, { speed: 22, bounciness: 10 }).start();
    } else {
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  const photoUri = user?.photos?.[0] ? resolvePhotoUrl(user.photos[0]) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>

          {/* Decorative dots */}
          <PulseDot size={10} color={theme.colors.brand} style={styles.dot1} />
          <PulseDot size={7} color={theme.colors.pink} delay={300} style={styles.dot2} />
          <PulseDot size={9} color={theme.colors.cyan} delay={150} style={styles.dot3} />
          <PulseDot size={6} color={theme.colors.mint} delay={450} style={styles.dot4} />

          {/* Avatars */}
          <View style={styles.avatarsRow}>
            <View style={[styles.avatarWrap, theme.shadows.glow]}>
              <Avatar uri={photoUri} name={user?.display_name} size={72} />
            </View>
            <View style={styles.heartWrap}>
              <Ionicons name="flash" size={22} color={theme.colors.brand} />
            </View>
            {/* Placeholder for current user's avatar — shows a generic "you" avatar */}
            <View style={[styles.avatarWrap, theme.shadows.glow]}>
              <Avatar name="You" size={72} />
            </View>
          </View>

          <Text style={styles.title}>It's a Match!</Text>
          <Text style={styles.subtitle}>
            You and{' '}
            <Text style={styles.nameHighlight}>{user?.display_name || 'them'}</Text>
            {' '}are interested in each other
          </Text>

          <Button
            title="Start Chatting"
            variant="primary"
            size="lg"
            onPress={onChat}
            style={styles.chatBtn}
            icon={<Ionicons name="chatbubble-ellipses" size={18} color="#fff" />}
          />

          <TouchableOpacity onPress={onDismiss} style={styles.keepBtn}>
            <Text style={styles.keepText}>Keep Exploring</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.colors.bgOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.xl,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  // Decorative dots positioned absolutely
  dot1: { position: 'absolute', top: 24, left: 24 },
  dot2: { position: 'absolute', top: 40, right: 32 },
  dot3: { position: 'absolute', bottom: 80, left: 36 },
  dot4: { position: 'absolute', bottom: 60, right: 28 },

  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 0,
  },
  avatarWrap: {
    borderRadius: 36,
  },
  heartWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.brand,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.brand,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  nameHighlight: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  chatBtn: {
    width: '100%',
  },
  keepBtn: {
    marginTop: 16,
    padding: 8,
  },
  keepText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
});
