import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ARCADE_BADGES,
  DEFAULT_ARCADE_CONFIG,
  DEFAULT_ARCADE_QUESTIONS,
  DEFAULT_CONFIG,
  DEFAULT_KEEPSAKES,
  DEFAULT_LETTERS,
  DEFAULT_MILESTONES,
  DEFAULT_PHOTOS,
  DEFAULT_SURPRISES,
} from '../data/seedData';
import type {
  AppConfig,
  ArcadeConfig,
  ArcadeDifficulty,
  ArcadeGameId,
  ArcadeProfile,
  ArcadeQuestion,
  ArcadeScore,
  BackgroundDecor,
  DiaryEntry,
  GardenTimeOfDay,
  LoveLetter,
  MemoryKeepsake,
  MemoryPhoto,
  Milestone,
  StoryEntry,
  SurpriseItem,
  TravelMemory,
  VideoMemory,
  VoiceMemory,
} from '../types';
import { sortByDateAsc } from '../utils/dates';

export type BgDecorPreset = 'enchanted' | 'fireworks' | 'garden' | 'minimal';

const BG_DECOR_PRESETS: Record<BgDecorPreset, BackgroundDecor> = {
  enchanted: {
    fireworks: true,
    roses: true,
    vines: true,
    stars: true,
    petals: true,
    immersiveBackdrop: true,
    livingGarden: true,
  },
  fireworks: {
    fireworks: true,
    roses: true,
    vines: false,
    stars: true,
    petals: false,
    immersiveBackdrop: true,
    livingGarden: false,
  },
  garden: {
    fireworks: false,
    roses: true,
    vines: true,
    stars: true,
    petals: true,
    immersiveBackdrop: false,
    livingGarden: true,
  },
  minimal: {
    fireworks: false,
    roses: false,
    vines: false,
    stars: true,
    petals: false,
    immersiveBackdrop: false,
    livingGarden: false,
  },
};

const DEFAULT_BG_DECOR: BackgroundDecor = { ...BG_DECOR_PRESETS.enchanted };

const LOCAL_PROFILE_STORAGE_KEY = 'fy_arcade_local_profile';
const LOCAL_SCORES_STORAGE_KEY = 'fy_arcade_local_scores';
const LOCAL_COUPONS_STORAGE_KEY = 'fy_claimed_coupons';
const THEME_STORAGE_KEY = 'fy_theme_mode';
const BG_DECOR_STORAGE_KEY = 'fy_bg_decor_v4';
const GARDEN_MOOD_STORAGE_KEY = 'fy_garden_mood';

const STUDIO_CONFIG_KEY = 'fy_studio_config_v1';
const STUDIO_MILESTONES_KEY = 'fy_studio_milestones_v1';
const STUDIO_PHOTOS_KEY = 'fy_studio_photos_v1';
const STUDIO_SURPRISES_KEY = 'fy_studio_surprises_v1';

function readJsonStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJsonStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
}

function loadInitialConfig(): AppConfig {
  const saved = readJsonStorage<Partial<AppConfig> | null>(STUDIO_CONFIG_KEY, null);
  if (!saved || typeof saved !== 'object') return DEFAULT_CONFIG;
  return {
    ...DEFAULT_CONFIG,
    ...saved,
  };
}

function loadInitialMilestones(): Milestone[] {
  const saved = readJsonStorage<Milestone[] | null>(STUDIO_MILESTONES_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return saved;
  return DEFAULT_MILESTONES;
}

function loadInitialPhotos(): MemoryPhoto[] {
  const saved = readJsonStorage<MemoryPhoto[] | null>(STUDIO_PHOTOS_KEY, null);
  if (!Array.isArray(saved) || saved.length === 0) return DEFAULT_PHOTOS;
  const savedIds = new Set(saved.map((p) => p.id));
  const missingSeeds = DEFAULT_PHOTOS.filter((p) => !savedIds.has(p.id));
  return missingSeeds.length > 0 ? [...saved, ...missingSeeds] : saved;
}

function loadInitialSurprises(): SurpriseItem[] {
  const saved = readJsonStorage<SurpriseItem[] | null>(STUDIO_SURPRISES_KEY, null);
  if (Array.isArray(saved) && saved.length > 0) return saved;
  return DEFAULT_SURPRISES;
}

function loadInitialArcadeProfile(): ArcadeProfile {
  try {
    const raw = localStorage.getItem(LOCAL_PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ArcadeProfile>;
      return {
        uid: parsed.uid || 'local-guest',
        playerLabel: parsed.playerLabel || 'Manika',
        xp: Number(parsed.xp || 0),
        totalGamesPlayed: Number(parsed.totalGamesPlayed || 0),
        gamesCompleted: Number(parsed.gamesCompleted || 0),
        bestMemoryDetective: Number(parsed.bestMemoryDetective || 0),
        bestFireflyHunt: Number(parsed.bestFireflyHunt || 0),
        bestUnlockMyHeart: Number(parsed.bestUnlockMyHeart || 0),
        completedGames: Array.isArray(parsed.completedGames) ? parsed.completedGames : [],
        badges: Array.isArray(parsed.badges) ? parsed.badges : [],
        unlockedMessages: Array.isArray(parsed.unlockedMessages) ? parsed.unlockedMessages : [],
        updatedAt: parsed.updatedAt,
      };
    }
  } catch {
    // ignore invalid JSON
  }
  return {
    uid: 'local-guest',
    playerLabel: 'Manika',
    xp: 0,
    totalGamesPlayed: 0,
    gamesCompleted: 0,
    bestMemoryDetective: 0,
    bestFireflyHunt: 0,
    bestUnlockMyHeart: 0,
    completedGames: [],
    badges: [],
    unlockedMessages: [],
  };
}

function loadInitialArcadeScores(): ArcadeScore[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

interface MemoryContextValue {
  themeMode: 'light' | 'dark';
  toggleThemeMode: () => void;
  bgDecor: BackgroundDecor;
  toggleBgDecor: (key: keyof BackgroundDecor) => void;
  applyBgPreset: (preset: BgDecorPreset) => void;
  fireworkBurstTick: number;
  triggerFireworkBurst: () => void;
  gardenMood: GardenTimeOfDay;
  setGardenMood: (mood: GardenTimeOfDay) => void;
  gardenModeActive: boolean;
  setGardenModeActive: (active: boolean) => void;
  windBurstTick: number;
  triggerWindBurst: () => void;

  config: AppConfig;
  milestones: Milestone[];
  allMilestones: Milestone[];
  photos: MemoryPhoto[];
  allPhotos: MemoryPhoto[];
  surprises: SurpriseItem[];
  videos: VideoMemory[];
  letters: LoveLetter[];
  voiceMemories: VoiceMemory[];
  keepsakes: MemoryKeepsake[];
  diaryEntries: DiaryEntry[];
  stories: StoryEntry[];
  travels: TravelMemory[];

  updateConfig: (patch: Partial<AppConfig>) => void;
  upsertMilestone: (milestone: Milestone) => void;
  deleteMilestone: (id: string) => void;
  updatePhoto: (id: string, patch: Partial<MemoryPhoto>) => void;
  togglePhotoFavorite: (id: string) => void;
  upsertSurprise: (item: SurpriseItem) => void;
  deleteSurprise: (id: string) => void;
  resetStudioOverrides: () => void;
  exportStudioData: () => string;
  importStudioData: (json: string) => { ok: boolean; error?: string };

  claimLocalCoupon: (id: string) => void;
  claimedCouponIds: string[];
  suppressCloudCouponClaimed: boolean;
  activityResetTick: number;
  activityResetToast: string | null;
  dismissActivityResetToast: () => void;
  resetAllActivities: () => Promise<void>;

  arcadeConfig: ArcadeConfig;
  arcadeQuestions: ArcadeQuestion[];
  arcadeProfile: ArcadeProfile;
  arcadeScores: ArcadeScore[];
  arcadeLoading: boolean;
  submitArcadeResult: (input: {
    gameId: ArcadeGameId;
    difficulty: ArcadeDifficulty;
    score: number;
    xpEarned: number;
    completed: boolean;
    durationSec: number;
    qualifiesMaster?: boolean;
    roundNonce?: string;
  }) => Promise<{ newlyUnlockedBadges: string[]; savedToCloud: boolean }>;
}

const MemoryContext = createContext<MemoryContextValue | null>(null);

export function MemoryProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  const [bgDecor, setBgDecor] = useState<BackgroundDecor>(() => {
    try {
      const saved = localStorage.getItem(BG_DECOR_STORAGE_KEY);
      if (saved) return { ...DEFAULT_BG_DECOR, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_BG_DECOR;
  });

  const [gardenMood, setGardenMoodState] = useState<GardenTimeOfDay>(() => {
    try {
      const saved = localStorage.getItem(GARDEN_MOOD_STORAGE_KEY) as GardenTimeOfDay | null;
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'auto';
  });

  const [gardenModeActive, setGardenModeActive] = useState(false);
  const [fireworkBurstTick, setFireworkBurstTick] = useState(0);
  const [windBurstTick, setWindBurstTick] = useState(0);

  const [config, setConfig] = useState<AppConfig>(loadInitialConfig);
  const [allMilestones, setAllMilestones] = useState<Milestone[]>(loadInitialMilestones);
  const [allPhotos, setAllPhotos] = useState<MemoryPhoto[]>(loadInitialPhotos);
  const [surprises, setSurprises] = useState<SurpriseItem[]>(loadInitialSurprises);

  const [claimedCouponIds, setClaimedCouponIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_COUPONS_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [activityResetTick, setActivityResetTick] = useState(0);
  const [activityResetToast, setActivityResetToast] = useState<string | null>(null);

  const [arcadeProfile, setArcadeProfile] = useState<ArcadeProfile>(loadInitialArcadeProfile);
  const [arcadeScores, setArcadeScores] = useState<ArcadeScore[]>(loadInitialArcadeScores);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);

  useEffect(() => {
    try {
      localStorage.setItem(BG_DECOR_STORAGE_KEY, JSON.stringify(bgDecor));
    } catch {
      // ignore
    }
  }, [bgDecor]);

  const setGardenMood = useCallback((mood: GardenTimeOfDay) => {
    setGardenMoodState(mood);
    try {
      localStorage.setItem(GARDEN_MOOD_STORAGE_KEY, mood);
    } catch {
      // ignore
    }
  }, []);

  const toggleThemeMode = useCallback(() => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleBgDecor = useCallback((key: keyof BackgroundDecor) => {
    setBgDecor((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const applyBgPreset = useCallback((preset: BgDecorPreset) => {
    setBgDecor({ ...BG_DECOR_PRESETS[preset] });
  }, []);

  const triggerFireworkBurst = useCallback(() => {
    setBgDecor((prev) => (prev.fireworks ? prev : { ...prev, fireworks: true }));
    setFireworkBurstTick((prev) => prev + 1);
  }, []);

  const triggerWindBurst = useCallback(() => {
    setWindBurstTick((prev) => prev + 1);
  }, []);

  const milestones = useMemo(
    () => sortByDateAsc(allMilestones.filter((m) => m.published)),
    [allMilestones],
  );

  const photos = useMemo(
    () => sortByDateAsc(allPhotos.filter((p) => p.published)),
    [allPhotos],
  );

  const updateConfig = useCallback((patch: Partial<AppConfig>) => {
    setConfig((prev) => {
      const next: AppConfig = {
        ...prev,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      writeJsonStorage(STUDIO_CONFIG_KEY, next);
      return next;
    });
  }, []);

  const upsertMilestone = useCallback((milestone: Milestone) => {
    setAllMilestones((prev) => {
      const exists = prev.some((m) => m.id === milestone.id);
      const next = exists
        ? prev.map((m) => (m.id === milestone.id ? milestone : m))
        : [...prev, milestone];
      writeJsonStorage(STUDIO_MILESTONES_KEY, next);
      return next;
    });
  }, []);

  const deleteMilestone = useCallback((id: string) => {
    setAllMilestones((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target?.isDefaultSeed) return prev;
      const next = prev.filter((m) => m.id !== id);
      writeJsonStorage(STUDIO_MILESTONES_KEY, next);
      return next;
    });
  }, []);

  const updatePhoto = useCallback((id: string, patch: Partial<MemoryPhoto>) => {
    setAllPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, ...patch } : p));
      writeJsonStorage(STUDIO_PHOTOS_KEY, next);
      return next;
    });
  }, []);

  const togglePhotoFavorite = useCallback((id: string) => {
    setAllPhotos((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
      writeJsonStorage(STUDIO_PHOTOS_KEY, next);
      return next;
    });
  }, []);

  const upsertSurprise = useCallback((item: SurpriseItem) => {
    setSurprises((prev) => {
      const exists = prev.some((s) => s.id === item.id);
      const next = exists
        ? prev.map((s) => (s.id === item.id ? item : s))
        : [item, ...prev];
      writeJsonStorage(STUDIO_SURPRISES_KEY, next);
      return next;
    });
  }, []);

  const deleteSurprise = useCallback((id: string) => {
    setSurprises((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((s) => s.id !== id);
      writeJsonStorage(STUDIO_SURPRISES_KEY, next);
      return next;
    });
  }, []);

  const resetStudioOverrides = useCallback(() => {
    try {
      localStorage.removeItem(STUDIO_CONFIG_KEY);
      localStorage.removeItem(STUDIO_MILESTONES_KEY);
      localStorage.removeItem(STUDIO_PHOTOS_KEY);
      localStorage.removeItem(STUDIO_SURPRISES_KEY);
    } catch {
      // ignore
    }
    setConfig(DEFAULT_CONFIG);
    setAllMilestones(DEFAULT_MILESTONES);
    setAllPhotos(DEFAULT_PHOTOS);
    setSurprises(DEFAULT_SURPRISES);
  }, []);

  const exportStudioData = useCallback(() => {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        config,
        milestones: allMilestones,
        photos: allPhotos,
        surprises,
      },
      null,
      2,
    );
  }, [config, allMilestones, allPhotos, surprises]);

  const importStudioData = useCallback((json: string): { ok: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(json) as {
        config?: Partial<AppConfig>;
        milestones?: Milestone[];
        photos?: MemoryPhoto[];
        surprises?: SurpriseItem[];
      };
      if (!parsed || typeof parsed !== 'object') {
        return { ok: false, error: 'Invalid JSON backup object.' };
      }
      if (parsed.config && typeof parsed.config === 'object') {
        const nextConfig = { ...DEFAULT_CONFIG, ...parsed.config };
        setConfig(nextConfig);
        writeJsonStorage(STUDIO_CONFIG_KEY, nextConfig);
      }
      if (Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        setAllMilestones(parsed.milestones);
        writeJsonStorage(STUDIO_MILESTONES_KEY, parsed.milestones);
      }
      if (Array.isArray(parsed.photos) && parsed.photos.length > 0) {
        setAllPhotos(parsed.photos);
        writeJsonStorage(STUDIO_PHOTOS_KEY, parsed.photos);
      }
      if (Array.isArray(parsed.surprises) && parsed.surprises.length > 0) {
        setSurprises(parsed.surprises);
        writeJsonStorage(STUDIO_SURPRISES_KEY, parsed.surprises);
      }
      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Unable to parse backup JSON.',
      };
    }
  }, []);

  const videos = useMemo<VideoMemory[]>(() => [], []);
  const letters = useMemo(() => DEFAULT_LETTERS.filter((l) => l.published), []);
  const voiceMemories = useMemo<VoiceMemory[]>(() => [], []);
  const keepsakes = useMemo(() => DEFAULT_KEEPSAKES.filter((k) => k.published), []);
  const diaryEntries = useMemo<DiaryEntry[]>(() => [], []);
  const stories = useMemo<StoryEntry[]>(() => [], []);
  const travels = useMemo<TravelMemory[]>(() => [], []);

  const claimLocalCoupon = useCallback((id: string) => {
    setClaimedCouponIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      try {
        localStorage.setItem(LOCAL_COUPONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const resetAllActivities = useCallback(async () => {
    try {
      localStorage.removeItem('fy_scratched_cards');
      localStorage.removeItem('fy_scratched_cards_v1');
      localStorage.removeItem(LOCAL_COUPONS_STORAGE_KEY);
      localStorage.removeItem(LOCAL_PROFILE_STORAGE_KEY);
      localStorage.removeItem(LOCAL_SCORES_STORAGE_KEY);
    } catch {
      // ignore
    }
    setClaimedCouponIds([]);
    setArcadeProfile({
      uid: 'local-guest',
      playerLabel: 'Manika',
      xp: 0,
      totalGamesPlayed: 0,
      gamesCompleted: 0,
      bestMemoryDetective: 0,
      bestFireflyHunt: 0,
      bestUnlockMyHeart: 0,
      completedGames: [],
      badges: [],
      unlockedMessages: [],
    });
    setArcadeScores([]);
    setActivityResetTick((t) => t + 1);
    setActivityResetToast(
      'Activities reset! Scratch-off cards, petals, wax seals, coupons, and Love Arcade are fresh again — all photos and chapters stay safe.',
    );
  }, []);

  const dismissActivityResetToast = useCallback(() => {
    setActivityResetToast(null);
  }, []);

  useEffect(() => {
    if (!activityResetToast) return;
    const t = window.setTimeout(() => setActivityResetToast(null), 5500);
    return () => window.clearTimeout(t);
  }, [activityResetToast]);

  const submitArcadeResult = useCallback(
    async (input: {
      gameId: ArcadeGameId;
      difficulty: ArcadeDifficulty;
      score: number;
      xpEarned: number;
      completed: boolean;
      durationSec: number;
      qualifiesMaster?: boolean;
      roundNonce?: string;
    }) => {
      const completedGames = new Set<ArcadeGameId>(arcadeProfile.completedGames);
      if (input.completed) completedGames.add(input.gameId);

      const bestMemoryDetective =
        input.gameId === 'memory_detective'
          ? Math.max(arcadeProfile.bestMemoryDetective, input.score)
          : arcadeProfile.bestMemoryDetective;
      const bestFireflyHunt =
        input.gameId === 'firefly_hunt'
          ? Math.max(arcadeProfile.bestFireflyHunt, input.score)
          : arcadeProfile.bestFireflyHunt;
      const bestUnlockMyHeart =
        input.gameId === 'unlock_my_heart'
          ? Math.max(arcadeProfile.bestUnlockMyHeart, input.score)
          : arcadeProfile.bestUnlockMyHeart;
      const nextXp = arcadeProfile.xp + input.xpEarned;

      const badges = new Set<string>(arcadeProfile.badges);
      const unlockedMessages = new Set<string>(arcadeProfile.unlockedMessages);
      const newlyUnlockedBadges: string[] = [];

      const unlockBadge = (id: string, condition: boolean) => {
        if (condition && !badges.has(id)) {
          badges.add(id);
          newlyUnlockedBadges.push(id);
          const def = ARCADE_BADGES.find((b) => b.id === id);
          if (def?.rewardMessage) unlockedMessages.add(def.rewardMessage);
        }
      };

      unlockBadge(
        'memory-master',
        (input.gameId === 'memory_detective' && input.completed && input.score >= 300) ||
          Boolean(input.qualifiesMaster),
      );
      unlockBadge(
        'firefly-collector',
        input.gameId === 'firefly_hunt' && input.completed,
      );
      unlockBadge(
        'puzzle-champion',
        input.gameId === 'unlock_my_heart' && input.completed,
      );
      unlockBadge('keeper-of-memories', nextXp >= 500);
      unlockBadge('heart-explorer', completedGames.size >= 3);

      const nextProfile: ArcadeProfile = {
        ...arcadeProfile,
        xp: nextXp,
        totalGamesPlayed: arcadeProfile.totalGamesPlayed + 1,
        gamesCompleted: completedGames.size,
        bestMemoryDetective,
        bestFireflyHunt,
        bestUnlockMyHeart,
        completedGames: Array.from(completedGames),
        badges: Array.from(badges),
        unlockedMessages: Array.from(unlockedMessages),
        updatedAt: new Date().toISOString(),
      };

      const scoreEntry: ArcadeScore = {
        id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        playerUid: nextProfile.uid,
        playerLabel: nextProfile.playerLabel,
        gameId: input.gameId,
        difficulty: input.difficulty,
        score: input.score,
        xpEarned: input.xpEarned,
        completed: input.completed,
        durationSec: input.durationSec,
        createdAt: new Date().toISOString(),
      };

      setArcadeProfile(nextProfile);
      setArcadeScores((prev) => {
        const updated = [scoreEntry, ...prev].slice(0, 60);
        try {
          localStorage.setItem(LOCAL_SCORES_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      try {
        localStorage.setItem(LOCAL_PROFILE_STORAGE_KEY, JSON.stringify(nextProfile));
      } catch {
        // ignore
      }

      return { newlyUnlockedBadges, savedToCloud: false };
    },
    [arcadeProfile],
  );

  const value: MemoryContextValue = {
    themeMode,
    toggleThemeMode,
    bgDecor,
    toggleBgDecor,
    applyBgPreset,
    fireworkBurstTick,
    triggerFireworkBurst,
    gardenMood,
    setGardenMood,
    gardenModeActive,
    setGardenModeActive,
    windBurstTick,
    triggerWindBurst,

    config,
    milestones,
    allMilestones,
    photos,
    allPhotos,
    surprises,
    videos,
    letters,
    voiceMemories,
    keepsakes,
    diaryEntries,
    stories,
    travels,

    updateConfig,
    upsertMilestone,
    deleteMilestone,
    updatePhoto,
    togglePhotoFavorite,
    upsertSurprise,
    deleteSurprise,
    resetStudioOverrides,
    exportStudioData,
    importStudioData,

    claimLocalCoupon,
    claimedCouponIds,
    suppressCloudCouponClaimed: false,
    activityResetTick,
    activityResetToast,
    dismissActivityResetToast,
    resetAllActivities,

    arcadeConfig: DEFAULT_ARCADE_CONFIG,
    arcadeQuestions: DEFAULT_ARCADE_QUESTIONS,
    arcadeProfile,
    arcadeScores,
    arcadeLoading: false,
    submitArcadeResult,
  };

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
}

export function useMemories() {
  const ctx = useContext(MemoryContext);
  if (!ctx) throw new Error('useMemories must be used within MemoryProvider');
  return ctx;
}
