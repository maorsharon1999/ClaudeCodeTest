---
name: V2 Epic 3 — Voice Notes in Chat
description: Key decisions for adding voice note recording and playback to chat threads
type: project
---

Voice notes are in MVP scope as "voice-note chat". Epic 3 adds them to the existing chat architecture.

**Why:** Users in loud nightlife environments benefit from voice over typing. Short, push-to-talk style notes only.

**How to apply:** Keep voice notes a thin layer on top of the existing chat_messages table. No new tables. No separate media service in MVP.

## Key decisions

### Data model
- chat_messages gains two nullable columns: voice_note_url TEXT and voice_note_duration_s INTEGER
- body is relaxed to allow NULL but only when voice_note_url is present; CHECK enforced at DB level
- voice notes stored as uploaded files (e.g., S3 / Supabase Storage); URL stored in voice_note_url
- Duration captured client-side, validated server-side: max 60 seconds

### Upload flow
- Client records audio locally (expo-av), then POSTs multipart to POST /threads/:id/voice-notes
- Server receives file, validates duration_s (1–60), stores to file storage, returns { voice_note_url, voice_note_duration_s }
- Client then POSTs to existing POST /threads/:id/messages with body=null, voice_note_url, voice_note_duration_s
- Two-step (upload then message) keeps message send idempotent and avoids blocking text send on upload

### Backend endpoints added
- POST /threads/:id/voice-notes  — multipart upload; returns { voice_note_url, voice_note_duration_s }
- POST /threads/:id/messages — extended to accept voice_note_url + voice_note_duration_s (body nullable when voice fields present)
- GET /threads/:id/messages — extended response includes voice_note_url, voice_note_duration_s per message

### Frontend components
- VoiceNoteButton: microphone icon in ThreadScreen input bar (replaces Send when input is empty)
- VoiceNoteRecorder: press-and-hold record, release-to-send, tap X to cancel; shows live duration counter
- VoiceNoteBubble: replaces text bubble for voice messages; play/pause button + duration; no waveform in MVP
- No auto-play; playback is fully manual

### Rate limits
- POST /threads/:id/voice-notes: 10/hr per user (voice notes are heavier than text)

### Delivery order
1. backend-builder: migration 008, upload endpoint, extend chatService + messages endpoint
2. voice-chat-builder: VoiceNoteButton, VoiceNoteRecorder, VoiceNoteBubble, extend ThreadScreen
3. qa-test-engineer
4. trust-safety-reviewer (audio content = new moderation surface)

## Out of scope for Epic 3
- Waveform visualization
- Transcription
- Auto-play
- Voice note forwarding
- Push notification on voice note received (no push in MVP)
- Media content moderation (flag for future Epic)
