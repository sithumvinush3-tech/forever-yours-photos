import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  ArrowLeft,
  Camera,
  CloudSun,
  Film,
  Flower2,
  Heart,
  Moon,
  Music2,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Trees,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { SHOWCASE_ARTWORK } from '../data/seedData';
import { resolveCoverSrc, resolvePhotoSrc } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';
import type { GardenTimeOfDay, NavTab } from '../types';
import { gardenAudio, type ResolvedGardenMood } from '../utils/gardenAudio';

interface LivingGarden3DProps {
  onNavigate?: (tab: NavTab) => void;
}

type GardenBackdropStyle = 'video' | 'procedural';

const GARDEN_VIDEO_SRC =
  '/assets/aistudio/Simple_Dream_Home_Garden_Tour__AI-Generated____Relaxing_4K_Walk-through_71d5377a.mp4';
const VIDEO_LOOP_START_SEC = 3.2;
const VIDEO_LOOP_END_SEC = 295.2;

const VIDEO_CHAPTERS = [
  { label: 'Rose Gate', time: 3.2 },
  { label: 'Flower Path', time: 15.0 },
  { label: 'Rose Archway', time: 276.0 },
  { label: 'Petal Fountain', time: 290.2 },
];

type InteractivePopup =
  | {
      kind: 'whisper';
      title: string;
      message: string;
      accent: string;
    }
  | {
      kind: 'memory';
      title: string;
      date: string;
      location: string;
      caption: string;
      imageData: string;
    }
  | {
      kind: 'butterfly';
      message: string;
    };

interface MoodPreset {
  skyTop: THREE.Color;
  skyMid: THREE.Color;
  skyHorizon: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  sunColor: THREE.Color;
  sunIntensity: number;
  sunPos: THREE.Vector3;
  hemiSky: THREE.Color;
  hemiGround: THREE.Color;
  hemiIntensity: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  envIntensity: number;
  rayOpacity: number;
  cloudColor: THREE.Color;
  cloudOpacity: number;
  starOpacity: number;
  moonOpacity: number;
  fireflyOpacity: number;
  flowerGlow: number;
  dewIntensity: number;
  butterflyActivity: number;
  label: string;
  videoFilter: string;
  videoOverlayClass: string;
}

const MOOD_PRESETS: Record<ResolvedGardenMood, MoodPreset> = {
  morning: {
    skyTop: new THREE.Color('#7EB5E6'),
    skyMid: new THREE.Color('#F5C8B8'),
    skyHorizon: new THREE.Color('#FFE7C7'),
    fogColor: new THREE.Color('#FDE4D0'),
    fogDensity: 0.018,
    sunColor: new THREE.Color('#FFD29D'),
    sunIntensity: 2.35,
    sunPos: new THREE.Vector3(24, 14, -36),
    hemiSky: new THREE.Color('#FFE6CE'),
    hemiGround: new THREE.Color('#35583B'),
    hemiIntensity: 1.05,
    ambientColor: new THREE.Color('#FCE6DB'),
    ambientIntensity: 0.42,
    envIntensity: 0.72,
    rayOpacity: 0.28,
    cloudColor: new THREE.Color('#FFF0E2'),
    cloudOpacity: 0.76,
    starOpacity: 0.04,
    moonOpacity: 0.08,
    fireflyOpacity: 0.05,
    flowerGlow: 0.05,
    dewIntensity: 1.0,
    butterflyActivity: 0.85,
    label: 'Golden Sunrise & Morning Dew',
    videoFilter: 'brightness(1.04) saturate(1.1) sepia(0.1)',
    videoOverlayClass: 'bg-gradient-to-b from-[#FFD29D]/22 via-transparent to-[#FFF3E0]/18',
  },
  afternoon: {
    skyTop: new THREE.Color('#5A9FD8'),
    skyMid: new THREE.Color('#9ED0F5'),
    skyHorizon: new THREE.Color('#E8F5FE'),
    fogColor: new THREE.Color('#DFEFFB'),
    fogDensity: 0.014,
    sunColor: new THREE.Color('#FFF6DE'),
    sunIntensity: 2.75,
    sunPos: new THREE.Vector3(12, 34, -26),
    hemiSky: new THREE.Color('#CFE8FF'),
    hemiGround: new THREE.Color('#3C663F'),
    hemiIntensity: 1.25,
    ambientColor: new THREE.Color('#FFF7EE'),
    ambientIntensity: 0.48,
    envIntensity: 0.88,
    rayOpacity: 0.16,
    cloudColor: new THREE.Color('#FFFFFF'),
    cloudOpacity: 0.84,
    starOpacity: 0.0,
    moonOpacity: 0.0,
    fireflyOpacity: 0.0,
    flowerGlow: 0.03,
    dewIntensity: 0.45,
    butterflyActivity: 1.15,
    label: 'Sunlit Pastel Afternoon',
    videoFilter: 'brightness(1.02) saturate(1.08)',
    videoOverlayClass: 'bg-gradient-to-b from-[#9ED0F5]/14 via-transparent to-[#FFF9F2]/10',
  },
  evening: {
    skyTop: new THREE.Color('#5B3B6F'),
    skyMid: new THREE.Color('#C86D88'),
    skyHorizon: new THREE.Color('#FFB284'),
    fogColor: new THREE.Color('#F3A790'),
    fogDensity: 0.02,
    sunColor: new THREE.Color('#FF9F68'),
    sunIntensity: 2.25,
    sunPos: new THREE.Vector3(-22, 10, -40),
    hemiSky: new THREE.Color('#FFAE92'),
    hemiGround: new THREE.Color('#342238'),
    hemiIntensity: 0.92,
    ambientColor: new THREE.Color('#F5B3C4'),
    ambientIntensity: 0.38,
    envIntensity: 0.56,
    rayOpacity: 0.32,
    cloudColor: new THREE.Color('#FFC6B2'),
    cloudOpacity: 0.72,
    starOpacity: 0.25,
    moonOpacity: 0.35,
    fireflyOpacity: 0.48,
    flowerGlow: 0.22,
    dewIntensity: 0.4,
    butterflyActivity: 0.78,
    label: 'Golden-Hour Rose Sunset',
    videoFilter: 'brightness(0.94) saturate(1.16) hue-rotate(-6deg)',
    videoOverlayClass: 'bg-gradient-to-b from-[#C86D88]/26 via-[#FFB284]/16 to-[#3A192A]/22',
  },
  night: {
    skyTop: new THREE.Color('#090C24'),
    skyMid: new THREE.Color('#1B1D4A'),
    skyHorizon: new THREE.Color('#3A254F'),
    fogColor: new THREE.Color('#1D1739'),
    fogDensity: 0.022,
    sunColor: new THREE.Color('#B5D0FF'),
    sunIntensity: 1.05,
    sunPos: new THREE.Vector3(-14, 24, -42),
    hemiSky: new THREE.Color('#5A6BA8'),
    hemiGround: new THREE.Color('#182420'),
    hemiIntensity: 0.62,
    ambientColor: new THREE.Color('#4B4376'),
    ambientIntensity: 0.36,
    envIntensity: 0.28,
    rayOpacity: 0.04,
    cloudColor: new THREE.Color('#3B3D6B'),
    cloudOpacity: 0.42,
    starOpacity: 1.0,
    moonOpacity: 1.0,
    fireflyOpacity: 1.0,
    flowerGlow: 0.68,
    dewIntensity: 0.65,
    butterflyActivity: 0.42,
    label: 'Moonlit Fireflies & Glowing Blooms',
    videoFilter: 'brightness(0.56) contrast(1.08) saturate(0.82) hue-rotate(195deg)',
    videoOverlayClass: 'bg-gradient-to-b from-[#090C24]/60 via-[#1B1D4A]/40 to-[#140920]/55',
  },
};

function resolveLocalMood(selected: GardenTimeOfDay): ResolvedGardenMood {
  if (selected !== 'auto') return selected;
  const h = new Date().getHours();
  if (h >= 5 && h <= 10) return 'morning';
  if (h >= 11 && h <= 16) return 'afternoon';
  if (h >= 17 && h <= 19) return 'evening';
  return 'night';
}

function groundHeightAt(x: number, z: number): number {
  const distFromCenterPath = Math.abs(x - Math.sin(z * 0.12) * 1.8);
  const pathFlatten = Math.min(1, Math.max(0, (distFromCenterPath - 1.3) / 3.5));
  const gentleRoll =
    Math.sin(x * 0.14) * Math.cos(z * 0.13) * 0.42 +
    Math.sin(x * 0.05 + 1.2) * Math.sin(z * 0.06) * 0.65;
  const distantRise = Math.max(0, (-z - 18) * 0.08) + Math.max(0, (Math.abs(x) - 16) * 0.06);
  return gentleRoll * pathFlatten + distantRise - 0.85;
}

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const rendererStr = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|software|mesa offscreen|angle.*swiftshader/i.test(rendererStr);
  } catch {
    return true;
  }
}

function afterDraw(gl: WebGL2RenderingContext | WebGLRenderingContext | null, fn: () => void) {
  if (gl && 'fenceSync' in gl && typeof gl.fenceSync === 'function') {
    const gl2 = gl as WebGL2RenderingContext;
    const sync = gl2.fenceSync(gl2.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (sync) {
      const check = () => {
        const res = gl2.clientWaitSync(sync, 0, 0);
        if (res === gl2.TIMEOUT_EXPIRED) {
          setTimeout(check, 2);
        } else {
          gl2.deleteSync(sync);
          requestAnimationFrame(fn);
        }
      };
      setTimeout(check, 2);
      return;
    }
  }
  requestAnimationFrame(fn);
}

// Procedural Texture Generators (zero external image requests)
function createRosePetalTexture(
  innerHex: string,
  midHex: string,
  edgeHex: string,
  anisotropy: number,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(128, 220, 12, 128, 95, 195);
  grad.addColorStop(0, innerHex);
  grad.addColorStop(0.55, midHex);
  grad.addColorStop(1, edgeHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1.2;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(128, 250);
    ctx.quadraticCurveTo(128 + i * 14, 135, 128 + i * 24, 12);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createMeadowGroundTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#335B35';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 4200; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const palette = ['#2B4F2D', '#3F6E3D', '#4A7C43', '#274528', '#56884A'];
    ctx.fillStyle = palette[i % palette.length];
    ctx.globalAlpha = 0.25 + Math.random() * 0.35;
    ctx.fillRect(x, y, 2 + Math.random() * 5, 2 + Math.random() * 5);
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(16, 16);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createWingTexture(
  primaryHex: string,
  secondaryHex: string,
  spotHex: string,
  anisotropy: number,
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.clearRect(0, 0, 128, 128);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(8, 66);
  ctx.bezierCurveTo(32, 12, 114, 10, 118, 52);
  ctx.bezierCurveTo(122, 74, 88, 76, 62, 74);
  ctx.bezierCurveTo(96, 84, 96, 116, 52, 118);
  ctx.bezierCurveTo(22, 118, 10, 88, 8, 66);
  ctx.closePath();

  const grad = ctx.createLinearGradient(8, 24, 116, 108);
  grad.addColorStop(0, secondaryHex);
  grad.addColorStop(0.55, primaryHex);
  grad.addColorStop(1, spotHex);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(56, 26, 36, 0.72)';
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 26, 36, 0.45)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(12, 66);
    ctx.quadraticCurveTo(60, 32 + i * 13, 106 - i * 8, 28 + i * 16);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255, 250, 244, 0.75)';
  ctx.beginPath();
  ctx.arc(92, 42, 6, 0, Math.PI * 2);
  ctx.arc(82, 56, 4, 0, Math.PI * 2);
  ctx.arc(62, 102, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

function createGlowSpriteTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.28, 'rgba(255, 242, 210, 0.8)');
  grad.addColorStop(0.62, 'rgba(255, 215, 180, 0.22)');
  grad.addColorStop(1, 'rgba(255, 215, 180, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSunbeamTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  const horiz = ctx.createLinearGradient(0, 0, 128, 0);
  horiz.addColorStop(0, 'rgba(255, 244, 210, 0)');
  horiz.addColorStop(0.5, 'rgba(255, 244, 210, 0.65)');
  horiz.addColorStop(1, 'rgba(255, 244, 210, 0)');
  ctx.fillStyle = horiz;
  ctx.fillRect(0, 0, 128, 256);

  ctx.globalCompositeOperation = 'destination-in';
  const vert = ctx.createLinearGradient(0, 0, 0, 256);
  vert.addColorStop(0, 'rgba(255,255,255,0.9)');
  vert.addColorStop(0.65, 'rgba(255,255,255,0.4)');
  vert.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = vert;
  ctx.fillRect(0, 0, 128, 256);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Pre-allocated scratch math objects (zero allocations in render loop)
const _vec3 = new THREE.Vector3();
const _vec3b = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler();
const _color = new THREE.Color();
const _raycaster = new THREE.Raycaster();
const _pointerNdc = new THREE.Vector2();

const FLOWER_WHISPER_NOTES = [
  'Every rose in this garden blooms with a quiet memory of us.',
  'Wherever life takes you, my heart stays planted right beside yours.',
  'Even the wind slows down just to listen to your laugh.',
  'Like these petals opening to the sun, every day with you grows brighter.',
  'You are my favorite morning, my sweetest sunset, and every star in between.',
  'From hillside winds to quiet midnight talks — forever yours, always.',
];

export function LivingGarden3D({ onNavigate }: LivingGarden3DProps) {
  const {
    config,
    photos,
    milestones,
    gardenMood,
    setGardenMood,
    gardenModeActive,
    setGardenModeActive,
    windBurstTick,
    triggerWindBurst,
  } = useMemories();

  const mountRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoStageRef = useRef<HTMLDivElement | null>(null);

  const [backdropStyle, setBackdropStyle] = useState<GardenBackdropStyle>('video');
  const [videoSoundOn, setVideoSoundOn] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [resolvedMood, setResolvedMood] = useState<ResolvedGardenMood>(() =>
    resolveLocalMood(gardenMood),
  );
  const [soundOn, setSoundOn] = useState(() => gardenAudio.getState().playing);
  const [popup, setPopup] = useState<InteractivePopup | null>(null);
  const [hoveredCursor, setHoveredCursor] = useState(false);

  // Sync procedural garden audio subscription
  useEffect(() => {
    return gardenAudio.subscribe(() => {
      setSoundOn(gardenAudio.getState().playing);
    });
  }, []);

  // Re-evaluate automatic time-of-day every 30s
  useEffect(() => {
    const update = () => {
      const next = resolveLocalMood(gardenMood);
      setResolvedMood(next);
      gardenAudio.setMood(next);
    };
    update();
    const id = window.setInterval(update, 30000);
    return () => window.clearInterval(id);
  }, [gardenMood]);

  // Listen to reduced-motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  // Keep uploaded video muted unless visitor explicitly enables video sound
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !videoSoundOn;
  }, [videoSoundOn]);

  // Subtle 3D tilt parallax on video stage in video mode
  useEffect(() => {
    if (backdropStyle !== 'video' || reducedMotion) {
      if (videoStageRef.current) {
        videoStageRef.current.style.transform = 'scale(1.03)';
      }
      return;
    }

    let targetRx = 0;
    let targetRy = 0;
    let curRx = 0;
    let curRy = 0;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const nx = (e.clientX / w - 0.5) * 2;
      const ny = (e.clientY / h - 0.5) * 2;
      const maxTilt = gardenModeActive ? 3.2 : 1.6;
      targetRy = -nx * maxTilt;
      targetRx = ny * (maxTilt * 0.65);
    };

    const step = () => {
      curRx += (targetRx - curRx) * 0.06;
      curRy += (targetRy - curRy) * 0.06;
      if (videoStageRef.current) {
        videoStageRef.current.style.transform = `perspective(1400px) rotateX(${curRx.toFixed(2)}deg) rotateY(${curRy.toFixed(2)}deg) scale(1.07)`;
      }
      raf = requestAnimationFrame(step);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(step);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [backdropStyle, gardenModeActive, reducedMotion]);

  const handleVideoLoadedMetadata = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.currentTime < VIDEO_LOOP_START_SEC) {
      vid.currentTime = VIDEO_LOOP_START_SEC;
    }
    void vid.play().catch(() => {
      // Ignore autoplay errors if tab is hidden
    });
  }, []);

  const handleVideoTimeUpdate = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.currentTime >= VIDEO_LOOP_END_SEC || vid.currentTime < 2.8) {
      vid.currentTime = VIDEO_LOOP_START_SEC;
    }
  }, []);

  const jumpVideoChapter = useCallback((sec: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = sec;
    void vid.play().catch(() => {});
  }, []);

  // Refs for Three.js loop
  const resolvedMoodRef = useRef<ResolvedGardenMood>(resolvedMood);
  resolvedMoodRef.current = resolvedMood;
  const gardenModeRef = useRef<boolean>(gardenModeActive);
  gardenModeRef.current = gardenModeActive;
  const configRef = useRef(config);
  configRef.current = config;

  const windGustTargetRef = useRef(0);
  useEffect(() => {
    if (windBurstTick > 0) {
      windGustTargetRef.current = 1.0;
      gardenAudio.playBreezeChime();
    }
  }, [windBurstTick]);

  const handleToggleAudio = useCallback(() => {
    gardenAudio.setMood(resolvedMoodRef.current);
    gardenAudio.toggle();
  }, []);

  const specialMemoryOptions = useMemo(() => {
    const items: {
      title: string;
      date: string;
      location: string;
      caption: string;
      imageData: string;
    }[] = [];

    const togetherSrc = config.openingTogetherPhotoUrl || config.openingTogetherPhotoData;
    if (togetherSrc) {
      items.push({
        title: `${config.himName} & ${config.herNickname} · Forever Frame`,
        date: config.anniversaryDate,
        location: 'Our Heart',
        caption: config.openingQuote || 'A sunlit moment carried forever in our living garden.',
        imageData: togetherSrc,
      });
    }

    for (const p of photos) {
      const src = resolvePhotoSrc(p);
      if (src) {
        items.push({
          title: p.caption || 'Synced Couple Memory',
          date: p.date || config.anniversaryDate,
          location: p.location || 'Sri Lanka',
          caption: p.caption || 'Captured together and preserved inside Forever Yours.',
          imageData: src,
        });
      }
    }

    for (const m of milestones) {
      const coverSrc = resolveCoverSrc(m);
      if (coverSrc) {
        items.push({
          title: m.title,
          date: m.date,
          location: m.location,
          caption: m.description,
          imageData: coverSrc,
        });
      }
    }

    if (items.length === 0) {
      items.push({
        title: 'Eternal Rose Memory',
        date: config.anniversaryDate,
        location: "Baker's Bend",
        caption: 'Every sunrise over our travels blooms right here inside our garden.',
        imageData: SHOWCASE_ARTWORK.eternalRose,
      });
    }
    return items;
  }, [config, photos, milestones]);

  const specialMemoriesRef = useRef(specialMemoryOptions);
  specialMemoriesRef.current = specialMemoryOptions;

  // Main Three.js Scene Effect:
  // - In 'video' style: transparent foreground 3D layer over the Dream Garden 4K video (butterflies, drifting rose petals, stars/fireflies at night, clickable memory roses)
  // - In 'procedural' style: full procedural 3D romantic garden meadow
  useEffect(() => {
    const container = mountRef.current;
    if (!container || reducedMotion) return;

    const isVideoOverlay = backdropStyle === 'video';
    const isSoftwareGl = detectSoftwareGl();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: isSoftwareGl ? 'low-power' : 'high-performance',
        alpha: isVideoOverlay,
      });
    } catch {
      setWebglUnavailable(true);
      return;
    }

    setWebglUnavailable(false);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl && !isVideoOverlay;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    if (isVideoOverlay) {
      renderer.setClearColor(0x000000, 0);
    }
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const scene = new THREE.Scene();
    const initialPreset = MOOD_PRESETS[resolvedMoodRef.current];
    const fog = isVideoOverlay
      ? null
      : new THREE.FogExp2(initialPreset.fogColor.getHex(), initialPreset.fogDensity);
    if (fog) scene.fog = fog;

    // One-time PMREM environment map
    const pmremGen = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGen.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = initialPreset.envIntensity;
    roomEnv.dispose();
    pmremGen.dispose();

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 180);
    camera.position.set(0, 2.35, 11.5);
    camera.lookAt(0, 1.35, -8);

    const hemiLight = new THREE.HemisphereLight(
      initialPreset.hemiSky.clone(),
      initialPreset.hemiGround.clone(),
      initialPreset.hemiIntensity,
    );
    scene.add(hemiLight);

    const ambientLight = new THREE.AmbientLight(
      initialPreset.ambientColor.clone(),
      initialPreset.ambientIntensity,
    );
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(
      initialPreset.sunColor.clone(),
      initialPreset.sunIntensity,
    );
    sunLight.position.copy(initialPreset.sunPos);
    if (!isSoftwareGl && !isVideoOverlay) {
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 2;
      sunLight.shadow.camera.far = 90;
      sunLight.shadow.camera.left = -22;
      sunLight.shadow.camera.right = 22;
      sunLight.shadow.camera.top = 22;
      sunLight.shadow.camera.bottom = -22;
      sunLight.shadow.bias = -0.0005;
    }
    scene.add(sunLight);

    const disposables: { dispose: () => void }[] = [envTarget];

    const glowSpriteTex = createGlowSpriteTexture();
    disposables.push(glowSpriteTex);

    // Optional Full-Scene Sky/Clouds/Rays/Terrain (for procedural 3D meadow mode)
    let skyUniforms: {
      uTopColor: { value: THREE.Color };
      uMidColor: { value: THREE.Color };
      uHorizonColor: { value: THREE.Color };
      uSunDir: { value: THREE.Vector3 };
      uSunColor: { value: THREE.Color };
      uNightFactor: { value: number };
    } | null = null;
    let moonMat: THREE.MeshBasicMaterial | null = null;
    let moonHaloMat: THREE.SpriteMaterial | null = null;
    let cloudMat: THREE.MeshStandardMaterial | null = null;
    const clouds: { group: THREE.Group; speed: number; baseY: number; phase: number }[] = [];
    let rayMat: THREE.MeshBasicMaterial | null = null;
    const animatedCanopies: { group: THREE.Group; phase: number }[] = [];
    const grassUniforms = { uTime: { value: 0 }, uWindGust: { value: 0 } };
    let wildflowerInst: THREE.InstancedMesh | null = null;
    let wildflowerMat: THREE.MeshStandardMaterial | null = null;
    const wfSeeds: { x: number; y: number; z: number; rotY: number; scale: number; phase: number }[] = [];

    if (!isVideoOverlay) {
      skyUniforms = {
        uTopColor: { value: initialPreset.skyTop.clone() },
        uMidColor: { value: initialPreset.skyMid.clone() },
        uHorizonColor: { value: initialPreset.skyHorizon.clone() },
        uSunDir: { value: initialPreset.sunPos.clone().normalize() },
        uSunColor: { value: initialPreset.sunColor.clone() },
        uNightFactor: { value: resolvedMoodRef.current === 'night' ? 1 : 0 },
      };
      const skyGeo = new THREE.SphereGeometry(125, 32, 24);
      const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: skyUniforms,
        vertexShader: `
          varying vec3 vWorldPos;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform vec3 uTopColor;
          uniform vec3 uMidColor;
          uniform vec3 uHorizonColor;
          uniform vec3 uSunDir;
          uniform vec3 uSunColor;
          uniform float uNightFactor;
          varying vec3 vWorldPos;
          void main() {
            vec3 dir = normalize(vWorldPos);
            float skyH = clamp((dir.y + 0.08) * 1.15, 0.0, 1.0);
            vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.36, skyH));
            col = mix(col, uTopColor, smoothstep(0.32, 0.95, skyH));
            float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
            float halo = pow(sunDot, 12.0) * (0.45 - 0.25 * uNightFactor);
            float disc = smoothstep(0.996, 0.9992, sunDot) * (0.85 - 0.55 * uNightFactor);
            col += uSunColor * (halo + disc);
            gl_FragColor = vec4(col, 1.0);
          }
        `,
      });
      scene.add(new THREE.Mesh(skyGeo, skyMat));
      disposables.push(skyGeo, skyMat);

      const moonGroup = new THREE.Group();
      const moonGeo = new THREE.SphereGeometry(2.6, 24, 24);
      moonMat = new THREE.MeshBasicMaterial({
        color: '#F4F7FF',
        transparent: true,
        opacity: initialPreset.moonOpacity,
        fog: false,
      });
      moonGroup.add(new THREE.Mesh(moonGeo, moonMat));
      moonHaloMat = new THREE.SpriteMaterial({
        map: glowSpriteTex,
        color: '#BFD6FF',
        transparent: true,
        opacity: initialPreset.moonOpacity * 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
      });
      const moonHalo = new THREE.Sprite(moonHaloMat);
      moonHalo.scale.set(16, 16, 1);
      moonGroup.add(moonHalo);
      moonGroup.position.set(-16, 26, -68);
      scene.add(moonGroup);
      disposables.push(moonGeo, moonMat, moonHaloMat);

      cloudMat = new THREE.MeshStandardMaterial({
        color: initialPreset.cloudColor.clone(),
        roughness: 0.95,
        metalness: 0.0,
        transparent: true,
        opacity: initialPreset.cloudOpacity,
        depthWrite: false,
      });
      const cloudSphereGeo = new THREE.SphereGeometry(1, 14, 12);
      disposables.push(cloudMat, cloudSphereGeo);
      for (let i = 0; i < 10; i++) {
        const cg = new THREE.Group();
        const puffs = 4 + (i % 3);
        for (let p = 0; p < puffs; p++) {
          const puff = new THREE.Mesh(cloudSphereGeo, cloudMat);
          puff.scale.set(2.4 + Math.random() * 2.2, 1.05 + Math.random() * 0.75, 1.6 + Math.random() * 1.1);
          puff.position.set((p - puffs * 0.5) * 2.2, Math.sin(p * 1.3) * 0.45, Math.random() * 0.8);
          cg.add(puff);
        }
        const startX = -46 + i * 9.5 + Math.random() * 4;
        const baseY = 14 + (i % 4) * 2.7;
        cg.position.set(startX, baseY, -28 - (i % 5) * 9);
        scene.add(cg);
        clouds.push({ group: cg, speed: 0.35 + (i % 4) * 0.14, baseY, phase: Math.random() * Math.PI * 2 });
      }

      const sunbeamTex = createSunbeamTexture();
      rayMat = new THREE.MeshBasicMaterial({
        map: sunbeamTex,
        color: '#FFF2CE',
        transparent: true,
        opacity: initialPreset.rayOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const rayGeo = new THREE.PlaneGeometry(7.5, 36);
      const rayGroup = new THREE.Group();
      for (let i = 0; i < 5; i++) {
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.position.set(-14 + i * 7.2, 11, -18 - (i % 2) * 8);
        ray.rotation.z = -0.34 + (i % 2) * 0.08;
        ray.rotation.y = (i - 2) * 0.12;
        rayGroup.add(ray);
      }
      scene.add(rayGroup);
      disposables.push(sunbeamTex, rayMat, rayGeo);

      const meadowTex = createMeadowGroundTexture(maxAnisotropy);
      const terrainGeo = new THREE.PlaneGeometry(140, 140, 64, 64);
      terrainGeo.rotateX(-Math.PI / 2);
      const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < tPos.count; i++) {
        tPos.setY(i, groundHeightAt(tPos.getX(i), tPos.getZ(i)));
      }
      terrainGeo.computeVertexNormals();
      const terrainMat = new THREE.MeshStandardMaterial({
        map: meadowTex,
        roughness: 0.92,
        metalness: 0.02,
      });
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.receiveShadow = true;
      scene.add(terrainMesh);
      disposables.push(meadowTex, terrainGeo, terrainMat);

      const stoneGeo = new THREE.CylinderGeometry(0.65, 0.72, 0.14, 14);
      const stoneMat = new THREE.MeshStandardMaterial({ color: '#EBD9CC', roughness: 0.82, metalness: 0.04 });
      const stoneInst = new THREE.InstancedMesh(stoneGeo, stoneMat, 26);
      stoneInst.receiveShadow = true;
      for (let i = 0; i < 26; i++) {
        const z = 8 - i * 1.45;
        const x = Math.sin(z * 0.12) * 1.8 + ((i % 2 === 0 ? -1 : 1) * 0.16);
        const s = 0.78 + (i % 3) * 0.16;
        _quat.setFromEuler(_euler.set(0, Math.random() * Math.PI, 0));
        _vec3.set(x, groundHeightAt(x, z) + 0.03, z);
        _vec3b.set(s, 1, s * 0.78);
        _mat4.compose(_vec3, _quat, _vec3b);
        stoneInst.setMatrixAt(i, _mat4);
      }
      stoneInst.instanceMatrix.needsUpdate = true;
      scene.add(stoneInst);
      disposables.push(stoneGeo, stoneMat);

      const barkMat = new THREE.MeshStandardMaterial({ color: '#5A3D31', roughness: 0.9 });
      const leafCanopyMat = new THREE.MeshStandardMaterial({ color: '#396B3D', roughness: 0.8 });
      const blossomCanopyMat = new THREE.MeshStandardMaterial({ color: '#F5C6D0', roughness: 0.72 });
      const trunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 4.2, 8);
      const branchGeo = new THREE.CylinderGeometry(0.08, 0.16, 2.2, 7);
      const canopyGeo = new THREE.IcosahedronGeometry(1.7, 2);
      disposables.push(barkMat, leafCanopyMat, blossomCanopyMat, trunkGeo, branchGeo, canopyGeo);

      const treeCoords: [number, number, number, boolean][] = [
        [-10.5, -13.5, 1.15, true],
        [11.2, -14.8, 1.25, false],
        [-15.8, -22.5, 1.4, false],
        [16.0, -24.0, 1.35, true],
        [-6.5, -27.5, 1.5, true],
        [7.5, -29.0, 1.45, false],
      ];
      for (let i = 0; i < treeCoords.length; i++) {
        const [tx, tz, scale, isBlossom] = treeCoords[i];
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, groundHeightAt(tx, tz) - 0.1, tz);
        treeGroup.scale.setScalar(scale);

        const trunk = new THREE.Mesh(trunkGeo, barkMat);
        trunk.position.y = 2.05;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const branchL = new THREE.Mesh(branchGeo, barkMat);
        branchL.position.set(-0.7, 3.3, 0);
        branchL.rotation.z = 0.65;
        treeGroup.add(branchL);

        const branchR = new THREE.Mesh(branchGeo, barkMat);
        branchR.position.set(0.65, 3.1, 0.25);
        branchR.rotation.z = -0.6;
        branchR.rotation.x = 0.2;
        treeGroup.add(branchR);

        const crown = new THREE.Group();
        crown.position.set(0, 4.2, 0);
        const mat = isBlossom ? blossomCanopyMat : leafCanopyMat;
        for (const [cx, cy, cz, cs] of [
          [0, 0.5, 0, 1.25],
          [-1.35, -0.35, 0.3, 0.95],
          [1.3, -0.4, -0.25, 0.98],
          [0.15, 0.05, 1.1, 0.88],
        ]) {
          const puff = new THREE.Mesh(canopyGeo, mat);
          puff.position.set(cx, cy, cz);
          puff.scale.set(cs * 1.15, cs * 0.85, cs);
          puff.castShadow = true;
          crown.add(puff);
        }
        treeGroup.add(crown);
        scene.add(treeGroup);
        animatedCanopies.push({ group: crown, phase: i * 1.3 });
      }

      const grassCount = isSoftwareGl || width < 768 ? 1000 : 1800;
      const bladeGeo = new THREE.PlaneGeometry(0.11, 0.68, 1, 3);
      bladeGeo.translate(0, 0.34, 0);
      const grassMat = new THREE.MeshStandardMaterial({
        color: '#5B984E',
        roughness: 0.78,
        metalness: 0.04,
        side: THREE.DoubleSide,
      });
      grassMat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = grassUniforms.uTime;
        shader.uniforms.uWindGust = grassUniforms.uWindGust;
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>
             uniform float uTime;
             uniform float uWindGust;`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
             vec4 instOrigin = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
             float heightFactor = clamp(position.y / 0.68, 0.0, 1.0);
             float windWave = sin(uTime * 1.65 + instOrigin.x * 0.42 + instOrigin.z * 0.28)
                            + 0.45 * cos(uTime * 2.8 + instOrigin.x * 0.75);
             float gustWave = uWindGust * (1.2 + 0.6 * sin(uTime * 4.5 + instOrigin.z * 0.3));
             transformed.x += (windWave * 0.12 + gustWave * 0.28) * heightFactor * heightFactor;
             transformed.z += (windWave * 0.06) * heightFactor * heightFactor;`,
          );
      };
      const grassInst = new THREE.InstancedMesh(bladeGeo, grassMat, grassCount);
      grassInst.frustumCulled = false;
      const grassPalette = ['#4A8644', '#63A352', '#3D7138', '#77B662', '#528F4A'];
      let placedGrass = 0;
      let attempts = 0;
      while (placedGrass < grassCount && attempts < grassCount * 3) {
        attempts++;
        const gx = (Math.random() - 0.5) * 34;
        const gz = 8.5 - Math.random() * 34;
        if (Math.abs(gx - Math.sin(gz * 0.12) * 1.8) < 1.15) continue;
        _quat.setFromEuler(_euler.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.2));
        _vec3.set(gx, groundHeightAt(gx, gz) - 0.02, gz);
        _vec3b.set(0.8 + Math.random() * 0.5, 0.72 + Math.random() * 0.85, 1);
        _mat4.compose(_vec3, _quat, _vec3b);
        grassInst.setMatrixAt(placedGrass, _mat4);
        _color.set(grassPalette[placedGrass % grassPalette.length]);
        grassInst.setColorAt(placedGrass, _color);
        placedGrass++;
      }
      grassInst.count = placedGrass;
      grassInst.instanceMatrix.needsUpdate = true;
      if (grassInst.instanceColor) grassInst.instanceColor.needsUpdate = true;
      scene.add(grassInst);
      disposables.push(bladeGeo, grassMat);

      const wildflowerCount = 150;
      const wildflowerGeo = new THREE.ConeGeometry(0.11, 0.44, 6);
      wildflowerGeo.translate(0, 0.36, 0);
      wildflowerMat = new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.65,
        emissive: new THREE.Color('#3B1D36'),
        emissiveIntensity: initialPreset.flowerGlow * 0.6,
      });
      wildflowerInst = new THREE.InstancedMesh(wildflowerGeo, wildflowerMat, wildflowerCount);
      wildflowerInst.frustumCulled = false;
      const wfColors = ['#B58DE0', '#F8D4E0', '#FFF6DA', '#E39AB5', '#9ABAE8'];
      for (let i = 0; i < wildflowerCount; i++) {
        let wx = (Math.random() - 0.5) * 26;
        const wz = 7.5 - Math.random() * 26;
        const pathCenter = Math.sin(wz * 0.12) * 1.8;
        if (Math.abs(wx - pathCenter) < 1.35) wx += wx >= pathCenter ? 1.6 : -1.6;
        wfSeeds.push({
          x: wx,
          y: groundHeightAt(wx, wz),
          z: wz,
          rotY: Math.random() * Math.PI * 2,
          scale: 0.75 + Math.random() * 0.65,
          phase: Math.random() * Math.PI * 2,
        });
        _color.set(wfColors[i % wfColors.length]);
        wildflowerInst.setColorAt(i, _color);
      }
      if (wildflowerInst.instanceColor) wildflowerInst.instanceColor.needsUpdate = true;
      scene.add(wildflowerInst);
      disposables.push(wildflowerGeo, wildflowerMat);
    }

    // Shared Interactive Foreground Stars (Night & Twilight depth)
    const starCount = isVideoOverlay ? 180 : 380;
    const starPositions = new Float32Array(starCount * 3);
    const starPhases = new Float32Array(starCount);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(0.2 + Math.random() * 0.8);
      const r = 98 + Math.random() * 14;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = -Math.abs(r * Math.sin(phi) * Math.sin(theta));
      starPhases[i] = Math.random() * Math.PI * 2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));
    const starUniforms = {
      uTime: { value: 0 },
      uOpacity: { value: initialPreset.starOpacity },
    };
    const starMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: starUniforms,
      vertexShader: `
        attribute float aPhase;
        varying float vPhase;
        void main() {
          vPhase = aPhase;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (2.2 + 1.8 * fract(aPhase)) * (140.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOpacity;
        varying float vPhase;
        void main() {
          float dist = length(gl_PointCoord - 0.5);
          if (dist > 0.5) discard;
          float twinkle = 0.55 + 0.45 * sin(uTime * 2.1 + vPhase * 6.28);
          float alpha = smoothstep(0.5, 0.05, dist) * twinkle * uOpacity;
          gl_FragColor = vec4(1.0, 0.96, 0.88, alpha);
        }
      `,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);
    disposables.push(starGeo, starMat);

    // Living Hero Multi-Part Roses
    // In 'video' mode: place 3 delicate floating Special Memory Roses in balanced foreground corners so the Dream Garden video stays clear and unobstructed!
    // In 'procedural' mode: place all 18 full garden roses.
    const petalTextures = {
      pink: createRosePetalTexture('#A92954', '#E67394', '#FAD0DC', maxAnisotropy),
      blush: createRosePetalTexture('#D67B92', '#F8BAC8', '#FFF2F4', maxAnisotropy),
      white: createRosePetalTexture('#E8CFC5', '#FFF2E8', '#FFFFFF', maxAnisotropy),
      special: createRosePetalTexture('#C84D6E', '#F3B478', '#FFF7D6', maxAnisotropy),
    };
    disposables.push(
      petalTextures.pink,
      petalTextures.blush,
      petalTextures.white,
      petalTextures.special,
    );

    const petalMaterials = {
      pink: new THREE.MeshStandardMaterial({
        map: petalTextures.pink,
        roughness: 0.42,
        metalness: 0.04,
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#661C38'),
        emissiveIntensity: initialPreset.flowerGlow,
      }),
      blush: new THREE.MeshStandardMaterial({
        map: petalTextures.blush,
        roughness: 0.4,
        metalness: 0.04,
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#703247'),
        emissiveIntensity: initialPreset.flowerGlow,
      }),
      white: new THREE.MeshStandardMaterial({
        map: petalTextures.white,
        roughness: 0.38,
        metalness: 0.05,
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#6E5B52'),
        emissiveIntensity: initialPreset.flowerGlow,
      }),
      special: new THREE.MeshStandardMaterial({
        map: petalTextures.special,
        roughness: 0.28,
        metalness: 0.16,
        side: THREE.DoubleSide,
        emissive: new THREE.Color('#C47A38'),
        emissiveIntensity: 0.28 + initialPreset.flowerGlow,
      }),
    };
    disposables.push(
      petalMaterials.pink,
      petalMaterials.blush,
      petalMaterials.white,
      petalMaterials.special,
    );

    const stemMat = new THREE.MeshStandardMaterial({ color: '#3B6E38', roughness: 0.72 });
    const leafMat = new THREE.MeshStandardMaterial({
      color: '#488142',
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const stamenMat = new THREE.MeshStandardMaterial({
      color: '#F2C15A',
      roughness: 0.45,
      emissive: new THREE.Color('#D6A23C'),
      emissiveIntensity: 0.25,
    });
    const dewMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.05,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      transparent: true,
      opacity: 0.82,
    });

    const roseStemGeo = new THREE.CylinderGeometry(0.022, 0.032, 0.95, 8);
    roseStemGeo.translate(0, 0.475, 0);
    const calyxGeo = new THREE.ConeGeometry(0.11, 0.16, 6);
    const leafGeo = new THREE.SphereGeometry(0.14, 8, 6);
    leafGeo.scale(1.4, 0.12, 0.65);
    const petalCupGeo = new THREE.SphereGeometry(0.24, 12, 10, 0, Math.PI * 0.95, 0.2, Math.PI * 0.68);
    const stamenGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const dewGeo = new THREE.SphereGeometry(0.024, 8, 8);
    const hitSphereGeo = new THREE.SphereGeometry(0.58, 8, 8);
    const hitSphereMat = new THREE.MeshBasicMaterial({ visible: false });
    disposables.push(
      stemMat,
      leafMat,
      stamenMat,
      dewMat,
      roseStemGeo,
      calyxGeo,
      leafGeo,
      petalCupGeo,
      stamenGeo,
      dewGeo,
      hitSphereGeo,
      hitSphereMat,
    );

    interface AnimatedRose {
      root: THREE.Group;
      bloomPivot: THREE.Group;
      innerPetals: THREE.Mesh[];
      outerPetals: THREE.Mesh[];
      headWorldPos: THREE.Vector3;
      phase: number;
      swayAmp: number;
      isSpecial: boolean;
      haloSprite?: THREE.Sprite;
    }

    const rosePlacements: {
      x: number;
      z: number;
      scale: number;
      palette: 'pink' | 'blush' | 'white' | 'special';
      isSpecial: boolean;
      memoryIndex: number;
      customY?: number;
    }[] = isVideoOverlay
      ? [
          { x: -4.6, z: 3.2, customY: 0.15, scale: 1.05, palette: 'special', isSpecial: true, memoryIndex: 0 },
          { x: 4.5, z: 3.4, customY: 0.25, scale: 1.05, palette: 'special', isSpecial: true, memoryIndex: 1 },
          { x: -3.9, z: 1.8, customY: 2.35, scale: 0.92, palette: 'pink', isSpecial: false, memoryIndex: 0 },
          { x: 4.1, z: 2.0, customY: 2.45, scale: 0.92, palette: 'special', isSpecial: true, memoryIndex: 2 },
        ]
      : [
          { x: -3.2, z: 4.8, scale: 1.15, palette: 'pink', isSpecial: false, memoryIndex: 0 },
          { x: 3.1, z: 4.5, scale: 1.1, palette: 'blush', isSpecial: false, memoryIndex: 0 },
          { x: -2.2, z: 2.9, scale: 1.25, palette: 'special', isSpecial: true, memoryIndex: 0 },
          { x: 2.5, z: 2.2, scale: 1.05, palette: 'white', isSpecial: false, memoryIndex: 0 },
          { x: -4.4, z: 1.6, scale: 1.1, palette: 'blush', isSpecial: false, memoryIndex: 0 },
          { x: 4.1, z: 1.1, scale: 1.18, palette: 'pink', isSpecial: false, memoryIndex: 0 },
          { x: 2.1, z: -0.4, scale: 1.28, palette: 'special', isSpecial: true, memoryIndex: 1 },
          { x: -2.9, z: -0.8, scale: 1.08, palette: 'white', isSpecial: false, memoryIndex: 0 },
          { x: -5.4, z: -2.3, scale: 1.2, palette: 'pink', isSpecial: false, memoryIndex: 0 },
          { x: 5.2, z: -2.6, scale: 1.12, palette: 'blush', isSpecial: false, memoryIndex: 0 },
          { x: -1.8, z: -3.5, scale: 1.24, palette: 'special', isSpecial: true, memoryIndex: 2 },
          { x: 3.4, z: -4.1, scale: 1.15, palette: 'white', isSpecial: false, memoryIndex: 0 },
          { x: -4.2, z: -5.6, scale: 1.12, palette: 'blush', isSpecial: false, memoryIndex: 0 },
          { x: 1.8, z: -6.2, scale: 1.05, palette: 'pink', isSpecial: false, memoryIndex: 0 },
          { x: -6.2, z: -7.5, scale: 1.22, palette: 'white', isSpecial: false, memoryIndex: 0 },
          { x: 5.9, z: -7.8, scale: 1.18, palette: 'pink', isSpecial: false, memoryIndex: 0 },
          { x: -2.6, z: -9.4, scale: 1.15, palette: 'blush', isSpecial: false, memoryIndex: 0 },
          { x: 3.6, z: -9.8, scale: 1.2, palette: 'white', isSpecial: false, memoryIndex: 0 },
        ];

    const roses: AnimatedRose[] = [];
    const clickableMeshes: THREE.Object3D[] = [];

    for (let idx = 0; idx < rosePlacements.length; idx++) {
      const cfg = rosePlacements[idx];
      const gy = cfg.customY !== undefined ? cfg.customY : groundHeightAt(cfg.x, cfg.z);
      const root = new THREE.Group();
      root.position.set(cfg.x, gy - 0.03, cfg.z);
      root.scale.setScalar(cfg.scale);

      if (!isVideoOverlay) {
        const stem = new THREE.Mesh(roseStemGeo, stemMat);
        stem.castShadow = true;
        root.add(stem);

        for (let l = 0; l < 3; l++) {
          const leaf = new THREE.Mesh(leafGeo, leafMat);
          const angle = l * 2.1 + idx;
          leaf.position.set(Math.cos(angle) * 0.14, 0.35 + l * 0.18, Math.sin(angle) * 0.14);
          leaf.rotation.y = -angle;
          leaf.rotation.z = 0.35;
          root.add(leaf);
        }
      }

      const bloomPivot = new THREE.Group();
      bloomPivot.position.set(0, isVideoOverlay ? 0 : 0.96, 0);
      if (isVideoOverlay) {
        bloomPivot.rotation.x = 0.28;
      }
      root.add(bloomPivot);

      const calyx = new THREE.Mesh(calyxGeo, stemMat);
      calyx.rotation.x = Math.PI;
      calyx.position.y = -0.05;
      bloomPivot.add(calyx);

      const stamen = new THREE.Mesh(stamenGeo, stamenMat);
      stamen.position.y = 0.08;
      bloomPivot.add(stamen);

      const pMat = petalMaterials[cfg.palette];
      const innerPetals: THREE.Mesh[] = [];
      const outerPetals: THREE.Mesh[] = [];

      for (let p = 0; p < 5; p++) {
        const petal = new THREE.Mesh(petalCupGeo, pMat);
        const a = (p / 5) * Math.PI * 2;
        petal.scale.set(0.62, 0.72, 0.62);
        petal.position.set(Math.cos(a) * 0.05, 0.08, Math.sin(a) * 0.05);
        petal.rotation.y = -a + Math.PI / 2;
        petal.rotation.x = 0.28;
        bloomPivot.add(petal);
        innerPetals.push(petal);
      }

      for (let p = 0; p < 7; p++) {
        const petal = new THREE.Mesh(petalCupGeo, pMat);
        const a = (p / 7) * Math.PI * 2 + 0.35;
        petal.scale.set(0.95, 0.92, 0.92);
        petal.position.set(Math.cos(a) * 0.09, 0.05, Math.sin(a) * 0.09);
        petal.rotation.y = -a + Math.PI / 2;
        petal.rotation.x = 0.65;
        bloomPivot.add(petal);
        outerPetals.push(petal);
      }

      for (let d = 0; d < 2; d++) {
        const dew = new THREE.Mesh(dewGeo, dewMat);
        dew.position.set(d === 0 ? 0.14 : -0.11, 0.16, d === 0 ? 0.08 : -0.12);
        bloomPivot.add(dew);
      }

      let haloSprite: THREE.Sprite | undefined;
      if (cfg.isSpecial) {
        const haloMat = new THREE.SpriteMaterial({
          map: glowSpriteTex,
          color: '#FFE099',
          transparent: true,
          opacity: 0.58,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        haloSprite = new THREE.Sprite(haloMat);
        haloSprite.scale.set(0.95, 0.95, 1);
        haloSprite.position.y = 0.14;
        bloomPivot.add(haloSprite);
        disposables.push(haloMat);
      }

      const hitMesh = new THREE.Mesh(hitSphereGeo, hitSphereMat);
      hitMesh.position.y = 0.12;
      hitMesh.userData = {
        kind: cfg.isSpecial ? 'specialRose' : 'flower',
        roseIndex: idx,
        memoryIndex: cfg.memoryIndex,
      };
      bloomPivot.add(hitMesh);
      clickableMeshes.push(hitMesh);

      scene.add(root);
      roses.push({
        root,
        bloomPivot,
        innerPetals,
        outerPetals,
        headWorldPos: new THREE.Vector3(
          cfg.x,
          isVideoOverlay ? gy : gy + 1.05 * cfg.scale,
          cfg.z,
        ),
        phase: idx * 0.77 + Math.random() * 0.8,
        swayAmp: 0.05 + (idx % 3) * 0.015,
        isSpecial: cfg.isSpecial,
        haloSprite,
      });
    }

    // Floating Drifting Rose Petals
    const floatingPetalGeo = new THREE.PlaneGeometry(0.14, 0.18, 2, 2);
    const fpPos = floatingPetalGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < fpPos.count; i++) {
      const px = fpPos.getX(i);
      const py = fpPos.getY(i);
      fpPos.setZ(i, (px * px + py * py) * 1.4);
    }
    floatingPetalGeo.computeVertexNormals();
    const floatingPetalMat = new THREE.MeshStandardMaterial({
      color: '#F59BB2',
      roughness: 0.45,
      side: THREE.DoubleSide,
      emissive: new THREE.Color('#6E233A'),
      emissiveIntensity: initialPreset.flowerGlow * 0.7,
    });
    const floatingPetalCount = isVideoOverlay ? 28 : 42;
    const floatingPetalsInst = new THREE.InstancedMesh(
      floatingPetalGeo,
      floatingPetalMat,
      floatingPetalCount,
    );
    floatingPetalsInst.frustumCulled = false;
    const petalStates: {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      rot: THREE.Euler;
      rotSpeed: THREE.Vector3;
      phase: number;
    }[] = [];
    const petalColors = ['#F49BB2', '#FBE0E6', '#E57492', '#FFF1E8'];
    for (let i = 0; i < floatingPetalCount; i++) {
      petalStates.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          0.5 + Math.random() * 4.5,
          (Math.random() - 0.5) * 6 + (isVideoOverlay ? 3 : -2),
        ),
        vel: new THREE.Vector3(0.28 + Math.random() * 0.35, -0.22 - Math.random() * 0.2, (Math.random() - 0.5) * 0.2),
        rot: new THREE.Euler(Math.random() * 3, Math.random() * 3, Math.random() * 3),
        rotSpeed: new THREE.Vector3(0.7 + Math.random(), 0.9 + Math.random(), 0.5 + Math.random()),
        phase: Math.random() * Math.PI * 2,
      });
      _color.set(petalColors[i % petalColors.length]);
      floatingPetalsInst.setColorAt(i, _color);
    }
    if (floatingPetalsInst.instanceColor) floatingPetalsInst.instanceColor.needsUpdate = true;
    scene.add(floatingPetalsInst);
    disposables.push(floatingPetalGeo, floatingPetalMat);

    // Composite 3D Butterflies (matching the video's white butterflies + pastel rose & golden butterflies)
    const wingTexWhite = createWingTexture('#FFFFFF', '#FFF8FA', '#D6B477', maxAnisotropy);
    const wingTexRose = createWingTexture('#F4A5BA', '#FFF3F6', '#D46082', maxAnisotropy);
    const wingTexGold = createWingTexture('#F2BD6D', '#FFEBB8', '#6B3442', maxAnisotropy);
    disposables.push(wingTexWhite, wingTexRose, wingTexGold);

    const wingMaterials = [
      new THREE.MeshStandardMaterial({
        map: wingTexWhite,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.42,
      }),
      new THREE.MeshStandardMaterial({
        map: wingTexRose,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.45,
      }),
      new THREE.MeshStandardMaterial({
        map: wingTexGold,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.45,
      }),
    ];
    const bBodyGeo = new THREE.CapsuleGeometry(0.018, 0.14, 4, 8);
    bBodyGeo.rotateX(Math.PI / 2);
    const bBodyMat = new THREE.MeshStandardMaterial({ color: '#3B1E28', roughness: 0.6 });
    const wingPlaneGeo = new THREE.PlaneGeometry(0.24, 0.24);
    wingPlaneGeo.translate(0.12, 0, 0);
    wingPlaneGeo.rotateX(-Math.PI / 2);
    const antGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.09, 4);
    antGeo.translate(0, 0.045, 0);
    const bHitGeo = new THREE.SphereGeometry(0.45, 8, 8);
    disposables.push(...wingMaterials, bBodyGeo, bBodyMat, wingPlaneGeo, antGeo, bHitGeo);

    interface AnimatedButterfly {
      group: THREE.Group;
      leftWing: THREE.Group;
      rightWing: THREE.Group;
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      target: THREE.Vector3;
      flapPhase: number;
      flapSpeed: number;
      landingTimer: number;
      perchTimer: number;
      perchRoseIndex: number;
      flutterBoost: number;
      foreground: boolean;
    }

    const butterflies: AnimatedButterfly[] = [];
    const butterflyCount = isVideoOverlay ? 6 : 8;

    for (let i = 0; i < butterflyCount; i++) {
      const bGroup = new THREE.Group();
      const foreground = isVideoOverlay || i < 2;
      const bScale = foreground ? 1.08 + (i % 3) * 0.14 : 0.78 + (i % 3) * 0.18;
      bGroup.scale.setScalar(bScale);

      bGroup.add(new THREE.Mesh(bBodyGeo, bBodyMat));

      const antL = new THREE.Mesh(antGeo, bBodyMat);
      antL.position.set(-0.015, 0.015, -0.07);
      antL.rotation.set(-0.6, 0, 0.35);
      bGroup.add(antL);

      const antR = new THREE.Mesh(antGeo, bBodyMat);
      antR.position.set(0.015, 0.015, -0.07);
      antR.rotation.set(-0.6, 0, -0.35);
      bGroup.add(antR);

      const wMat = wingMaterials[i % wingMaterials.length];
      const rightWing = new THREE.Group();
      rightWing.add(new THREE.Mesh(wingPlaneGeo, wMat));
      bGroup.add(rightWing);

      const leftWing = new THREE.Group();
      const lwMesh = new THREE.Mesh(wingPlaneGeo, wMat);
      lwMesh.scale.x = -1;
      leftWing.add(lwMesh);
      bGroup.add(leftWing);

      const bHit = new THREE.Mesh(bHitGeo, hitSphereMat);
      bHit.userData = { kind: 'butterfly', butterflyIndex: i };
      bGroup.add(bHit);
      clickableMeshes.push(bHit);

      const startPos = new THREE.Vector3(
        (Math.random() - 0.5) * 9,
        1.1 + Math.random() * 2.2,
        foreground ? 3.8 + (i % 3) * 1.1 : -1.5 - i * 1.1,
      );
      bGroup.position.copy(startPos);
      scene.add(bGroup);

      butterflies.push({
        group: bGroup,
        leftWing,
        rightWing,
        pos: startPos.clone(),
        vel: new THREE.Vector3((Math.random() - 0.5) * 0.9, 0.1, (Math.random() - 0.5) * 0.9),
        target: new THREE.Vector3((Math.random() - 0.5) * 9, 1.3 + Math.random() * 2.2, foreground ? 4.8 : -3),
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: 9.5 + Math.random() * 3.5,
        landingTimer: 6 + Math.random() * 9,
        perchTimer: 0,
        perchRoseIndex: i % roses.length,
        flutterBoost: 0,
        foreground,
      });
    }

    // Heart / Sparkle Burst Pool
    const burstCount = 32;
    const burstPositions = new Float32Array(burstCount * 3);
    const burstVelocities: THREE.Vector3[] = [];
    const burstLife = new Float32Array(burstCount);
    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3 + 1] = -999;
      burstVelocities.push(new THREE.Vector3());
    }
    const burstGeo = new THREE.BufferGeometry();
    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    const burstMat = new THREE.PointsMaterial({
      map: glowSpriteTex,
      size: 0.34,
      color: '#FFBFD4',
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(burstGeo, burstMat));
    disposables.push(burstGeo, burstMat);

    function triggerBurstAt(origin: THREE.Vector3) {
      for (let i = 0; i < burstCount; i++) {
        burstPositions[i * 3] = origin.x;
        burstPositions[i * 3 + 1] = origin.y;
        burstPositions[i * 3 + 2] = origin.z;
        const a = Math.random() * Math.PI * 2;
        const spd = 0.9 + Math.random() * 1.9;
        burstVelocities[i].set(Math.cos(a) * spd, 0.8 + Math.random() * 1.6, Math.sin(a) * spd);
        burstLife[i] = 1.0 + Math.random() * 0.45;
      }
      burstGeo.attributes.position.needsUpdate = true;
    }

    // Bioluminescent Night Fireflies
    const fireflyCount = 46;
    const ffPos = new Float32Array(fireflyCount * 3);
    const ffSeeds: { baseX: number; baseY: number; baseZ: number; phase: number; speed: number }[] = [];
    for (let i = 0; i < fireflyCount; i++) {
      const bx = (Math.random() - 0.5) * 14;
      const bz = isVideoOverlay ? 1.5 + Math.random() * 5.0 : 6 - Math.random() * 20;
      const by = isVideoOverlay ? 0.3 + Math.random() * 3.4 : groundHeightAt(bx, bz) + 0.65 + Math.random() * 2.4;
      ffSeeds.push({ baseX: bx, baseY: by, baseZ: bz, phase: Math.random() * 6.28, speed: 0.6 + Math.random() * 0.8 });
      ffPos[i * 3] = bx;
      ffPos[i * 3 + 1] = by;
      ffPos[i * 3 + 2] = bz;
    }
    const ffGeo = new THREE.BufferGeometry();
    ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
    const ffMat = new THREE.PointsMaterial({
      map: glowSpriteTex,
      size: 0.48,
      color: '#FFE68F',
      transparent: true,
      opacity: initialPreset.fireflyOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(ffGeo, ffMat));
    disposables.push(ffGeo, ffMat);

    // Mouse / Touch Parallax & Non-Blocking Raycast Clicks
    let pointerX = 0;
    let pointerY = 0;
    let downX = 0;
    let downY = 0;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointerX = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    const onPointerMove = (e: PointerEvent) => {
      updatePointer(e.clientX, e.clientY);
      const targetEl = e.target as HTMLElement | null;
      const blockedByUi =
        !gardenModeRef.current &&
        Boolean(targetEl?.closest('button, a, input, select, textarea, header, footer, section, article, [role="dialog"]'));
      if (blockedByUi) {
        setHoveredCursor(false);
        return;
      }
      _pointerNdc.set(pointerX, pointerY);
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(clickableMeshes, false);
      setHoveredCursor(hits.length > 0);
    };

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      updatePointer(e.clientX, e.clientY);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) return;

      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl?.closest(
          'button, a, input, select, textarea, header, footer, section, article, [role="dialog"], [data-garden-hud="true"]',
        )
      ) {
        return;
      }

      updatePointer(e.clientX, e.clientY);
      _pointerNdc.set(pointerX, pointerY);
      _raycaster.setFromCamera(_pointerNdc, camera);
      const hits = _raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length === 0) return;

      const hit = hits[0];
      const data = hit.object.userData as {
        kind?: 'butterfly' | 'flower' | 'specialRose';
        butterflyIndex?: number;
        roseIndex?: number;
        memoryIndex?: number;
      };

      if (data.kind === 'butterfly' && typeof data.butterflyIndex === 'number') {
        const b = butterflies[data.butterflyIndex];
        if (b) {
          b.flutterBoost = 1.0;
          b.perchTimer = 0;
          b.vel.y = 1.65;
          triggerBurstAt(b.pos);
          gardenAudio.playBreezeChime();
          setPopup({
            kind: 'butterfly',
            message: `A sunlit butterfly fluttered up with wishes for ${configRef.current.herNickname}!`,
          });
        }
      } else if (data.kind === 'specialRose') {
        const memPool = specialMemoriesRef.current;
        const picked = memPool[(data.memoryIndex ?? 0) % memPool.length];
        triggerBurstAt(hit.point);
        gardenAudio.playBreezeChime();
        setPopup({
          kind: 'memory',
          title: picked.title,
          date: picked.date,
          location: picked.location,
          caption: picked.caption,
          imageData: picked.imageData,
        });
      } else if (data.kind === 'flower') {
        const msg = FLOWER_WHISPER_NOTES[(data.roseIndex ?? 0) % FLOWER_WHISPER_NOTES.length];
        gardenAudio.playBreezeChime();
        setPopup({
          kind: 'whisper',
          title: `Garden Whisper for ${configRef.current.herNickname}`,
          message: msg,
          accent: configRef.current.himName,
        });
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', onPointerUp, { passive: true });

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let disposed = false;
    let rafId = 0;
    let elapsed = 0;
    let lastTime = performance.now();
    let windGustCurrent = 0;
    let currentCamX = 0;
    let currentCamY = 2.35;
    let currentNightFactor = resolvedMoodRef.current === 'night' ? 1 : 0;
    let currentButterflyActivity = initialPreset.butterflyActivity;

    const rawGl = renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext | null;

    const tick = () => {
      if (disposed) return;

      const now = performance.now();
      const rawDt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!document.hidden) {
        elapsed += rawDt;

        if (windGustTargetRef.current > 0.01) {
          windGustCurrent = THREE.MathUtils.damp(windGustCurrent, windGustTargetRef.current, 6, rawDt);
          windGustTargetRef.current = THREE.MathUtils.damp(windGustTargetRef.current, 0, 1.35, rawDt);
        } else {
          windGustCurrent = THREE.MathUtils.damp(windGustCurrent, 0, 1.6, rawDt);
        }

        const targetMood = MOOD_PRESETS[resolvedMoodRef.current];
        const dampSpeed = 2.0;

        if (skyUniforms && fog && moonMat && moonHaloMat && cloudMat && rayMat) {
          skyUniforms.uTopColor.value.lerp(targetMood.skyTop, Math.min(1, rawDt * dampSpeed));
          skyUniforms.uMidColor.value.lerp(targetMood.skyMid, Math.min(1, rawDt * dampSpeed));
          skyUniforms.uHorizonColor.value.lerp(targetMood.skyHorizon, Math.min(1, rawDt * dampSpeed));
          skyUniforms.uSunColor.value.lerp(targetMood.sunColor, Math.min(1, rawDt * dampSpeed));
          _vec3.copy(targetMood.sunPos).normalize();
          skyUniforms.uSunDir.value.lerp(_vec3, Math.min(1, rawDt * dampSpeed));
          currentNightFactor = THREE.MathUtils.damp(
            currentNightFactor,
            resolvedMoodRef.current === 'night' ? 1 : 0,
            dampSpeed,
            rawDt,
          );
          skyUniforms.uNightFactor.value = currentNightFactor;

          fog.color.lerp(targetMood.fogColor, Math.min(1, rawDt * dampSpeed));
          fog.density = THREE.MathUtils.damp(fog.density, targetMood.fogDensity, dampSpeed, rawDt);

          cloudMat.color.lerp(targetMood.cloudColor, Math.min(1, rawDt * dampSpeed));
          cloudMat.opacity = THREE.MathUtils.damp(cloudMat.opacity, targetMood.cloudOpacity, dampSpeed, rawDt);
          rayMat.opacity = THREE.MathUtils.damp(
            rayMat.opacity,
            targetMood.rayOpacity * (0.85 + 0.15 * Math.sin(elapsed * 0.4)),
            dampSpeed,
            rawDt,
          );
          moonMat.opacity = THREE.MathUtils.damp(moonMat.opacity, targetMood.moonOpacity, dampSpeed, rawDt);
          moonHaloMat.opacity = THREE.MathUtils.damp(moonHaloMat.opacity, targetMood.moonOpacity * 0.65, dampSpeed, rawDt);

          grassUniforms.uTime.value = elapsed;
          grassUniforms.uWindGust.value = windGustCurrent;

          for (const c of animatedCanopies) {
            c.group.rotation.z = Math.sin(elapsed * 0.75 + c.phase) * (0.028 + windGustCurrent * 0.04);
            c.group.rotation.x = Math.cos(elapsed * 0.55 + c.phase) * 0.018;
          }
          for (const c of clouds) {
            c.group.position.x += (c.speed + windGustCurrent * 1.4) * rawDt;
            c.group.position.y = c.baseY + Math.sin(elapsed * 0.25 + c.phase) * 0.35;
            if (c.group.position.x > 52) c.group.position.x = -52;
          }
          if (wildflowerInst && wildflowerMat) {
            wildflowerMat.emissiveIntensity = THREE.MathUtils.damp(
              wildflowerMat.emissiveIntensity,
              targetMood.flowerGlow * 0.65,
              dampSpeed,
              rawDt,
            );
            for (let i = 0; i < wfSeeds.length; i++) {
              const s = wfSeeds[i];
              const tiltZ =
                Math.sin(elapsed * 1.4 + s.phase + s.x * 0.3) * 0.09 +
                windGustCurrent * 0.28 * Math.sin(elapsed * 4.0 + s.phase);
              _quat.setFromEuler(_euler.set(Math.cos(elapsed * 1.1 + s.phase) * 0.06, s.rotY, tiltZ));
              _vec3.set(s.x, s.y - 0.02, s.z);
              _vec3b.set(s.scale, s.scale, s.scale);
              _mat4.compose(_vec3, _quat, _vec3b);
              wildflowerInst.setMatrixAt(i, _mat4);
            }
            wildflowerInst.instanceMatrix.needsUpdate = true;
          }
        }

        sunLight.color.lerp(targetMood.sunColor, Math.min(1, rawDt * dampSpeed));
        sunLight.intensity = THREE.MathUtils.damp(sunLight.intensity, targetMood.sunIntensity, dampSpeed, rawDt);
        sunLight.position.lerp(targetMood.sunPos, Math.min(1, rawDt * dampSpeed));
        hemiLight.color.lerp(targetMood.hemiSky, Math.min(1, rawDt * dampSpeed));
        hemiLight.groundColor.lerp(targetMood.hemiGround, Math.min(1, rawDt * dampSpeed));
        hemiLight.intensity = THREE.MathUtils.damp(hemiLight.intensity, targetMood.hemiIntensity, dampSpeed, rawDt);
        ambientLight.color.lerp(targetMood.ambientColor, Math.min(1, rawDt * dampSpeed));
        ambientLight.intensity = THREE.MathUtils.damp(ambientLight.intensity, targetMood.ambientIntensity, dampSpeed, rawDt);
        scene.environmentIntensity = THREE.MathUtils.damp(scene.environmentIntensity, targetMood.envIntensity, dampSpeed, rawDt);

        starUniforms.uTime.value = elapsed;
        starUniforms.uOpacity.value = THREE.MathUtils.damp(starUniforms.uOpacity.value, targetMood.starOpacity, dampSpeed, rawDt);
        starPoints.rotation.y = elapsed * 0.008;

        ffMat.opacity = THREE.MathUtils.damp(ffMat.opacity, targetMood.fireflyOpacity, dampSpeed, rawDt);
        dewMat.opacity = THREE.MathUtils.damp(dewMat.opacity, 0.35 + targetMood.dewIntensity * 0.58, dampSpeed, rawDt);
        currentButterflyActivity = THREE.MathUtils.damp(currentButterflyActivity, targetMood.butterflyActivity, dampSpeed, rawDt);

        petalMaterials.pink.emissiveIntensity = THREE.MathUtils.damp(petalMaterials.pink.emissiveIntensity, targetMood.flowerGlow, dampSpeed, rawDt);
        petalMaterials.blush.emissiveIntensity = THREE.MathUtils.damp(petalMaterials.blush.emissiveIntensity, targetMood.flowerGlow, dampSpeed, rawDt);
        petalMaterials.white.emissiveIntensity = THREE.MathUtils.damp(petalMaterials.white.emissiveIntensity, targetMood.flowerGlow * 0.85, dampSpeed, rawDt);
        petalMaterials.special.emissiveIntensity = THREE.MathUtils.damp(petalMaterials.special.emissiveIntensity, 0.25 + targetMood.flowerGlow * 0.9, dampSpeed, rawDt);

        // Living Roses (stem sway + slow breathing bloom opening)
        for (const rose of roses) {
          const breeze =
            Math.sin(elapsed * 1.1 + rose.phase) * rose.swayAmp +
            Math.cos(elapsed * 2.15 + rose.phase * 1.4) * (rose.swayAmp * 0.45) +
            windGustCurrent * 0.18;
          rose.root.rotation.z = breeze;
          rose.root.rotation.x = Math.sin(elapsed * 0.85 + rose.phase) * (rose.swayAmp * 0.65);

          if (isVideoOverlay) {
            rose.root.position.y = rose.headWorldPos.y + Math.sin(elapsed * 0.9 + rose.phase) * 0.08;
          }

          const openPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.48 + rose.phase);
          for (const ip of rose.innerPetals) {
            ip.rotation.x = 0.24 + openPulse * 0.14;
          }
          for (const op of rose.outerPetals) {
            op.rotation.x = 0.58 + openPulse * 0.26;
          }
          if (rose.haloSprite) {
            const haloMat = rose.haloSprite.material as THREE.SpriteMaterial;
            haloMat.opacity = 0.42 + 0.32 * Math.sin(elapsed * 1.8 + rose.phase);
          }
        }

        // Released Drifting 3D Petals
        for (let i = 0; i < floatingPetalCount; i++) {
          const p = petalStates[i];
          p.pos.x += (p.vel.x + Math.sin(elapsed * 1.1 + p.phase) * 0.22 + windGustCurrent * 1.6) * rawDt;
          p.pos.y += (p.vel.y + Math.cos(elapsed * 1.6 + p.phase) * 0.08) * rawDt;
          p.pos.z += (p.vel.z + Math.sin(elapsed * 0.9 + p.phase) * 0.12) * rawDt;
          p.rot.x += p.rotSpeed.x * rawDt;
          p.rot.y += p.rotSpeed.y * rawDt;
          p.rot.z += p.rotSpeed.z * rawDt;

          const floorY = isVideoOverlay ? -1.4 : groundHeightAt(p.pos.x, p.pos.z) + 0.08;
          if (p.pos.y < floorY || p.pos.x > 16) {
            p.pos.set(
              (Math.random() - 0.5) * 12 - 2,
              3.5 + Math.random() * 2.5,
              isVideoOverlay ? 2 + Math.random() * 4 : (Math.random() - 0.5) * 10 - 2,
            );
          }
          _quat.setFromEuler(p.rot);
          _vec3b.set(1, 1, 1);
          _mat4.compose(p.pos, _quat, _vec3b);
          floatingPetalsInst.setMatrixAt(i, _mat4);
        }
        floatingPetalsInst.instanceMatrix.needsUpdate = true;

        // Composite 3D Butterflies
        for (let i = 0; i < butterflies.length; i++) {
          const b = butterflies[i];
          b.flutterBoost = THREE.MathUtils.damp(b.flutterBoost, 0, 1.8, rawDt);

          if (b.perchTimer > 0) {
            b.perchTimer -= rawDt;
            const targetRose = roses[b.perchRoseIndex];
            b.pos.lerp(
              _vec3.set(
                targetRose.headWorldPos.x,
                targetRose.headWorldPos.y + 0.16,
                targetRose.headWorldPos.z,
              ),
              Math.min(1, rawDt * 4.5),
            );
            b.flapPhase += rawDt * 2.4;
            const idleAngle = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(b.flapPhase));
            b.leftWing.rotation.z = -idleAngle;
            b.rightWing.rotation.z = idleAngle;
          } else {
            b.landingTimer -= rawDt;
            const distToTarget = b.pos.distanceTo(b.target);
            if (b.landingTimer <= 0 && !isVideoOverlay && !b.foreground) {
              b.perchRoseIndex = Math.floor(Math.random() * roses.length);
              b.perchTimer = 3.2 + Math.random() * 2.5;
              b.landingTimer = 8 + Math.random() * 10;
            } else if (distToTarget < 0.75) {
              const spanX = b.foreground ? 9 : 13;
              const zMin = b.foreground ? 2.2 : -9;
              const zMax = b.foreground ? 6.8 : 3.5;
              b.target.set(
                (Math.random() - 0.5) * spanX,
                0.7 + Math.random() * (b.foreground ? 2.5 : 2.8),
                zMin + Math.random() * (zMax - zMin),
              );
            }

            _vec3.subVectors(b.target, b.pos).normalize().multiplyScalar(1.35 * currentButterflyActivity + b.flutterBoost * 2.2);
            _vec3.x += Math.sin(elapsed * 1.7 + i) * 0.45 + windGustCurrent * 0.9;
            _vec3.y += Math.cos(elapsed * 2.1 + i * 1.4) * 0.28;
            b.vel.lerp(_vec3, Math.min(1, rawDt * 2.2));
            b.pos.addScaledVector(b.vel, rawDt);

            const flapHz = (b.flapSpeed + b.flutterBoost * 8.0) * (0.7 + 0.3 * currentButterflyActivity);
            b.flapPhase += rawDt * flapHz;
            const wingAngle = Math.sin(b.flapPhase) * 0.88 + 0.12;
            b.leftWing.rotation.z = -wingAngle;
            b.rightWing.rotation.z = wingAngle;
          }

          b.group.position.copy(b.pos);
          if (b.vel.lengthSq() > 0.001) {
            _vec3b.copy(b.pos).add(b.vel);
            b.group.lookAt(_vec3b);
          }
        }

        // Click Sparkle Burst Particles
        let burstUpdated = false;
        for (let i = 0; i < burstCount; i++) {
          if (burstLife[i] > 0) {
            burstLife[i] -= rawDt;
            burstPositions[i * 3] += burstVelocities[i].x * rawDt;
            burstPositions[i * 3 + 1] += burstVelocities[i].y * rawDt;
            burstPositions[i * 3 + 2] += burstVelocities[i].z * rawDt;
            burstVelocities[i].y -= 1.2 * rawDt;
            burstUpdated = true;
            if (burstLife[i] <= 0) {
              burstPositions[i * 3 + 1] = -999;
            }
          }
        }
        if (burstUpdated) {
          burstGeo.attributes.position.needsUpdate = true;
        }

        // Night Fireflies
        if (ffMat.opacity > 0.02) {
          for (let i = 0; i < fireflyCount; i++) {
            const s = ffSeeds[i];
            ffPos[i * 3] = s.baseX + Math.sin(elapsed * s.speed + s.phase) * 0.85;
            ffPos[i * 3 + 1] = s.baseY + Math.cos(elapsed * (s.speed * 1.2) + s.phase) * 0.45;
            ffPos[i * 3 + 2] = s.baseZ + Math.sin(elapsed * (s.speed * 0.8) + s.phase * 1.7) * 0.85;
          }
          ffGeo.attributes.position.needsUpdate = true;
        }

        const parallaxX = pointerX * (gardenModeRef.current ? 1.45 : 0.75);
        const parallaxY = 2.32 + pointerY * (gardenModeRef.current ? 0.52 : 0.25) + Math.sin(elapsed * 0.35) * 0.08;
        currentCamX = THREE.MathUtils.damp(currentCamX, parallaxX, 3.0, rawDt);
        currentCamY = THREE.MathUtils.damp(currentCamY, parallaxY, 3.0, rawDt);
        camera.position.set(currentCamX, currentCamY, 11.4);
        camera.lookAt(currentCamX * 0.3, 1.35 + pointerY * 0.2, -9.5);

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(rawGl, tick);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(rawGl, tick);
    } else {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', onResize);

      for (const item of disposables) {
        item.dispose();
      }
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [backdropStyle, reducedMotion]);

  const activeMoodPreset = MOOD_PRESETS[resolvedMood];

  return (
    <>
      {/* 4K Dream Garden Video Stage (Default Primary 3D Garden Backdrop) */}
      {backdropStyle === 'video' && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-0 overflow-hidden bg-[#14080E]"
        >
          <div
            ref={videoStageRef}
            className="h-full w-full transition-[filter] duration-1000 will-change-transform"
            style={{ filter: activeMoodPreset.videoFilter }}
          >
            <video
              ref={videoRef}
              src={GARDEN_VIDEO_SRC}
              autoPlay
              muted={!videoSoundOn}
              playsInline
              preload="auto"
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={handleVideoTimeUpdate}
              className="h-full w-full object-cover"
            />
          </div>
          {/* Time-of-day atmospheric color & lighting glaze */}
          <div
            className={`pointer-events-none absolute inset-0 transition-all duration-1000 ${activeMoodPreset.videoOverlayClass}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_58%,rgba(16,6,11,0.34)_100%)]" />
        </div>
      )}

      {/* Three.js Canvas Layer (Transparent 3D butterflies/petals/fireflies/roses in video mode, full 3D garden in procedural mode) */}
      <div
        ref={mountRef}
        aria-hidden="true"
        className={`fixed inset-0 z-0 ${hoveredCursor ? 'cursor-pointer' : ''}`}
      >
        {(reducedMotion || webglUnavailable) && backdropStyle === 'procedural' && (
          <div
            className={`absolute inset-0 transition-colors duration-700 ${
              resolvedMood === 'night'
                ? 'bg-gradient-to-b from-[#090C24] via-[#1B1D4A] to-[#23322D]'
                : resolvedMood === 'evening'
                  ? 'bg-gradient-to-b from-[#694270] via-[#CE7B8C] to-[#F7B98E]'
                  : resolvedMood === 'morning'
                    ? 'bg-gradient-to-b from-[#8ABBE6] via-[#F7CEBE] to-[#FCEBD2]'
                    : 'bg-gradient-to-b from-[#6BAFE4] via-[#ACD8F7] to-[#E6F4DF]'
            }`}
          />
        )}
      </div>

      {/* Interactive Flower Whisper / Special Rose Memory / Butterfly Toast */}
      {popup && (
        <div
          role="dialog"
          aria-label="Garden Memory Interaction"
          data-garden-hud="true"
          className="fixed right-4 bottom-24 z-40 w-[min(92vw,360px)] rounded-3xl border border-[#D6B477]/70 bg-[#FFF9F2]/95 p-4 text-[#542D3A] shadow-2xl sm:right-6 sm:bottom-6 dark:border-[#D6B477]/55 dark:bg-[#1D0B14]/95 dark:text-[#FFF5F0]"
        >
          <button
            type="button"
            onClick={() => setPopup(null)}
            aria-label="Close message"
            className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#D6B477]/45 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#2F1522] dark:text-[#FFF5F0]"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {popup.kind === 'butterfly' && (
            <div className="flex items-start gap-3 pr-6">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#FCE8E8] text-[#C98291] dark:bg-[#3A1828] dark:text-[#E7C38A]">
                <Heart className="h-4 w-4 fill-current" />
              </span>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                  Butterfly Flutter
                </p>
                <p className="mt-1 text-sm font-medium leading-relaxed">{popup.message}</p>
              </div>
            </div>
          )}

          {popup.kind === 'whisper' && (
            <div className="space-y-2 pr-6">
              <div className="flex items-center gap-2 text-[#C98291] dark:text-[#E7C38A]">
                <Flower2 className="h-4 w-4" />
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase">
                  {popup.title}
                </p>
              </div>
              <p className="font-handwriting text-2xl leading-snug text-[#542D3A] dark:text-[#FFF5F0]">
                &ldquo;{popup.message}&rdquo;
              </p>
              <p className="text-[11px] font-semibold text-[#8c5263] dark:text-[#D9B8C2]">
                — With love, {popup.accent}
              </p>
            </div>
          )}

          {popup.kind === 'memory' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pr-6 text-[#C98291] dark:text-[#E7C38A]">
                <Sparkles className="h-4 w-4" />
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase">
                  Hidden Rose Memory
                </p>
              </div>
              <div className="aspect-[16/10] overflow-hidden rounded-2xl border border-[#D6B477]/45 bg-[#FCE8E8]">
                <SecurePhotoImg
                  src={popup.imageData}
                  variant="full"
                  lazy={false}
                  alt={popup.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <p className="font-serif-display text-lg font-bold leading-snug">{popup.title}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[#9A6876] dark:text-[#D9B8C2]">
                  {popup.date} · {popup.location}
                </p>
                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[#6c4150] dark:text-[#DEC6CE]">
                  {popup.caption}
                </p>
              </div>
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => {
                    setPopup(null);
                    setGardenModeActive(false);
                    onNavigate('travels');
                  }}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>Explore All Photos</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Clean Full-Screen Garden Mode Minimal UI */}
      {gardenModeActive && (
        <div
          data-garden-hud="true"
          className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-between p-4 sm:p-6"
        >
          {/* Top Bar */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="pointer-events-auto rounded-3xl border border-[#D6B477]/65 bg-[#FFF9F2]/92 px-5 py-3.5 text-[#542D3A] shadow-xl dark:border-[#D6B477]/50 dark:bg-[#1A0912]/90 dark:text-[#FFF5F0]">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                {backdropStyle === 'video' ? 'Dream Villa 3D Garden Tour' : 'Procedural 3D Garden'} ·{' '}
                {activeMoodPreset.label}
              </p>
              <h2 className="mt-0.5 font-serif-display text-xl font-bold sm:text-2xl">
                Forever Yours — {config.himName} &amp; {config.herName}
              </h2>
              <p className="mt-0.5 text-xs text-[#7D5260] dark:text-[#D9B8C2]">
                Click any glowing rose or butterfly to reveal romantic memories &amp; notes.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setGardenModeActive(false)}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#D6B477] bg-[#542D3A] px-5 py-2.5 text-xs font-semibold text-[#FFF9F2] shadow-xl transition-transform hover:scale-[1.02] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Website</span>
            </button>
          </div>

          {/* Bottom Interactive Dock */}
          <div className="flex flex-col items-center gap-2">
            {backdropStyle === 'video' && (
              <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-[#D6B477]/55 bg-[#FFF9F2]/90 px-3 py-1.5 text-[11px] font-semibold text-[#542D3A] shadow-lg dark:bg-[#1A0912]/90 dark:text-[#FFF5F0]">
                <span className="px-1.5 text-[#9A6876] dark:text-[#D9B8C2]">Walk-through Scenes:</span>
                {VIDEO_CHAPTERS.map((ch) => (
                  <button
                    key={ch.label}
                    type="button"
                    onClick={() => jumpVideoChapter(ch.time)}
                    className="rounded-full border border-[#D6B477]/45 bg-white px-2.5 py-0.5 hover:bg-[#FCE8E8] dark:bg-[#2A111D] dark:hover:bg-[#3A192A]"
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            )}

            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-1.5 rounded-3xl border border-[#D6B477]/65 bg-[#FFF9F2]/92 p-2 text-[#542D3A] shadow-2xl dark:border-[#D6B477]/50 dark:bg-[#1A0912]/90 dark:text-[#FFF5F0]">
              {/* Style switcher */}
              <button
                type="button"
                onClick={() => setBackdropStyle((s) => (s === 'video' ? 'procedural' : 'video'))}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-3 py-1.5 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#2A111D] dark:text-[#FCE8E8]"
              >
                {backdropStyle === 'video' ? (
                  <>
                    <Film className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                    <span>Garden Video (Active)</span>
                  </>
                ) : (
                  <>
                    <Trees className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                    <span>3D Meadow (Active)</span>
                  </>
                )}
              </button>

              <span className="mx-0.5 hidden h-5 w-px bg-[#D6B477]/45 sm:inline-block" />

              {(
                [
                  { id: 'auto', label: 'Auto', icon: CloudSun },
                  { id: 'morning', label: 'Morning', icon: Sunrise },
                  { id: 'afternoon', label: 'Day', icon: Sun },
                  { id: 'evening', label: 'Evening', icon: Sunset },
                  { id: 'night', label: 'Night', icon: Moon },
                ] as { id: GardenTimeOfDay; label: string; icon: typeof Sun }[]
              ).map((item) => {
                const Icon = item.icon;
                const active = gardenMood === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGardenMood(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-[#542D3A] text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                        : 'hover:bg-[#FCE8E8] dark:hover:bg-[#311622]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <span className="mx-0.5 hidden h-5 w-px bg-[#D6B477]/45 sm:inline-block" />

              <button
                type="button"
                onClick={triggerWindBurst}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/55 bg-white px-3 py-1.5 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#2A111D] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
              >
                <Wind className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                <span>Gentle Breeze</span>
              </button>

              {backdropStyle === 'video' && (
                <button
                  type="button"
                  onClick={() => setVideoSoundOn((v) => !v)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    videoSoundOn
                      ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                      : 'border-[#D6B477]/55 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#2A111D] dark:text-[#FCE8E8]'
                  }`}
                >
                  <Music2 className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                  <span>{videoSoundOn ? 'Video Audio On' : 'Video Audio'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleToggleAudio}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  soundOn
                    ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                    : 'border-[#D6B477]/55 bg-white text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#2A111D] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
                }`}
              >
                {soundOn ? (
                  <Volume2 className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
                <span>{soundOn ? 'Nature Sound On' : 'Garden Sounds'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
