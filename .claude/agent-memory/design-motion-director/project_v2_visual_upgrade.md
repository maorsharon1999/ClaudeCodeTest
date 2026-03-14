---
name: v2_visual_upgrade
description: Visual and Motion Upgrade completed for Bubble V2 — design tokens, animated splash, orb pulse, entrance animations across all screens
type: project
---

The full Visual & Motion Upgrade was implemented on 2026-03-13.

**Why:** Bubble V2 needs a modern, premium, airy aesthetic — bubble-inspired but not childish, with elegant motion and consistent design language.

**What was done:**
- Created `frontend/src/theme.js` — single source of truth for colors, spacing, radii, shadows, typography
- Created `frontend/src/components/Toast.js` — unified Toast replacing 4 inline duplicates across screens
- RootNavigator: animated purple brand splash (5 floating white circles with staggered loops + wordmark scale-in 0.85→1.0)
- HomeScreen: orb pulse rings (2 rings, scale 1→1.5 + opacity 0.6→0, staggered 700ms), animated orb color (disabled→brand via Animated.Value interpolation, useNativeDriver false), entrance animation
- All 9 screens: 320ms fade + translateY(16→0) entrance animation on mount
- DiscoveryScreen: theme.shadows.card on cards, pill radius on signal button
- SignalsScreen: approve/decline radii via theme.radii.md
- ThreadScreen: outgoing bubble → theme.colors.brand, incoming → theme.colors.bgDim
- ChatsScreen: cardTime → theme.colors.textFaint, shadows on cards
- PhoneEntryScreen: title → theme.typography.displayMd, input → theme.radii.md
- OtpVerifyScreen: active OTP border and resend text → theme.colors.brand
- ProfileSetupScreen/ProfileEditScreen: heading → theme.typography.titleMd, chips → theme.colors.badgePurpleBg
- app.json: splash + Android adaptive icon backgroundColor → #6C47FF

**How to apply:** All future screen work should import from `../theme` and use the token system. Do not hardcode hex values that exist in the theme.
