import type { MemoryPhoto, Milestone, VideoMemory, VoiceMemory } from '../types';

export function resolvePhotoSrc(
  photo?: Partial<MemoryPhoto> & { imageUrl?: string; url?: string; photoUrl?: string },
): string {
  if (!photo) return '';
  return (
    photo.downloadUrl ||
    photo.imageData ||
    photo.imageUrl ||
    photo.url ||
    photo.photoUrl ||
    ''
  ).trim();
}

export function resolvePhotoFullSrc(
  photo?: Partial<MemoryPhoto> & { imageUrl?: string; url?: string; photoUrl?: string },
): string {
  return resolvePhotoSrc(photo);
}

export function resolvePhotoFallbackSrc(photo?: Partial<MemoryPhoto>): string {
  if (!photo) return '';
  const primary = resolvePhotoSrc(photo);
  const candidates = [photo.imageData, photo.thumbnailUrl, photo.downloadUrl].filter(
    (v): v is string => typeof v === 'string' && v.trim().length > 0 && v.trim() !== primary,
  );
  return candidates[0]?.trim() || '';
}

export function resolveCoverSrc(
  milestone?: Partial<Milestone> & { coverPhotoUrl?: string; coverUrl?: string },
): string {
  if (!milestone) return '';
  return (
    milestone.coverDownloadUrl ||
    milestone.coverPhotoData ||
    milestone.coverPhotoUrl ||
    milestone.coverUrl ||
    ''
  ).trim();
}

export function resolveVoiceSrc(voice?: Partial<VoiceMemory>): string {
  if (!voice) return '';
  return (voice.audioUrl || voice.audioData || '').trim();
}

export function resolveVideoSrc(video?: Partial<VideoMemory>): string {
  if (!video) return '';
  return (video.downloadUrl || '').trim();
}

export async function resolveRenderableMediaUrl(src?: string): Promise<string> {
  return (src || '').trim();
}

export function isValidImageSrc(val: unknown): val is string {
  if (typeof val !== 'string') return false;
  const s = val.trim();
  if (s.length < 4) return false;
  return (
    s.startsWith('https://') ||
    s.startsWith('http://') ||
    s.startsWith('data:image/') ||
    s.startsWith('/') ||
    s.startsWith('blob:')
  );
}
