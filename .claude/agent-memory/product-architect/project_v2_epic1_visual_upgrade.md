---
name: V2 Epic 1 — Visual & Motion Upgrade
description: Plan for centralizing design tokens, extracting shared components, animated splash, and polishing all 9 screens
type: project
---

Visual & Motion Upgrade epic (V2 Epic 1) was scoped and planned on 2026-03-13.

**Why:** MVP shipped with all inline styles, no shared components, duplicate Toast implementations across 5 screens, and a placeholder splash. This epic addresses visual debt and brand cohesion before any new features land.

**How to apply:** When frontend-builder works on this epic, use the ordered steps below as the implementation sequence. Do not deviate into new product features. No Reanimated, no Lottie — core Animated API only for splash. expo-linear-gradient is the one permitted new dependency.

Key decisions locked in plan:
- theme.js is the single source of truth for all colors, spacing, radii, typography
- Three shared components: Button.js, Card.js, Toast.js (extracted from existing inline code)
- AnimatedSplash.js: floating bubbles using core Animated, not Reanimated
- Splash runs in RootNavigator loading state (replaces ActivityIndicator)
- HomeScreen big circle button gets a soft gradient shell (LinearGradient wrapping existing TouchableOpacity)
- Card elevation: shadow + subtle borderColor tweak only — no layout changes
- No functionality changes in any screen
