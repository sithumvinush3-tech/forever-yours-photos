import { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Check,
  Flower2,
  Gift,
  Maximize2,
  Minimize2,
  Moon,
  Music,
  RotateCcw,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
  Wind,
  X,
} from 'lucide-react';
import { useMemories, type BgDecorPreset } from '../context/MemoryContext';
import type { BackgroundDecor, GardenTimeOfDay, NavTab } from '../types';
import { MUSIC_TRACKS, birthdayAudio } from '../utils/audioEngine';
import { SurpriseModal } from './SurpriseModal';

const TABS: { id: NavTab; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'arcade', label: 'Love Arcade ❤️' },
  { id: 'garden', label: 'Memory Garden' },
  { id: 'intro', label: 'Intro' },
  { id: 'celebration', label: 'Celebration' },
  { id: 'travels', label: 'Gallery & Map' },
  { id: 'world3d', label: '3D Carousel' },
  { id: 'year-review', label: 'Year in Review' },
  { id: 'firsts', label: 'Our Firsts' },
  { id: 'photobooth', label: 'Photo Booth' },
  { id: 'story', label: 'Our Story' },
  { id: 'scratch', label: 'Scratch-Off' },
  { id: 'diary', label: 'Diary & Vault' },
  { id: 'starmap', label: 'Star Map' },
  { id: 'rose', label: 'Eternal Rose' },
  { id: 'letters', label: 'Letters & Movie' },
  { id: 'studio', label: 'Studio (Admin)' },
];

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPrintBook: () => void;
}

export function Header({ activeTab, onSelectTab, onOpenPrintBook }: HeaderProps) {
  const {
    config,
    surprises,
    themeMode,
    toggleThemeMode,
    bgDecor,
    toggleBgDecor,
    applyBgPreset,
    triggerFireworkBurst,
    gardenMood,
    setGardenMood,
    setGardenModeActive,
    triggerWindBurst,
    resetAllActivities,
  } = useMemories();
  const [audioState, setAudioState] = useState(birthdayAudio.getState());
  const [showMusicMenu, setShowMusicMenu] = useState(false);
  const [showDecorMenu, setShowDecorMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSurpriseModal, setShowSurpriseModal] = useState(false);
  const [surpriseSeedIndex, setSurpriseSeedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const musicMenuRef = useRef<HTMLDivElement | null>(null);
  const decorMenuRef = useRef<HTMLDivElement | null>(null);

  const openSurprise = () => {
    const len = Math.max(1, surprises.length);
    setSurpriseSeedIndex(Math.floor(Math.random() * len));
    setShowSurpriseModal(true);
  };

  useEffect(() => {
    return birthdayAudio.subscribe(() => setAudioState(birthdayAudio.getState()));
  }, []);

  useEffect(() => {
    if (!showMusicMenu && !showDecorMenu && !showResetModal) return;
    const onPointerDown = (e: MouseEvent) => {
      if (musicMenuRef.current && !musicMenuRef.current.contains(e.target as Node)) {
        setShowMusicMenu(false);
      }
      if (decorMenuRef.current && !decorMenuRef.current.contains(e.target as Node)) {
        setShowDecorMenu(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMusicMenu(false);
        setShowDecorMenu(false);
        setShowResetModal(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showMusicMenu, showDecorMenu, showResetModal]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Ignore if fullscreen blocked by browser frame
    }
  };

  const gardenOnHome = activeTab === 'home' && bgDecor.livingGarden;

  return (
    <header
      className={`no-print sticky top-0 z-50 flex w-full flex-col border-b border-[#D6B477]/40 transition-colors dark:border-[#D6B477]/30 ${
        gardenOnHome
          ? 'bg-[#FFF9F2]/96 dark:bg-[#160910]/96'
          : 'bg-[#FFF9F2]/90 backdrop-blur-md dark:bg-[#160910]/90'
      }`}
    >
      {/* Top Row: Brand & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6B477]/20 px-4 py-2.5 sm:px-6 dark:border-[#D6B477]/15">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#C98291]"
        >
          <span className="text-base text-[#C98291] dark:text-[#E7C38A]" aria-hidden="true">
            ♥
          </span>
          <span className="font-serif-display text-xl font-bold tracking-tight text-[#542D3A] dark:text-[#FFF5F0] sm:text-2xl">
            Forever Yours
          </span>
          <span className="hidden text-xs font-medium tracking-[0.18em] text-[#9A6876] uppercase sm:inline dark:text-[#D9B8C2]">
            · {config.himName} &amp; {config.herName}
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* Surprise Quote / Secret Memory Trigger */}
          <button
            type="button"
            onClick={openSurprise}
            title="Open a random heartwarming quote or secret memory"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C98291]/60 bg-[#FCE8E8]/90 px-3.5 py-1.5 text-xs font-semibold text-[#542D3A] whitespace-nowrap shrink-0 transition-colors hover:border-[#C98291] hover:bg-[#f7d8de] dark:border-[#E7C38A]/55 dark:bg-[#3A192A] dark:text-[#FFF5F0] dark:hover:bg-[#4E2138]"
          >
            <Gift className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
            <span>Surprise</span>
          </button>

          {/* Day / Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleThemeMode}
            title={themeMode === 'dark' ? 'Switch to Day Mode' : 'Switch to Creative Dark Mode'}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/50 bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#542D3A] whitespace-nowrap shrink-0 transition-colors hover:border-[#C98291] hover:bg-[#FCE8E8] dark:border-[#D6B477]/40 dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
          >
            {themeMode === 'dark' ? (
              <>
                <Sun className="h-3.5 w-3.5 text-[#E7C38A]" />
                <span className="hidden sm:inline">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-[#C98291]" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            )}
          </button>

          {/* Decorate Background Controls */}
          <div ref={decorMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowDecorMenu((v) => !v)}
              title="Decorate Background (Fireworks, Roses, Vines, Stars, Petals)"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                showDecorMenu
                  ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                  : 'border-[#D6B477]/50 bg-white/85 text-[#542D3A] hover:border-[#C98291] hover:bg-[#FCE8E8] dark:border-[#D6B477]/40 dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D6B477] dark:text-[#E7C38A]" />
              <span className="hidden sm:inline">Decorate</span>
            </button>

            {showDecorMenu && (
              <div className="fixed inset-x-4 top-16 z-50 rounded-2xl border border-[#D6B477]/55 bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:top-11 sm:right-0 sm:w-80 dark:border-[#D6B477]/45 dark:bg-[#210E18] dark:text-[#FFF5F0]">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                    Decorate Background
                  </p>
                  <button
                    type="button"
                    onClick={triggerFireworkBurst}
                    className="inline-flex items-center gap-1 rounded-full bg-[#542D3A] px-2.5 py-1 text-[11px] font-semibold text-[#FFF9F2] transition-colors hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1B0911]"
                  >
                    <Sparkles className="h-3 w-3 text-[#D6B477] dark:text-[#1B0911]" />
                    <span>Launch Fireworks</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { key: 'livingGarden', label: '3D Living Garden' },
                      { key: 'fireworks', label: 'Fireworks' },
                      { key: 'roses', label: 'Floating Roses' },
                      { key: 'vines', label: 'Flower Vines' },
                      { key: 'stars', label: 'Twinkling Stars' },
                      { key: 'petals', label: 'Rose Petals' },
                      { key: 'immersiveBackdrop', label: 'Silk Photo Glow' },
                    ] as { key: keyof BackgroundDecor; label: string }[]
                  ).map((item) => {
                    const active = bgDecor[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleBgDecor(item.key)}
                        className={`flex items-center justify-between rounded-xl border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                          active
                            ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                            : 'border-[#D6B477]/30 bg-[#FFF9F2]/60 text-[#7D5260] hover:bg-[#FFF9F2] dark:bg-[#2A1320]/60 dark:text-[#D9B8C2] dark:hover:bg-[#2F1522]'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                        {active && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#C98291] dark:text-[#E7C38A]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 border-t border-[#D6B477]/30 pt-3">
                  <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                    3D Garden Time &amp; Breeze
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        { id: 'auto', label: 'Auto' },
                        { id: 'morning', label: 'Morning' },
                        { id: 'afternoon', label: 'Day' },
                        { id: 'evening', label: 'Sunset' },
                        { id: 'night', label: 'Night' },
                      ] as { id: GardenTimeOfDay; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setGardenMood(m.id)}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                          gardenMood === m.id
                            ? 'border-[#C98291] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                            : 'border-[#D6B477]/40 bg-[#FFF9F2] text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (!bgDecor.livingGarden) toggleBgDecor('livingGarden');
                        setShowDecorMenu(false);
                        setGardenModeActive(true);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#542D3A] px-2.5 py-1.5 text-[11px] font-semibold text-[#FFF9F2] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                    >
                      <Flower2 className="h-3.5 w-3.5" />
                      <span>Garden Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={triggerWindBurst}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#D6B477]/50 bg-[#FFF9F2] px-2.5 py-1.5 text-[11px] font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
                    >
                      <Wind className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                      <span>Gentle Breeze</span>
                    </button>
                  </div>
                </div>

                <div className="mt-3 border-t border-[#D6B477]/30 pt-3">
                  <p className="mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-[#9A6876] uppercase dark:text-[#D9B8C2]">
                    Quick Atmosphere Presets
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'enchanted', label: 'Full Enchantment' },
                        { id: 'fireworks', label: 'Fireworks Gala' },
                        { id: 'garden', label: 'Rose Vine Garden' },
                        { id: 'minimal', label: 'Calm & Minimal' },
                      ] as { id: BgDecorPreset; label: string }[]
                    ).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyBgPreset(preset.id)}
                        className="rounded-lg border border-[#D6B477]/40 bg-[#FFF9F2] px-2.5 py-1.5 text-[11px] font-semibold text-[#542D3A] transition-colors hover:border-[#C98291] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            title="Reset activities (scratch-off cards, petals, wax seals, quiz, coupons) without removing curated photos or details"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/50 bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#542D3A] whitespace-nowrap shrink-0 transition-colors hover:border-[#C98291] hover:bg-[#FCE8E8] dark:border-[#D6B477]/40 dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
            <span className="hidden sm:inline">Reset Activities</span>
          </button>

          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Mode'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D6B477]/45 bg-white/80 text-[#542D3A] transition-colors hover:border-[#C98291] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <div ref={musicMenuRef} className="relative flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => birthdayAudio.togglePlay()}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                audioState.playing
                  ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                  : 'border-[#D6B477]/50 bg-white/80 text-[#542D3A] hover:bg-[#FCE8E8]/60 dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
              }`}
            >
              <Music className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
              <span className="hidden md:inline">
                {audioState.playing ? `Pause · ${audioState.trackTitle}` : 'Birthday Music'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => birthdayAudio.toggleMute()}
              aria-label={audioState.muted ? 'Unmute music' : 'Mute music'}
              title="Mute / Unmute"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D6B477]/45 bg-white/80 text-[#542D3A] transition-colors hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
            >
              {audioState.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowMusicMenu((v) => !v)}
              title="Choose Song & Adjust Volume"
              className="inline-flex h-9 items-center rounded-full border border-[#D6B477]/45 bg-white/80 px-2.5 text-xs font-medium text-[#542D3A] hover:bg-[#FCE8E8] tabular-nums dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
            >
              Tracks · {Math.round(audioState.volume * 100)}%
            </button>

            {showMusicMenu && (
              <div className="fixed inset-x-4 top-16 z-50 rounded-2xl border border-[#D6B477]/50 bg-white p-4 shadow-2xl sm:absolute sm:inset-x-auto sm:top-11 sm:right-0 sm:w-72 dark:border-[#D6B477]/40 dark:bg-[#210E18] dark:text-[#FFF5F0]">
                <p className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                  Select Birthday Song
                </p>
                <div className="space-y-1.5">
                  {MUSIC_TRACKS.map((track) => {
                    const selected = audioState.trackId === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          birthdayAudio.setTrack(track.id);
                          if (!audioState.playing) birthdayAudio.start();
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors ${
                          selected
                            ? 'bg-[#FCE8E8] font-semibold text-[#542D3A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                            : 'text-[#6c4150] hover:bg-[#FFF9F2] dark:text-[#D9B8C2] dark:hover:bg-[#2D1421]'
                        }`}
                      >
                        <div>
                          <p>{track.title}</p>
                          <p className="text-[10px] opacity-75">{track.subtitle}</p>
                        </div>
                        {selected && (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#C98291] dark:text-[#E7C38A]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 border-t border-[#D6B477]/30 pt-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-[#542D3A] dark:text-[#FCE8E8]">
                    <span>Volume</span>
                    <span className="tabular-nums">{Math.round(audioState.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audioState.volume}
                    onChange={(e) => birthdayAudio.setVolume(Number(e.target.value))}
                    className="w-full accent-[#C98291]"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenPrintBook}
            title="Open Printable Memory Book"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#542D3A]/25 bg-[#542D3A] px-4 py-1.5 text-xs font-semibold text-[#FFF9F2] whitespace-nowrap shrink-0 transition-colors hover:bg-[#6d3b4c] dark:border-[#D6B477]/50 dark:bg-[#3A1828] dark:text-[#FFF5F0] dark:hover:bg-[#542D3A]"
          >
            <BookOpen className="h-3.5 w-3.5 text-[#D6B477] dark:text-[#E7C38A]" />
            <span className="hidden sm:inline">Memory Book</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Clean Horizontal Navigation Tabs */}
      <nav
        aria-label="Primary Sections"
        className="header-nav-tabs flex items-center gap-1.5 overflow-x-auto bg-white/65 px-4 py-2 sm:px-6 dark:bg-[#1B0B14]/70"
      >
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-all sm:text-sm ${
                active
                  ? 'bg-[#542D3A] text-[#FFF9F2] shadow-sm dark:bg-[#E7C38A] dark:text-[#1A0810]'
                  : 'text-[#6c4150] hover:bg-[#FCE8E8] hover:text-[#542D3A] dark:text-[#DEC6CE] dark:hover:bg-[#2F1522] dark:hover:text-[#FFF5F0]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Safe Reset Activities Confirmation Modal */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-activities-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1b0912]/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowResetModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl border-2 border-[#D6B477] bg-[#FFF9F2] p-6 text-[#542D3A] shadow-2xl dark:bg-[#1D0B14] dark:text-[#FFF5F0]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FCE8E8] text-[#542D3A] dark:bg-[#3A192A] dark:text-[#E7C38A]">
                  <RotateCcw className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                    Fresh Replay
                  </p>
                  <h3
                    id="reset-activities-title"
                    className="font-serif-display text-2xl font-bold"
                  >
                    Reset App Activities?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                aria-label="Close modal"
                className="rounded-full p-1.5 text-[#7D5260] hover:bg-[#FCE8E8] dark:text-[#D9B8C2] dark:hover:bg-[#3A192A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs leading-relaxed">
              <div className="rounded-2xl border border-[#D6B477]/45 bg-white p-3.5 dark:bg-[#27111C]">
                <p className="font-semibold text-[#542D3A] dark:text-[#FFF5F0]">
                  This will reset only your interactive play activities:
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[#6c4150] dark:text-[#EAD0D9]">
                  <li>Scratch-Off Memory Cards (gold foil coated again)</li>
                  <li>Eternal Rose plucked petals &amp; VIP reveal</li>
                  <li>Birthday cake candles, surprise box &amp; wax-seal notes</li>
                  <li>Claimed love coupons, diary lock &amp; Love Arcade progress</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-emerald-500/35 bg-emerald-50/80 p-3.5 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200">
                <p className="font-semibold">Your curated memories stay 100% safe:</p>
                <p className="mt-1">
                  Curated photos, story chapters, love letters, portraits, and relationship details
                  will NOT be deleted or changed.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="rounded-full border border-[#D6B477]/60 bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void resetAllActivities();
                  setShowResetModal(false);
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Activities</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showSurpriseModal && surprises.length > 0 && (
        <SurpriseModal
          surprises={surprises}
          initialIndex={surpriseSeedIndex}
          onClose={() => setShowSurpriseModal(false)}
        />
      )}
    </header>
  );
}
