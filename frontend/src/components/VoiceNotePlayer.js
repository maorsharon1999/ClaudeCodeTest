import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { theme } from '../theme';

export default function VoiceNotePlayer({ uri, durationS }) {
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(durationS || 0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  async function handlePlayPause() {
    if (playing && sound) {
      await sound.pauseAsync();
      setPlaying(false);
      return;
    }

    if (sound) {
      await sound.playAsync();
      setPlaying(true);
      return;
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackUpdate
      );
      setSound(newSound);
      setPlaying(true);
    } catch {
      // ignore audio errors
    }
  }

  function onPlaybackUpdate(status) {
    if (!status.isLoaded) return;
    const pos = (status.positionMillis || 0) / 1000;
    const dur = (status.durationMillis || durationS * 1000) / 1000;
    setPosition(pos);
    setDuration(dur);
    progressAnim.setValue(dur > 0 ? pos / dur : 0);

    if (status.didJustFinish) {
      setPlaying(false);
      setPosition(0);
      progressAnim.setValue(0);
    }
  }

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePlayPause} style={styles.playBtn}>
        <Ionicons
          name={playing ? 'pause' : 'play'}
          size={18}
          color={theme.colors.brand}
        />
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.progressBg}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.time}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 10,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brandMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    gap: 4,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.bgElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.brand,
  },
  time: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
