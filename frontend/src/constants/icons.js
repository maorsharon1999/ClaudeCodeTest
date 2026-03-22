// Semantic icon mapping → Ionicons names
// All icons from @expo/vector-icons Ionicons set (bundled with Expo)

export const ICONS = {
  // Navigation tabs
  radar: 'radio-outline',
  radarActive: 'radio',
  explore: 'compass-outline',
  exploreActive: 'compass',
  create: 'add-circle-outline',
  createActive: 'add-circle',
  inbox: 'chatbubbles-outline',
  inboxActive: 'chatbubbles',
  profile: 'person-outline',
  profileActive: 'person',

  // Actions
  back: 'chevron-back',
  close: 'close',
  settings: 'settings-outline',
  edit: 'create-outline',
  send: 'send',
  search: 'search-outline',
  filter: 'options-outline',
  share: 'share-outline',
  more: 'ellipsis-horizontal',
  add: 'add',
  remove: 'remove',
  locate: 'locate-outline',
  notification: 'notifications-outline',
  camera: 'camera-outline',
  image: 'image-outline',

  // Safety
  report: 'flag-outline',
  block: 'ban-outline',
  shield: 'shield-checkmark-outline',
  warning: 'warning-outline',

  // Status
  check: 'checkmark-circle',
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
  time: 'time-outline',
  people: 'people-outline',
  location: 'location-outline',

  // Categories
  social: 'chatbubble-ellipses-outline',
  study: 'book-outline',
  food: 'restaurant-outline',
  sports: 'football-outline',
  music: 'musical-notes-outline',
  nightlife: 'moon-outline',
  outdoors: 'leaf-outline',
  gaming: 'game-controller-outline',
  tech: 'laptop-outline',
  art: 'color-palette-outline',
  other: 'pin-outline',

  // Auth / onboarding
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  mail: 'mail-outline',
  lock: 'lock-closed-outline',
  chevronRight: 'chevron-forward',
  globe: 'globe-outline',

  // Empty states
  radioOff: 'radio-outline',
  chatEmpty: 'chatbubbles-outline',
  checkClean: 'checkmark-circle-outline',
};

// Map bubble category names → icon names
export const CATEGORY_ICONS = {
  Social: ICONS.social,
  Study: ICONS.study,
  'Food & Drinks': ICONS.food,
  Sports: ICONS.sports,
  Music: ICONS.music,
  Nightlife: ICONS.nightlife,
  Outdoors: ICONS.outdoors,
  Gaming: ICONS.gaming,
  Tech: ICONS.tech,
  Art: ICONS.art,
  Other: ICONS.other,
};
