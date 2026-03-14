import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { theme } from '../theme';

const MAX_DURATION_S = 60;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export default function VoiceNoteRecorder({ onSend, onCancel }) {
  const [elapsed, setElapsed] = useState(0);
  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const didFinishRef = useRef(false);

  useEffect(() => {
    startRecording();
    return () => {
      clearInterval(timerRef.current);
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        onCancel();
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(s);
        if (s >= MAX_DURATION_S) {
          clearInterval(timerRef.current);
          stopAndSend(s);
        }
      }, 500);
    } catch {
      onCancel();
    }
  }

  async function stopAndSend(overrideDuration) {
    if (didFinishRef.current) return;
    didFinishRef.current = true;
    clearInterval(timerRef.current);

    const rec = recordingRef.current;
    if (!rec) {
      onCancel();
      return;
    }

    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      const durationS =
        overrideDuration !== undefined
          ? overrideDuration
          : Math.max(1, Math.round(elapsedMs / 1000));
      if (!uri || elapsedMs < 500) {
        onCancel();
        return;
      }
      onSend({ uri, durationS });
    } catch {
      onCancel();
    }
  }

  async function handleCancel() {
    if (didFinishRef.current) return;
    didFinishRef.current = true;
    clearInterval(timerRef.current);

    const rec = recordingRef.current;
    if (rec) {
      try {
        await rec.stopAndUnloadAsync();
      } catch {
        // discard silently
      }
    }
    onCancel();
  }

  return (
    <View style={styles.container}>
      <View style={styles.recordingIndicator}>
        <View style={styles.redDot} />
        <Text style={styles.timerText}>{formatDuration(elapsed)}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.cancelBtn]}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel voice note"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.sendBtn]}
          onPress={() => stopAndSend()}
          accessibilityRole="button"
          accessibilityLabel="Send voice note"
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgBase,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  redDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
    marginRight: theme.spacing.sm,
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textBody,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  btn: {
    borderRadius: theme.radii.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: theme.colors.bgDim,
  },
  sendBtn: {
    backgroundColor: theme.colors.brand,
  },
  cancelText: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  sendText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
