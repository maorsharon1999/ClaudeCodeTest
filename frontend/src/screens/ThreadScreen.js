import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMessages, sendMessage, blockUser, reportUser } from '../api/chat';

function Toast({ message, visible }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message, opacity]);

  return (
    <Animated.View style={[toastStyles.toast, { opacity }]} pointerEvents="none">
      <Text style={toastStyles.toastText}>{message}</Text>
    </Animated.View>
  );
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return hh + ':' + mm;
}

export default function ThreadScreen({ route, navigation }) {
  const { threadId, displayName, otherUserId } = route.params || {};

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastKey, setToastKey] = useState(0);

  const listRef = useRef(null);

  function showToast(msg) {
    setToastMsg(msg);
    setToastKey((k) => k + 1);
  }

  const loadMessages = useCallback(async () => {
    try {
      const data = await getMessages(threadId);
      setMessages(data);
    } catch (err) {
      showToast('Could not load messages. Please try again.');
    }
  }, [threadId]);

  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages])
  );

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 80);
    }
  }, [messages]);

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
      headerRight: () => (
        <TouchableOpacity onPress={showMenu} style={{ marginRight: 16 }}>
          <Text style={{ fontSize: 22, color: '#555' }}>{'⋯'}</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, displayName, otherUserId]);

  function renderMessage({ item }) {
    const isMine = item.is_mine;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
            {item.body}
          </Text>
          <Text style={isMine ? styles.bubbleTimeMine : styles.bubbleTimeTheirs}>
            {formatTime(item.sent_at)}
          </Text>
        </View>
      </View>
    );
  }

  const canSend = inputText.trim().length > 0 && !sending;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#aaa"
          maxLength={1000}
          multiline
          numberOfLines={1}
          returnKeyType="default"
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>

      <Toast key={toastKey} message={toastMsg} visible={!!toastMsg} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  bubbleMine: { backgroundColor: '#6C47FF', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 4 },
  bubbleTextMine: { color: '#fff', fontSize: 15, lineHeight: 21 },
  bubbleTextTheirs: { color: '#222', fontSize: 15, lineHeight: 21 },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 4, textAlign: 'right' },
  bubbleTimeTheirs: { color: '#aaa', fontSize: 11, marginTop: 4, textAlign: 'left' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ebebeb',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 96,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#222',
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: '#6C47FF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7C7CC' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

const toastStyles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    left: 24,
    right: 24,
    backgroundColor: '#323232',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14 },
});
