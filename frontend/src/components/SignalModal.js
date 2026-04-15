import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sendSignal } from '../api/signals';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { Avatar, Button } from '../components/ui';
import { theme } from '../theme';
import { springScale } from '../utils/animations';

export default function SignalModal({ visible, user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      setSent(false);
      setLoading(false);
      springScale(scaleAnim, 1, { speed: 22, bounciness: 8 }).start();
    } else {
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  useEffect(() => {
    if (sent) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sent]);

  async function handleSend() {
    if (loading || sent || !user) return;
    setLoading(true);
    try {
      const signal = await sendSignal(user.id);
      setSent(true);
      onSuccess && onSuccess(signal);
    } catch {
      // silently fail — user can retry
    } finally {
      setLoading(false);
    }
  }

  const photoUri = user?.photos?.[0] ? resolvePhotoUrl(user.photos[0]) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={!loading && !sent ? onClose : undefined}
      >
        <Animated.View
          style={[styles.card, { transform: [{ scale: scaleAnim }] }]}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {sent ? (
              <View style={styles.successContent}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={theme.colors.success} />
                </View>
                <Text style={styles.successTitle}>Signal Sent!</Text>
                <Text style={styles.successSubtitle}>
                  {user?.display_name || 'They'} will see your interest
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.avatarWrap}>
                  <Avatar uri={photoUri} name={user?.display_name} size={80} />
                </View>
                <Text style={styles.userName}>{user?.display_name || 'Someone'}</Text>
                <Text style={styles.prompt}>Send a Signal?</Text>
                <Text style={styles.subtext}>
                  Let them know you're interested. They won't know unless they signal you back.
                </Text>
                <Button
                  title={loading ? 'Sending...' : 'Send Signal'}
                  variant="primary"
                  size="lg"
                  loading={loading}
                  onPress={handleSend}
                  style={styles.sendBtn}
                  icon={
                    !loading ? (
                      <Ionicons name="flash" size={18} color="#fff" />
                    ) : undefined
                  }
                />
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text style={styles.cancelText}>Not now</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
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
    maxWidth: 340,
    backgroundColor: theme.colors.bgSurface,
    borderRadius: theme.radii.xl,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    ...theme.shadows.card,
  },
  avatarWrap: {
    marginBottom: 16,
    alignSelf: 'center',
    ...theme.shadows.glow,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.brand,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  sendBtn: {
    width: '100%',
  },
  cancelBtn: {
    marginTop: 14,
    padding: 8,
  },
  cancelText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});
