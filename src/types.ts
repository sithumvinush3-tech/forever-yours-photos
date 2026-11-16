export type NavTab =
  | 'home'
  | 'arcade'
  | 'garden'
  | 'intro'
  | 'celebration'
  | 'travels'
  | 'world3d'
  | 'year-review'
  | 'firsts'
  | 'photobooth'
  | 'story'
  | 'scratch'
  | 'diary'
  | 'starmap'
  | 'rose'
  | 'letters'
  | 'studio';

export type ParticleMode = 'petals' | 'fireflies' | 'sparkles' | 'off';

export type GardenTimeOfDay = 'auto' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface BackgroundDecor {
  fireworks: boolean;
  roses: boolean;
  vines: boolean;
  stars: boolean;
  petals: boolean;
  immersiveBackdrop: boolean;
  livingGarden: boolean;
}

export interface SpecialDateItem {
  id: string;
  label: string;
  date: string;
  recurringAnnual?: boolean;
  category: 'anniversary' | 'birthday' | 'milestone' | 'custom';
  notes?: string;
}

export interface SurpriseItem {
  id: string;
  kind: 'quote' | 'secret_memory';
  title: string;
  message: string;
  dateHint?: string;
}

export interface AppConfig {
  himName: string;
  herName: string;
  herNickname: string;
  birthdayMonthDay: string; // MM-DD e.g. '01-08'
  anniversaryDate: string; // YYYY-MM-DD e.g. '2026-06-16'
  openingHisPhotoData?: string;
  openingHerPhotoData?: string;
  openingTogetherPhotoData?: string;
  openingHisPhotoUrl?: string;
  openingHerPhotoUrl?: string;
  openingTogetherPhotoUrl?: string;
  openingQuote?: string;
  specialDates?: SpecialDateItem[];
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  story?: string;
  category: 'travel' | 'milestone' | 'celebration';
  coverPhotoData?: string;
  coverDownloadUrl?: string;
  lat?: number;
  lng?: number;
  published: boolean;
  orderIndex?: number;
  isDefaultSeed?: boolean;
}

export interface MemoryPhoto {
  id: string;
  milestoneId: string;
  imageData?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  fileName?: string;
  caption: string;
  date?: string;
  location?: string;
  published: boolean;
  isFavorite?: boolean;
  isDefaultSeed?: boolean;
}

export interface VideoMemory {
  id: string;
  milestoneId: string;
  title: string;
  caption: string;
  date?: string;
  location?: string;
  downloadUrl?: string;
  durationSec?: number;
  published: boolean;
}

export interface LoveLetter {
  id: string;
  title: string;
  promptLabel?: string;
  body: string;
  unlockDate?: string;
  letterType: 'open_when' | 'signature' | 'birthday_wish' | 'diary';
  published: boolean;
  isDefaultSeed?: boolean;
}

export interface DiaryEntry {
  id: string;
  title: string;
  body: string;
  entryDate: string;
  mood?: string;
  published: boolean;
}

export interface StoryEntry {
  id: string;
  milestoneId?: string;
  title: string;
  summary: string;
  narrative: string;
  storyDate: string;
  published: boolean;
}

export interface TravelMemory {
  id: string;
  milestoneId?: string;
  title: string;
  location: string;
  travelDate: string;
  lat: number;
  lng: number;
  notes: string;
  published: boolean;
}

export interface VoiceMemory {
  id: string;
  title: string;
  milestoneId?: string;
  audioUrl?: string;
  audioData: string;
  durationSec?: number;
  transcript?: string;
  published: boolean;
}

export interface MemoryKeepsake {
  id: string;
  kind: 'first' | 'reason' | 'coupon' | 'adventure';
  title: string;
  detail?: string;
  date?: string;
  numberIndex?: number;
  claimed?: boolean;
  published: boolean;
  isDefaultSeed?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  sweetNote: string;
}

export type ArcadeDifficulty = 'easy' | 'medium' | 'hard';
export type ArcadeGameId = 'memory_detective' | 'firefly_hunt' | 'unlock_my_heart';
export type ArcadeQuestionType = 'detective' | 'secret_code';

export interface ArcadeConfig {
  detectiveEnabled: boolean;
  detectiveDifficulty: ArcadeDifficulty;
  fireflyEnabled: boolean;
  fireflyDifficulty: ArcadeDifficulty;
  fireflyRewardMessage: string;
  unlockEnabled: boolean;
  unlockLetterTitle: string;
  unlockLetterBody: string;
  unlockRewardPhotoData?: string;
  unlockRewardPhotoUrl?: string;
  unlockRewardVideoUrl?: string;
  updatedAt?: string;
}

export interface ArcadeQuestion {
  id: string;
  gameType: ArcadeQuestionType;
  prompt: string;
  options: string[];
  correctIndex: number;
  hint?: string;
  explanation?: string;
  difficulty: ArcadeDifficulty;
  photoId?: string;
  customPhotoData?: string;
  customPhotoUrl?: string;
  published: boolean;
}

export interface ArcadeScore {
  id: string;
  playerUid: string;
  playerLabel: string;
  gameId: ArcadeGameId;
  difficulty: ArcadeDifficulty;
  score: number;
  xpEarned: number;
  completed: boolean;
  durationSec: number;
  createdAt?: string;
}

export interface ArcadeProfile {
  uid: string;
  playerLabel: string;
  xp: number;
  totalGamesPlayed: number;
  gamesCompleted: number;
  bestMemoryDetective: number;
  bestFireflyHunt: number;
  bestUnlockMyHeart: number;
  completedGames: ArcadeGameId[];
  badges: string[];
  unlockedMessages: string[];
  updatedAt?: string;
}
