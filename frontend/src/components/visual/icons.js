import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

export function BackIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PlusIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function SearchIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function HomeIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-6H9v6H5a2 2 0 01-2-2v-9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function CamIcon({ size = 24, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12.5" r="3.5" stroke={color} strokeWidth="1.8" />
      <Path d="M8 6l1.5-2h5L16 6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function HeartIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5 6 5c2 0 3.5 1.2 4 2.5C10.5 6.2 12 5 14 5c3.5 0 5 4 3.5 7-2.5 4.5-9.5 9-9.5 9z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M4 21c0-4 4-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function ChatIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12c0 4-4 7-9 7-1.3 0-2.5-.2-3.6-.5L4 20l1.2-3.5C3.8 15.3 3 13.7 3 12c0-4 4-7 9-7s9 3 9 7z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function MapIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M9 4v14M15 6v14" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 10a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ShieldIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function MoreIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="5" cy="12" r="1.8" />
      <Circle cx="12" cy="12" r="1.8" />
      <Circle cx="19" cy="12" r="1.8" />
    </Svg>
  );
}

export function ArrowIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 5l7 7-7 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </Svg>
  );
}

export function CheckIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12l5 5L20 7" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PinIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s-7-7-7-12a7 7 0 0114 0c0 5-7 12-7 12z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Circle cx="12" cy="9" r="2.5" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ClockIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function EyeIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function MicIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="12" rx="3" stroke={color} strokeWidth="1.8" />
      <Path d="M5 11c0 4 3 7 7 7s7-3 7-7M12 18v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function SendIcon({ size = 18, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SettingsIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      <Path d="M19 12a7 7 0 00-.2-1.6l2-1.6-2-3.4-2.4.8A7 7 0 0014 4.6L13.6 2h-3.2L10 4.6a7 7 0 00-2.4 1.4l-2.4-.8-2 3.4 2 1.6A7 7 0 005 12c0 .5.1 1.1.2 1.6l-2 1.6 2 3.4 2.4-.8A7 7 0 0010 19.4L10.4 22h3.2l.4-2.6a7 7 0 002.4-1.4l2.4.8 2-3.4-2-1.6c.1-.5.2-1.1.2-1.6z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function MusicIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M9 18V6l12-2v12" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18" cy="16" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function CoffeeIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8h13v6a5 5 0 01-5 5H9a5 5 0 01-5-5V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M17 10h2a2 2 0 010 4h-2M7 4v2M11 4v2M15 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function RunIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="13" cy="5" r="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 22l3-6 3-2-2-3 4-2 3 3M4 14h4l3 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function FireIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-2 1-3 2-4-1 0 0 2 3 3M9 17a3 3 0 006 0" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function BlockIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M5 5l14 14" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}

export function ImageIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="9" cy="10" r="1.8" stroke={color} strokeWidth="1.8" />
      <Path d="M4 18l5-5 4 4 3-3 4 4" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </Svg>
  );
}

export function LogoutIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M10 4H5a2 2 0 00-2 2v12a2 2 0 002 2h5M16 8l4 4-4 4M20 12H10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function GlobeIcon({ size = 22, color = '#0E1A24' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" stroke={color} strokeWidth="1.8" />
    </Svg>
  );
}
