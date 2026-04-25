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
import {
  getBubble,
  getBubbleMessages,
  sendBubbleMessage,
  getBubbleMembers,
  leaveBubble,
  reportBubble,
} from '../api/bubbles';
import { blockUser, reportUser } from '../api/chat';
import { resolvePhotoUrl } from '../lib/photoUrl';
import { theme } from '../theme';
import { Header, Avatar, EmptyState, Button } from '../components/ui';
import { timeRemaining } from '../utils/timeFormatters';
import { fadeInUp, fadeInUpStyle } from '../utils/animations';
import SkyBackground from '../components/visual/SkyBackground';
import BubbleField from '../components/visual/BubbleField';

const POLL_INTERVAL = 4000;

// Animated message row — each item gets its own entrance on mount
function MessageRow({ item, styles }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeInUp(anim, { duration: 220 }).start();
  }, [anim]);

  return (
    <Animated.View style={fadeInUpStyle(anim, 10)}>
      <View style={styles.msgRow}>
        <Avatar name={item.sender_display_name} size={32} style={styles.msgAvatarSpacing} />
        <View style={styles.msgContent}>
          <Text style={styles.msgSender}>{item.sender_display_name || 'Someone'}</Text>
          <View style={styles.msgBubble}>
            <Text style={styles.msgBody}>{item.body}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

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
  const enterAnim = useRef(new Animated.Value(0)).current;

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
        fadeInUp(enterAnim).start();
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

  function handleReportBubble() {
    Alert.prompt
      ? Alert.prompt('Report Bubble', 'Why are you reporting this bubble?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Report',
            style: 'destructive',
            onPress: async (reason) => {
              if (!reason?.trim()) return;
              try {
                await reportBubble(bubbleId, reason.trim());
                Alert.alert('Reported', 'Thank you. We will review this bubble.');
              } catch { /* ignore */ }
            },
          },
        ])
      : (async () => {
          try {
            await reportBubble(bubbleId, 'Reported from chat');
            Alert.alert('Reported', 'Thank you. We will review this bubble.');
          } catch { /* ignore */ }
        })();
  }

  function handleBlockMember(userId, displayName) {
    Alert.alert('Block User', `Block ${displayName || 'this user'}? You won't see each other in any bubbles.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockUser(userId);
            Alert.alert('Blocked', `${displayName || 'User'} has been blocked.`);
          } catch { /* ignore */ }
        },
      },
    ]);
  }

  function handleReportMember(userId, displayName) {
    Alert.alert('Report User', `Report ${displayName || 'this user'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportUser(userId, 'Reported from bubble chat');
            Alert.alert('Reported', 'Thank you. We will review this report.');
          } catch { /* ignore */ }
        },
      },
    ]);
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
        <EmptyState
          icon="time-outline"
          title="This bubble has ended"
          subtitle="Bubbles are temporary by design."
          ctaTitle="Go Back"
          onCtaPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  function renderMessage({ item }) {
    return <MessageRow item={item} styles={styles} />;
  }

  return (
    <SkyBackground variant="dusk">
      <BubbleField seed={5} />
    <Animated.View style={[styles.flex, fadeInUpStyle(enterAnim)]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Header
          title={bubbleTitle || bubble?.title}
          subtitle={`${members.length} member${members.length !== 1 ? 's' : ''} · ${timeRemaining(bubble?.expires_at)}`}
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity onPress={() => setShowMembers(!showMembers)} style={styles.headerRightBtn}>
              <Ionicons
                name={showMembers ? 'chatbubbles-outline' : 'people-outline'}
                size={22}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          }
        />

        {showMembers ? (
          <FlatList
            data={members}
            keyExtractor={(m) => m.user_id}
            renderItem={({ item }) => {
              const memberPhoto = item.photos?.[0] ? resolvePhotoUrl(item.photos[0]) : null;
              return (
                <View style={styles.memberRow}>
                  <Avatar uri={memberPhoto} name={item.display_name} size={40} style={styles.memberAvatarSpacing} />
                  <Text style={styles.memberName}>{item.display_name || 'Someone'}</Text>
                  <View style={styles.memberActions}>
                    <TouchableOpacity
                      onPress={() => handleReportMember(item.user_id, item.display_name)}
                      style={styles.memberActionBtn}
                    >
                      <Text style={styles.memberActionText}>Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleBlockMember(item.user_id, item.display_name)}
                      style={styles.memberActionBtn}
                    >
                      <Text style={[styles.memberActionText, { color: theme.colors.error }]}>Block</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.membersList}
            style={styles.membersContainer}
            ListFooterComponent={
              <View style={styles.membersFooter}>
                <Button
                  title="Report Bubble"
                  variant="ghost"
                  size="md"
                  onPress={handleReportBubble}
                  style={styles.reportBubbleBtn}
                />
                <Button
                  title="Leave Bubble"
                  variant="danger"
                  size="md"
                  onPress={handleLeave}
                  style={styles.leaveBtn}
                />
              </View>
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
              style={styles.messagesContainer}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <EmptyState
                  icon="chatbubble-outline"
                  title="No messages yet"
                  subtitle="Say hi to start the conversation."
                  style={styles.emptyChatState}
                />
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
                  <Ionicons name="send" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </Animated.View>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgDeep, padding: 32 },

  // Header right action
  headerRightBtn: { padding: 8 },

  // Messages
  messagesContainer: { flex: 1 },
  messagesList: { padding: 16, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-start' },
  msgAvatarSpacing: { marginRight: 10, marginTop: 2 },
  msgContent: { flex: 1 },
  msgSender: { fontSize: 12, fontWeight: '600', color: theme.colors.inkMuted, marginBottom: 4 },
  msgBubble: {
    backgroundColor: 'rgba(255,255,255,0.68)',
    borderRadius: theme.radii.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'flex-start',
    maxWidth: '88%',
    ...theme.shadows.card,
  },
  msgBody: { fontSize: 15, color: theme.colors.ink, lineHeight: 20 },

  // Compose
  composeBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    borderTopWidth: 1.5,
    borderTopColor: theme.colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.75)',
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
    marginLeft: 10,
    width: 42,
    height: 42,
    backgroundColor: theme.colors.skyDeep,
    borderRadius: theme.radii.pill,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.buttonPress,
  },
  sendBtnDisabled: { opacity: 0.4 },

  // Empty chat state
  emptyChatState: { paddingTop: 60 },

  // Members
  membersContainer: { flex: 1 },
  membersList: { padding: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  memberAvatarSpacing: { marginRight: 12 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '500', color: theme.colors.ink },

  // Member actions
  memberActions: { flexDirection: 'row', gap: 12 },
  memberActionBtn: { padding: 4 },
  memberActionText: { fontSize: 13, color: theme.colors.textMuted, fontWeight: '500' },

  // Members footer
  membersFooter: { marginTop: 24, gap: 8 },
  reportBubbleBtn: { marginBottom: 4 },
  leaveBtn: {},
});
