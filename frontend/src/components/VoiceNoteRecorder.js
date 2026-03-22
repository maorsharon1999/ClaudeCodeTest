import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { theme } from '../theme';
import { pulseLoop } from '../utils/animations';

const MAX_DURATION_S = 60;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VoiceNoteRecorder({ onSend, onCancel, visible }) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const pulseRef = useRef(null);

  useEffect(() => {
    if (!visible) {
      // Clean up if hidden mid-recording
      stopAndDiscard();
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      stopAndDiscard();
      clearInterval(timerRef.current);
    };
  }, []);

  async function stopAndDiscard() {
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // ignore
      }
      setRecording(null);
    }
    setIsRecording(false);
    setElapsed(0);
    clearInterval(timerRef.current);
    if (pulseRef.current) {
      pulseRef.current.stop();
    }
  }

  async function startRecording() {
    setError('');
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setError('Microphone permission denied');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setElapsed(0);

      // Start pulse animation
      pulseRef.current = pulseLoop(pulseAnim, { minOpacity: 0.3, maxOpacity: 1, duration: 600 });
      pulseRef.current.start();

      // Timer
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= MAX_DURATION_S) {
            finishRecording(rec, MAX_DURATION_S);
            return MAX_DURATION_S;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (e) {
      setError('Could not start recording');
    }
  }

  async function finishRecording(rec, durationS) {
    clearInterval(timerRef.current);
    if (pulseRef.current) pulseRef.current.stop();

    try {
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      setRecording(null);
      setIsRecording(false);
      setElapsed(0);
      onSend && onSend({ uri, durationS: durationS || elapsed });
    } catch {
      setError('Recording failed');
    }
  }

  async function handleStopSend() {
    if (!recording) return;
    await finishRecording(recording, elapsed);
  }

  async function handleCancel() {
    await stopAndDiscard();
    onCancel && onCancel();
  }

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
        <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.center}>
        {isRecording ? (
          <>
            <Animated.View style={[styles.recDot, { opacity: pulseAnim }]} />
            <Text style={styles.duration}>{formatDuration(elapsed)}</Text>
            <Text style={styles.hint}>Recording...</Text>
          </>
        ) : (
          <Text style={styles.hint}>Tap mic to record</Text>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <TouchableOpacity
        onPress={isRecording ? handleStopSend : startRecording}
        style={[styles.micBtn, isRecording && styles.micBtnRecording]}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Stop and send voice note' : 'Start recording'}
      >
        <Ionicons
          name={isRecording ? 'stop' : 'mic'}
          size={26}
          color={isRecording ? '#fff' : theme.colors.brand}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bgSurface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderDefault,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    gap: 12,
  },
  cancelBtn: {
    padding: 4,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.error,
  },
  duration: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    minWidth: 36,
  },
  hint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  error: {
    fontSize: 13,
    color: theme.colors.error,
  },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.brandMuted,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micBtnRecording: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
});
