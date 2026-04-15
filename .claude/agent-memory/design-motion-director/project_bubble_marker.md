---
name: BubbleMarker component
description: Premium 3D animated map marker for the Bubble app — profile photo in a shiny pulsing circle with pin tip
type: project
---

Implemented `BubbleMarker` component at `frontend/src/components/BubbleMarker.js` on 2026-03-14.

Replaces the previous flat 44px circle marker on the discovery map.

Key design decisions:
- SIZE = 56px circle with 3px outer ring + 1.5px white inner border
- 3D gloss achieved via an absolutely-positioned View (top-left semicircle, `rgba(255,255,255,0.32)`) — no gradient library needed
- Current user renders teal (`#00C9A7`) ring; other users render brand purple (`#6C47FF`)
- Downward pin tip (CSS triangle trick) anchored at `{ x: 0.5, y: 1.0 }` on every Marker
- 2s loop pulse animation: scale 1.0 -> 1.08 -> 1.0 on native thread
- `tracksViewChanges={false}` on every `<Marker>` — mandatory to prevent per-frame re-render on Android
- Profile photo sourced from `user.photos[0]` for nearby users; current user photo fetched once on mount via `getProfile()` in DiscoveryScreen

**Why:** Replace the flat marker with a premium visual that communicates Bubble's brand identity on the map.
**How to apply:** If iterating on map marker visuals, edit `BubbleMarker.js` directly. The shine overlay geometry (top-left arc) is the core of the 3D illusion — keep it.
