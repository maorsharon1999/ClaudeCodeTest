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
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getBubble,
  getBubbleMessages,
  sendBubbleMessage,
  getBubbleMembers,
  leaveBubble,
} from '../api/bubbles';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';

const POLL_INTERVAL = 4000;

export default function BubbleChatScreen({ route, navigation }) {
  const { bubbleId, bubbleTitle } = route.params;
  const [bubble, setBubble] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [expired, setExpired] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);
  const flatListRef = useRef(null);

  // Fetch bubble info + initial messages
  useEffect(() => {
    async function init() {
      try {
        const [b, msgs, mems] = await Promise.all([
          getBubble(bubbleId),
          getBubbleMessages(bubbleId, { limit: 50 }),
          getBubbleMembers(bubbleId),
        ]);
        setBubble(b);
        setMessages(msgs.reverse());
        setMembers(mems);
        if (new Date(b.expires_at) < new Date()) {
          setExpired(true);
        }
      } catch {
        // bubble may have been deleted
        setExpired(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [bubbleId]);

  // Poll for new messages
  useFocusEffect(
    useCallback(() => {
      if (expired) return;
      pollRef.current = setInterval(async () => {
        try {
          const msgs = await getBubbleMessages(bubbleId, { limit: 50 });
          setMessages(msgs.reverse());

          // Check expiry
          const b = await getBubble(bubbleId);
          if (new Date(b.expires_at) < new Date()) {
            setExpired(true);
            clearInterval(pollRef.current);
          }
          setMembers(await getBubbleMembers(bubbleId));
        } catch {
          // ignore polling errors
        }
      }, POLL_INTERVAL);
      return () => clearInterval(pollRef.current);
    }, [bubbleId, expired])
  );

  function timeRemaining() {
    if (!bubble) return '';
    const diff = new Date(bubble.expires_at) - new Date();
    if (diff <= 0) return 'Expired';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  }

  async function handleSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const msg = await sendBubbleMessage(bubbleId, body);
      setMessages((prev) => [...prev, msg]);
      setText('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  async function handleLeave() {
    try {
      await leaveBubble(bubbleId);
    } catch {
      // ignore
    }
    navigation.goBack();
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.brand} />
      </View>
    );
  }

  if (expired) {
    return (
      <View style={styles.center}>
        <Text style={styles.expiredTitle}>This bubble has ended</Text>
        <Text style={styles.expiredSub}>Bubbles are temporary by design.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to Map</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderMessage({ item }) {
    return (
      <View style={styles.msgRow}>
        <View style={[styles.msgAvatar, styles.msgAvatarFallback]}>
          <Text style={styles.msgAvatarText}>{item.sender_display_name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <View style={styles.msgContent}>
          <Text style={styles.msgSender}>{item.sender_display_name || 'Someone'}</Text>
          <Text style={styles.msgBody}>{item.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack}>
          <Text style={styles.headerBackText}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{bubbleTitle || bubble?.title}</Text>
          <Text style={styles.headerSub}>
            {members.length} member{members.length !== 1 ? 's' : ''} · {timeRemaining()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowMembers(!showMembers)} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>{showMembers ? 'Chat' : 'Members'}</Text>
        </TouchableOpacity>
      </View>

      {showMembers ? (
        <FlatList
          data={members}
          keyExtractor={(m) => m.user_id}
          renderItem={({ item }) => {
            const memberPhoto = item.photos?.[0] ? resolvePhotoUrl(item.photos[0]) : null;
            return (
              <View style={styles.memberRow}>
                {memberPhoto ? (
                  <Image source={{ uri: memberPhoto }} style={styles.memberPhoto} />
                ) : (
                  <View style={[styles.memberPhoto, styles.memberPhotoFallback]}>
                    <Text style={styles.memberInitial}>{item.display_name?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                )}
                <Text style={styles.memberName}>{item.display_name || 'Someone'}</Text>
              </View>
            );
          }}
          contentContainerStyle={styles.membersList}
          ListFooterComponent={
            <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave}>
              <Text style={styles.leaveBtnText}>Leave Bubble</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet. Say hi!</Text>
              </View>
            }
          />
          <View style={[styles.composeBar, theme.shadows.inputBar]}>
            <TextInput
              style={styles.composeInput}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.textFaint}
              value={text}
              onChangeText={setText}
              maxLength={1000}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendBtnText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.bgBase },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgBase, padding: 32 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgSubtle,
  },
  headerBack: { padding: 8, marginRight: 8 },
  headerBackText: { fontSize: 22, color: theme.colors.brand, fontWeight: '600' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.textBody },
  headerSub: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  headerBtn: { padding: 8 },
  headerBtnText: { fontSize: 13, color: theme.colors.brand, fontWeight: '600' },

  // Messages
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14 },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10, backgroundColor: theme.colors.bgDim },
  msgAvatarFallback: { alignItems: 'center', justifyContent: 'center' },
  msgAvatarText: { fontSize: 13, fontWeight: '700', color: theme.colors.textMuted },
  msgContent: { flex: 1 },
  msgSender: { fontSize: 13, fontWeight: '600', color: theme.colors.textSecondary, marginBottom: 2 },
  msgBody: { fontSize: 15, color: theme.colors.textBody, lineHeight: 20 },

  // Compose
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.bgSubtle,
  },
  composeInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.borderDefault,
    borderRadius: theme.radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: theme.colors.textBody,
    backgroundColor: theme.colors.bgBase,
  },
  sendBtn: {
    marginLeft: 10,
    height: 40,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Empty state
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyChatText: { color: theme.colors.textMuted, fontSize: 15 },

  // Members
  membersList: { padding: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  memberPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: theme.colors.bgDim },
  memberPhotoFallback: { alignItems: 'center', justifyContent: 'center' },
  memberInitial: { fontSize: 16, fontWeight: '700', color: theme.colors.textMuted },
  memberName: { fontSize: 15, fontWeight: '500', color: theme.colors.textBody },

  // Leave
  leaveBtn: { marginTop: 24, padding: 14, alignItems: 'center' },
  leaveBtnText: { color: theme.colors.error, fontSize: 15, fontWeight: '600' },

  // Expired
  expiredTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.textBody, marginBottom: 8 },
  expiredSub: { fontSize: 15, color: theme.colors.textMuted, marginBottom: 24 },
  backBtn: {
    height: 48,
    paddingHorizontal: 32,
    backgroundColor: theme.colors.brand,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
