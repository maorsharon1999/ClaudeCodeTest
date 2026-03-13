import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { getAccessToken } from '../api/client';
import { theme } from '../theme';

// Module-level ref: only one voice note plays at a time across the whole chat list.
let activeSoundRef = null;

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + String(s).padStart(2, '0');
}

export default function VoiceNoteBubble({ url, durationS, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        if (activeSoundRef === soundRef.current) {
          activeSoundRef = null;
        }
      }
    };
  }, []);

  async function handlePlay() {
    try {
      // Stop any currently playing sound across all bubbles.
      if (activeSoundRef && activeSoundRef !== soundRef.current) {
        try {
          await activeSoundRef.stopAsync();
          await activeSoundRef.unloadAsync();
        } catch {
          // ignore — the other bubble's own unmount will clean up
        }
        activeSoundRef = null;
      }

      // Unload our own previous instance if present.
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      // expo-av cannot set custom HTTP headers, so we append the JWT as a
      // query param. The backend /voice-notes/:filename route accepts ?token=.
      const token = getAccessToken();
      const audioUri = token ? `${url}?token=${encodeURIComponent(token)}` : url;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      activeSoundRef = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync().catch(() => {});
          if (activeSoundRef === sound) activeSoundRef = null;
          soundRef.current = null;
        }
      });
    } catch {
      setIsPlaying(false);
    }
  }

  async function handlePause() {
    if (!soundRef.current) return;
    try {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } catch {
      // ignore
    }
  }

  const bgColor = isOwn ? theme.colors.brand : theme.colors.bgDim;
  const textColor = isOwn ? '#fff' : theme.colors.textBody;
  const iconColor = isOwn ? '#fff' : theme.colors.brand;

  return (
    <View style={[styles.bubble, { backgroundColor: bgColor }]}>
      <TouchableOpacity
        onPress={isPlaying ? handlePause : handlePlay}
        style={styles.playBtn}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        <Text style={[styles.playIcon, { color: iconColor }]}>
          {isPlaying ? '\u23F8' : '\u25B6'}
        </Text>
      </TouchableOpacity>
      <Text style={[styles.duration, { color: textColor }]}>
        {formatDuration(durationS || 0)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radii.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 100,
    maxWidth: '75%',
  },
  playBtn: {
    marginRight: theme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 18,
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
  },
});
