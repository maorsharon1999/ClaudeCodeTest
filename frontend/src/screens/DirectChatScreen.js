import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMessages, sendMessage, blockUser, reportUser } from '../api/chat';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';
import { Header, Avatar, EmptyState, Toast } from '../components/ui';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';

const POLL_INTERVAL = 4000;

// Single message row — own messages right-aligned, others left with Avatar
function MessageRow({ item, isOwn, styles }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeInUp(anim, { duration: 220 }).start();
  }, [anim]);

  if (isOwn) {
    return (
      <Animated.View style={[fadeInUpStyle(anim, 8), styles.ownRow]}>
        <View style={styles.ownBubble}>
          <Text style={styles.ownText}>{item.body}</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[fadeInUpStyle(anim, 8), styles.otherRow]}>
      <Avatar
        uri={item.sender_photo ? resolvePhotoUrl(item.sender_photo) : null}
        name={item.sender_display_name}
        size={32}
        style={styles.msgAvatar}
      />
      <View style={styles.otherContent}>
        <Text style={styles.senderName}>{item.sender_display_name || 'Someone'}</Text>
        <View style={styles.otherBubble}>
          <Text style={styles.otherText}>{item.body}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function DirectChatScreen({ route, navigation }) {
  const { threadId, userName, otherUserId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const pollRef = useRef(null);
  const flatListRef = useRef(null);
  const enterAnim = useRef(new Animated.Value(0)).current;
  // Track current user's messages by id — server should return sender_is_self or we use a heuristic
  const [currentUserId, setCurrentUserId] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }

  useEffect(() => {
    async function init() {
      try {
        const { messages: msgs } = await getMessages(threadId, { limit: 50 });
        const ordered = msgs.slice().reverse();
        setMessages(ordered);
        // Determine current user heuristic: find sender_is_self field or use first sender_id
        // The API may return sender_is_self; if not, we store it after sending
        const selfMsg = ordered.find((m) => m.sender_is_self);
        if (selfMsg) setCurrentUserId(selfMsg.sender_id);
      } catch {
        // non-fatal
      } finally {
        setLoading(false);
        fadeInUp(enterAnim).start();
      }
    }
    if (threadId) init();
  }, [threadId]);

  useFocusEffect(
    useCallback(() => {
      if (!threadId) return;
      pollRef.current = setInterval(async () => {
        try {
          const { messages: msgs } = await getMessages(threadId, { limit: 50 });
          const ordered = msgs.slice().reverse();
          setMessages(ordered);
        } catch {
          // ignore polling errors
        }
      }, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }, [threadId])
  );

  async function handleSend() {
    const body = text.trim();
    if (!body || sending || !threadId) return;
    setSending(true);
    try {
      const msg = await sendMessage(threadId, body);
      // Mark as own
      setCurrentUserId(msg.sender_id);
      setMessages((prev) => [...prev, { ...msg, sender_is_self: true }]);
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      showToast('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleVoiceNote() {
    showToast('Voice notes coming soon');
  }

  function handleOptionsMenu() {
    const displayName = userName || 'this user';
    Alert.alert(displayName, 'What would you like to do?', [
      {
        text: 'Report',
        onPress: () => {
          Alert.alert('Report User', `Report ${displayName}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Report',
              style: 'destructive',
              onPress: async () => {
                try {
                  await reportUser(otherUserId || '', 'Reported from DM');
                  showToast('Reported. Thank you.');
                } catch {
                  showToast('Could not submit report.');
                }
              },
            },
          ]);
        },
      },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Block User', `Block ${displayName}? You won't see each other.`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Block',
              style: 'destructive',
              onPress: async () => {
                try {
                  await blockUser(otherUserId || '');
                  navigation.goBack();
                } catch {
                  showToast('Could not block user.');
                }
              },
            },
          ]);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function renderMessage({ item }) {
    const isOwn = item.sender_is_self || (currentUserId && item.sender_id === currentUserId);
    return <MessageRow item={item} isOwn={isOwn} styles={styles} />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  return (
    <SkyBackground variant="sky">
      <BubbleField seed={51} />
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Header
          title={userName || 'Direct Message'}
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity onPress={handleOptionsMenu} style={styles.headerRightBtn}>
              <Ionicons name="ellipsis-horizontal" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          }
        />

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={[
            styles.messagesList,
            messages.length === 0 && styles.emptyList,
          ]}
          style={styles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <EmptyState
              icon="chatbubble-outline"
              title="No messages yet"
              subtitle="Start the conversation."
            />
          }
        />

        <View style={[styles.composeBar, theme.shadows.inputBar]}>
          <TouchableOpacity onPress={handleVoiceNote} style={styles.voiceBtn}>
            <Ionicons name="mic-outline" size={22} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TextInput
            style={styles.composeInput}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textFaint}
            value={text}
            onChangeText={setText}
            maxLength={1000}
            multiline
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Toast message={toastMsg} visible={toastVisible} />
    </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.bgDeep,
  },
  headerRightBtn: { padding: 8 },

  // Messages
  messagesContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },
  emptyList: { flex: 1, justifyContent: 'center' },

  // Own message (right-aligned, skyDeep)
  ownRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  ownBubble: {
    backgroundColor: theme.colors.skyDeep,
    borderRadius: theme.radii.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    maxWidth: '78%',
    ...theme.shadows.card,
  },
  ownText: {
    fontSize: 15,
    color: '#fff',
    lineHeight: 20,
  },

  // Other message (left-aligned, glass white)
  otherRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  msgAvatar: { marginRight: 8 },
  otherContent: { flex: 1 },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.inkMuted,
    marginBottom: 4,
    marginLeft: 2,
  },
  otherBubble: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: theme.radii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    maxWidth: '78%',
    ...theme.shadows.card,
  },
  otherText: {
    fontSize: 15,
    color: theme.colors.ink,
    lineHeight: 20,
  },

  // Compose bar
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  voiceBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  composeInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radii.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: theme.colors.ink,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  sendBtn: {
    marginLeft: 8,
    width: 42,
    height: 42,
    backgroundColor: theme.colors.skyDeep,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.buttonPress,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
