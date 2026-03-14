import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMessages, sendMessage, blockUser, reportUser, uploadVoiceNote } from '../api/chat';
import Toast from '../components/Toast';
import VoiceNoteBubble from '../components/VoiceNoteBubble';
import VoiceNoteRecorder from '../components/VoiceNoteRecorder';
import { theme } from '../theme';

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

export default function ThreadScreen({ route, navigation }) {
  const { threadId, displayName, otherUserId, otherUserPhoto } = route.params || {};
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Entrance animation
  const enterAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enterAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, []);
  const enterStyle = {
    opacity: enterAnim,
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
  };

  const listRef = useRef(null);

  function showToast(msg) {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }

  const loadMessages = useCallback(async () => {
    try {
      const { messages: data, has_more } = await getMessages(threadId);
      setMessages(data);
      setHasMore(has_more);
    } catch {
      showToast('Could not load messages. Please try again.');
    }
  }, [threadId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
      const interval = setInterval(async () => {
        try {
          const { messages: latest } = await getMessages(threadId);
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newOnes = latest.filter(m => !existingIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return [...prev, ...newOnes];
          });
        } catch {
          // silent — poll failure should not disrupt the UI
        }
      }, 5000);
      return () => clearInterval(interval);
    }, [threadId])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 80);
    }
  }, [messages]);

  async function loadOlderMessages() {
    if (!hasMore || loadingOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0];
      const { messages: older, has_more } = await getMessages(threadId, { before: oldest.id });
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newOnes = older.filter(m => !existingIds.has(m.id));
        return [...newOnes, ...prev];
      });
      setHasMore(has_more);
    } catch {
      // silent — user can scroll again to retry
    } finally {
      setLoadingOlder(false);
    }
  }

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;

    const tempId = 'temp-' + Date.now();
    const optimistic = {
      id: tempId,
      body: text,
      sent_at: new Date().toISOString(),
      is_mine: true,
    };

    setInputText('');
    setMessages((prev) => [...prev, optimistic]);
    setSending(true);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const real = await sendMessage(threadId, text);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? real : m)));
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showToast('Could not send message. Try again.');
    } finally {
      setSending(false);
    }
  }

  async function handleSendVoiceNote({ uri, durationS }) {
    setIsRecording(false);
    try {
      const msg = await uploadVoiceNote(threadId, uri, durationS);
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch {
      showToast('Could not send voice note. Please try again.');
    }
  }

  function submitReport(reason) {
    reportUser(otherUserId, reason)
      .then(() => showToast('Report submitted. Thank you.'))
      .catch(() => showToast('Could not submit report. Try again.'));
  }

  function handleReport() {
    Alert.alert('Report ' + displayName, 'What is the issue?', [
      { text: 'Inappropriate content', onPress: () => submitReport('Inappropriate content') },
      { text: 'Spam', onPress: () => submitReport('Spam') },
      { text: 'Harassment', onPress: () => submitReport('Harassment') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleBlock() {
    Alert.alert(
      'Block ' + displayName + '?',
      'They will no longer see you and you will no longer see them.',
      [
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(otherUserId);
              navigation.goBack();
            } catch (err) {
              showToast('Could not block user. Try again.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }

  function showMenu() {
    Alert.alert('Options', null, [
      { text: 'Block ' + displayName, style: 'destructive', onPress: handleBlock },
      { text: 'Report ' + displayName, onPress: handleReport },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {otherUserPhoto ? (
            <Image
              source={{ uri: otherUserPhoto }}
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }}
            />
          ) : (
            <View
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.bgDim, marginRight: 8 }}
            />
          )}
          <Text style={{ fontSize: 17, fontWeight: '600', color: theme.colors.textPrimary }}>
            {displayName}
          </Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={showMenu} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 22, color: '#555' }}>{'⋯'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, displayName, otherUserId, otherUserPhoto]);

  function renderMessage({ item }) {
    const isMine = item.is_mine;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        {item.voice_note_url ? (
          <VoiceNoteBubble
            url={item.voice_note_url}
            durationS={item.voice_note_duration_s}
            isOwn={isMine}
          />
        ) : (
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
              {item.body}
            </Text>
            <Text style={isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs}>
              {formatTime(item.sent_at)}
            </Text>
          </View>
        )}
      </View>
    );
  }

  const canSend = inputText.trim().length > 0 && !sending;
  const showMicButton = inputText.trim().length === 0 && !isRecording;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 0}
    >
    <Animated.View style={[styles.innerContainer, enterStyle]}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        onEndReached={loadOlderMessages}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          loadingOlder
            ? <ActivityIndicator size="small" color={theme.colors.brand} style={{ paddingVertical: 8 }} />
            : null
        }
      />

      {isRecording ? (
        <VoiceNoteRecorder
          onCancel={() => setIsRecording(false)}
          onSend={handleSendVoiceNote}
        />
      ) : (
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textFaint}
            maxLength={1000}
            multiline
            numberOfLines={1}
            returnKeyType="default"
            accessibilityLabel="Message input"
          />
          {showMicButton ? (
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={() => setIsRecording(true)}
              accessibilityRole="button"
              accessibilityLabel="Record voice note"
            >
              <Text style={styles.sendBtnText}>{'\uD83C\uDFA4'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendBtnText}>Send</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgBase },
  innerContainer: { flex: 1 },
  list: { padding: 12, paddingBottom: 8 },
  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleMine: { backgroundColor: theme.colors.brand, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: theme.colors.bgDim, borderBottomLeftRadius: 4 },
  bubbleTextMine: { color: '#fff', fontSize: 15, lineHeight: 21 },
  bubbleTextTheirs: { color: theme.colors.textBody, fontSize: 15, lineHeight: 21 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 4, textAlign: 'right' },
  bubbleTimeTheirs: { color: theme.colors.textFaint, fontSize: 11, marginTop: 4, textAlign: 'left' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgBase,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    backgroundColor: theme.colors.bgWash,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: theme.colors.textBody,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: theme.colors.brand,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: theme.colors.disabled },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
