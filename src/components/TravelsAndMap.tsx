import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Grid,
  Heart,
  MapPin,
  Sparkles,
  Volume2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import type { MemoryPhoto, Milestone } from '../types';
import { sortByDateAsc } from '../utils/dates';
import {
  resolveCoverSrc,
  resolvePhotoFallbackSrc,
  resolvePhotoSrc,
  resolveVideoSrc,
  resolveVoiceSrc,
} from '../utils/photoHelpers';
import { SecureDriveAudio, SecureDriveVideo, SecurePhotoImg } from './SecurePhotoImg';

export function TravelsAndMap() {
  const {
    milestones,
    photos,
    videos,
    voiceMemories,
    keepsakes,
    activityResetTick,
    togglePhotoFavorite,
  } = useMemories();
  const [viewMode, setViewMode] = useState<'chronicles' | 'map' | 'wall' | 'future'>('chronicles');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('all');
  const [galleryPage, setGalleryPage] = useState(1);
  const PHOTOS_PER_PAGE = 12;
  const [lightboxState, setLightboxState] = useState<{
    list: MemoryPhoto[];
    index: number;
  } | null>(null);
  const [lightboxImgError, setLightboxImgError] = useState(false);
  const [lightboxZoomed, setLightboxZoomed] = useState(false);
  const [selectedMapMilestone, setSelectedMapMilestone] = useState<Milestone | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    setGalleryPage(1);
  }, [selectedMilestoneId]);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setViewMode('chronicles');
    setSelectedMilestoneId('all');
    setGalleryPage(1);
    setLightboxState(null);
    setSelectedMapMilestone(null);
  }, [activityResetTick]);

  const travelAndMilestones = useMemo(() => sortByDateAsc(milestones), [milestones]);

  const filteredPhotos = useMemo(() => {
    const base =
      selectedMilestoneId === 'all'
        ? photos
        : photos.filter((p) => p.milestoneId === selectedMilestoneId);
    return sortByDateAsc(base);
  }, [photos, selectedMilestoneId]);

  const totalPages = Math.max(1, Math.ceil(filteredPhotos.length / PHOTOS_PER_PAGE));
  const safeGalleryPage = Math.min(galleryPage, totalPages);
  const paginatedPhotos = useMemo(() => {
    const start = (safeGalleryPage - 1) * PHOTOS_PER_PAGE;
    return filteredPhotos.slice(start, start + PHOTOS_PER_PAGE);
  }, [filteredPhotos, safeGalleryPage]);

  const futureAdventures = useMemo(
    () => keepsakes.filter((k) => k.kind === 'adventure'),
    [keepsakes],
  );

  // Project lat/lng onto the uploaded Sri Lanka Relationship Map illustration (1863x1418)
  const projectPin = (lat = 6.8, lng = 80.8) => {
    const xPct = Math.max(36, Math.min(68, 39.5 + (lng - 79.86) * 14.8));
    const yPct = Math.max(22, Math.min(89, 23.5 + (9.66 - lat) * 17.3));
    return { xPct, yPct };
  };

  const activeMapMilestone = selectedMapMilestone || travelAndMilestones[0] || null;
  const activeMapPhotos = useMemo(
    () =>
      activeMapMilestone
        ? sortByDateAsc(photos.filter((p) => p.milestoneId === activeMapMilestone.id))
        : [],
    [activeMapMilestone, photos],
  );
  const wallPhotos = useMemo(() => sortByDateAsc(photos), [photos]);

  const openLightbox = useCallback((list: MemoryPhoto[], index: number) => {
    if (list.length === 0) return;
    const safeIdx = Math.max(0, Math.min(list.length - 1, index));
    setLightboxImgError(false);
    setLightboxZoomed(false);
    setLightboxState({ list, index: safeIdx });
  }, []);

  const stepLightbox = useCallback((delta: number) => {
    setLightboxImgError(false);
    setLightboxZoomed(false);
    setLightboxState((prev) => {
      if (!prev || prev.list.length <= 1) return prev;
      const nextIndex = (prev.index + delta + prev.list.length) % prev.list.length;
      return { ...prev, index: nextIndex };
    });
  }, []);

  const jumpLightboxTo = useCallback((targetIndex: number) => {
    setLightboxImgError(false);
    setLightboxZoomed(false);
    setLightboxState((prev) => {
      if (!prev) return prev;
      const safeIdx = Math.max(0, Math.min(prev.list.length - 1, targetIndex));
      return { ...prev, index: safeIdx };
    });
  }, []);

  useEffect(() => {
    if (!lightboxState) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setLightboxState(null);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepLightbox(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepLightbox(1);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxState, stepLightbox]);

  const rawLightboxPhoto = lightboxState ? lightboxState.list[lightboxState.index] : null;
  const currentLightboxPhoto = useMemo(() => {
    if (!rawLightboxPhoto) return null;
    return photos.find((p) => p.id === rawLightboxPhoto.id) || rawLightboxPhoto;
  }, [rawLightboxPhoto, photos]);
  const currentLightboxAlbum = useMemo(() => {
    if (!currentLightboxPhoto) return null;
    return milestones.find((m) => m.id === currentLightboxPhoto.milestoneId) || null;
  }, [currentLightboxPhoto, milestones]);
  const currentLightboxSrc = currentLightboxPhoto ? resolvePhotoSrc(currentLightboxPhoto) : '';
  const lightboxCount = lightboxState?.list.length ?? 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Curated Memory Gallery
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Travel Chronicles &amp; Memory Map
          </h2>
          <p className="mt-1 text-sm text-[#7D5260] tabular-nums dark:text-[#D9B8C2]">
            {travelAndMilestones.length} chapters · {photos.length} curated photographs
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-[#D6B477]/45 bg-white/85 p-1.5 shadow-sm dark:bg-[#230E18]/90">
          {[
            { id: 'chronicles', label: 'Travel Chronicles', icon: Compass },
            { id: 'map', label: 'Our Memory Map', icon: MapPin },
            { id: 'wall', label: 'Living Memory Wall', icon: Grid },
            { id: 'future', label: 'Future Adventures', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id as typeof viewMode)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                  viewMode === tab.id
                    ? 'bg-[#542D3A] text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                    : 'text-[#6c4150] hover:bg-[#FCE8E8] hover:text-[#542D3A] dark:text-[#E9C8D3] dark:hover:bg-[#3A192A] dark:hover:text-[#FFF5F0]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: Travel Chronicles */}
      {viewMode === 'chronicles' && (
        <div className="space-y-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedMilestoneId('all')}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedMilestoneId === 'all'
                  ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                  : 'border-[#D6B477]/50 bg-white/80 text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
              }`}
            >
              All Chapters ({photos.length})
            </button>
            {travelAndMilestones.map((m) => {
              const count = photos.filter((p) => p.milestoneId === m.id).length;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMilestoneId(m.id)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedMilestoneId === m.id
                      ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                      : 'border-[#D6B477]/50 bg-white/80 text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
                  }`}
                >
                  {m.title} ({count})
                </button>
              );
            })}
          </div>

          {/* Editorial Trip Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {travelAndMilestones
              .filter((m) => selectedMilestoneId === 'all' || m.id === selectedMilestoneId)
              .map((m) => {
                const tripPhotos = photos.filter((p) => p.milestoneId === m.id);
                const tripVoice = voiceMemories.find((v) => v.milestoneId === m.id);
                const coverSrc = resolveCoverSrc(m);
                return (
                  <article
                    key={m.id}
                    className="group luxury-glass flex flex-col overflow-hidden rounded-[28px] transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#FCE8E8] dark:bg-[#2A121D]">
                      {coverSrc ? (
                        <SecurePhotoImg
                          src={coverSrc}
                          variant="thumb"
                          alt={m.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#FCE8E8] to-[#FFF9F2] text-xs font-medium text-[#8c5263] dark:from-[#2C131F] dark:to-[#190A12] dark:text-[#D9B8C2]">
                          {m.title}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#3a1c26]/80 via-transparent to-transparent" />
                      <div className="absolute right-4 bottom-3 left-4 flex items-center justify-between text-xs font-medium text-[#FFF9F2]">
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Calendar className="h-3.5 w-3.5 text-[#D6B477]" />
                          {m.date}
                        </span>
                        <span className="tabular-nums">{tripPhotos.length} photos</span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                          {m.title}
                        </h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{m.location}</span>
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                          {m.description}
                        </p>
                        {m.story && (
                          <p className="mt-2 text-xs leading-relaxed italic text-[#8c5263] dark:text-[#D4B1BE]">
                            {m.story}
                          </p>
                        )}
                      </div>

                      {tripVoice && resolveVoiceSrc(tripVoice) && (
                        <div className="mt-4 rounded-xl border border-[#D6B477]/45 bg-[#FFF9F2] p-3 dark:bg-[#230E18]">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#542D3A] dark:text-[#FFF5F0]">
                            <Volume2 className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
                            <span>{tripVoice.title}</span>
                          </div>
                          <SecureDriveAudio
                            controls
                            src={resolveVoiceSrc(tripVoice)}
                            className="h-8 w-full"
                          />
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
          </div>

          {/* Curated Editorial Bento Photo Gallery */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] sm:text-3xl dark:text-[#FFF5F0]">
                Curated Gallery ({filteredPhotos.length})
              </h3>
              <p className="text-xs font-medium text-[#8c5263] dark:text-[#D9B8C2]">
                Tap any frame for darkroom view &amp; story notes
              </p>
            </div>
            {filteredPhotos.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#D6B477] bg-white/75 p-10 text-center dark:bg-[#230E18]/80">
                <p className="font-serif-display text-xl font-semibold text-[#542D3A] dark:text-[#FFF5F0]">
                  No Photographs in This Filter Yet
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-[#7D5260] dark:text-[#D9B8C2]">
                  Select another chapter above or view All Chapters to browse every preserved frame.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {paginatedPhotos.map((photo, idx) => {
                    const album = milestones.find((m) => m.id === photo.milestoneId);
                    const photoSrc = resolvePhotoSrc(photo);
                    const absoluteIndex = (safeGalleryPage - 1) * PHOTOS_PER_PAGE + idx;
                    const isLeadFrame =
                      safeGalleryPage === 1 &&
                      selectedMilestoneId === 'all' &&
                      idx === 0 &&
                      paginatedPhotos.length >= 4;

                    return (
                      <article
                        key={photo.id}
                        className={`group luxury-glass relative flex flex-col overflow-hidden rounded-[26px] p-2.5 transition-all duration-300 hover:-translate-y-1 ${
                          isLeadFrame ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openLightbox(filteredPhotos, absoluteIndex)}
                          className={`relative w-full overflow-hidden rounded-2xl bg-[#FCE8E8] text-left dark:bg-[#2A121D] ${
                            isLeadFrame ? 'aspect-[16/11] lg:flex-1' : 'aspect-[4/3]'
                          }`}
                        >
                          {photoSrc ? (
                            <SecurePhotoImg
                              src={photoSrc}
                              variant={isLeadFrame ? 'full' : 'thumb'}
                              fallbackSrc={resolvePhotoFallbackSrc(photo)}
                              alt={photo.caption}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center p-4 text-center text-xs text-[#8c5263] dark:text-[#D9B8C2]">
                              Preview unavailable
                            </div>
                          )}

                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1A0810]/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          <span className="pointer-events-none absolute right-3 bottom-3 rounded-full border border-[#D6B477]/65 bg-[#190A12]/80 px-3 py-1 text-[11px] font-semibold text-[#FFF9F2] opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                            Inspect Frame
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoFavorite(photo.id);
                          }}
                          aria-label={
                            photo.isFavorite ? 'Remove favorite mark' : 'Mark photo as favorite'
                          }
                          title={photo.isFavorite ? 'Favorited' : 'Mark as favorite'}
                          className={`absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                            photo.isFavorite
                              ? 'border-[#C98291] bg-[#FFF9F2]/95 text-[#C98291] shadow-md dark:border-[#E7C38A] dark:bg-[#230E18]/90 dark:text-[#E7C38A]'
                              : 'border-white/40 bg-[#1A0810]/45 text-white/85 opacity-0 group-hover:opacity-100 hover:bg-[#1A0810]/70'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${photo.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openLightbox(filteredPhotos, absoluteIndex)}
                          className="px-2.5 pt-3 pb-1.5 text-left"
                        >
                          <p className="text-[11px] font-semibold tracking-wide text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                            {album?.title || 'Shared Memory'} · {photo.date || album?.date}
                          </p>
                          <p
                            className={`mt-1 leading-snug text-[#542D3A] dark:text-[#FFF5F0] ${
                              isLeadFrame
                                ? 'font-serif-display text-xl font-bold'
                                : 'line-clamp-2 text-sm'
                            }`}
                          >
                            {photo.caption}
                          </p>
                        </button>
                      </article>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2 text-xs">
                    <button
                      type="button"
                      disabled={safeGalleryPage <= 1}
                      onClick={() => setGalleryPage((p) => Math.max(1, p - 1))}
                      className="rounded-full border border-[#D6B477] bg-white px-4 py-1.5 font-semibold text-[#542D3A] disabled:opacity-45 dark:bg-[#27111C] dark:text-[#FCE8E8]"
                    >
                      Previous Page
                    </button>
                    <span className="font-semibold text-[#7D5260] tabular-nums dark:text-[#D9B8C2]">
                      Page {safeGalleryPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safeGalleryPage >= totalPages}
                      onClick={() => setGalleryPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded-full border border-[#D6B477] bg-white px-4 py-1.5 font-semibold text-[#542D3A] disabled:opacity-45 dark:bg-[#27111C] dark:text-[#FCE8E8]"
                    >
                      Next Page
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {videos.filter((v) => selectedMilestoneId === 'all' || v.milestoneId === selectedMilestoneId).length > 0 && (
            <div>
              <h3 className="mb-4 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                Saved Memory Videos (
                {
                  videos.filter(
                    (v) => selectedMilestoneId === 'all' || v.milestoneId === selectedMilestoneId,
                  ).length
                }
                )
              </h3>
              <div className="grid gap-5 sm:grid-cols-2">
                {videos
                  .filter(
                    (v) => selectedMilestoneId === 'all' || v.milestoneId === selectedMilestoneId,
                  )
                  .map((video) => {
                    const album = milestones.find((m) => m.id === video.milestoneId);
                    return (
                      <div
                        key={video.id}
                        className="luxury-glass overflow-hidden rounded-[24px] p-3"
                      >
                        <SecureDriveVideo
                          controls
                          preload="metadata"
                          src={resolveVideoSrc(video)}
                          className="aspect-video w-full rounded-2xl bg-[#1a0a11]"
                        />
                        <div className="px-1 pt-3 pb-1">
                          <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                            {album?.title || 'Shared Memory'} {video.date ? `· ${video.date}` : ''}
                          </p>
                          <p className="mt-0.5 font-serif-display text-lg font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                            {video.title}
                          </p>
                          {video.caption && (
                            <p className="mt-1 text-xs leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                              {video.caption}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Interactive Sri Lanka Memory Map */}
      {viewMode === 'map' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="luxury-glass relative overflow-hidden rounded-[28px] p-5 sm:p-6 lg:col-span-8">
            <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Sri Lanka Relationship Map
            </h3>
            <p className="mt-1 text-xs text-[#7D5260] dark:text-[#D9B8C2]">
              Tap any champagne-rose location pin on your Sri Lanka memory map to explore its story,
              date, and gallery.
            </p>

            <div className="relative mx-auto mt-5 aspect-[1863/1418] w-full overflow-hidden rounded-2xl border-2 border-[#D6B477]/65 bg-[#F6EBDC] shadow-xl dark:border-[#E7C38A]/45">
              <img
                src="/assets/aistudio/Gemini_Generated_Image_wvjzimwvjzimwvjz_4a1d7fda.webp"
                alt="Our Sri Lanka Memories illustrated relationship map"
                className="h-full w-full object-cover select-none"
              />

              {travelAndMilestones.map((m) => {
                const { xPct, yPct } = projectPin(m.lat, m.lng);
                const active = activeMapMilestone?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMapMilestone(m)}
                    style={{ left: `${xPct}%`, top: `${yPct}%` }}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform ${
                      active ? 'z-20 scale-115' : 'z-10 hover:z-20 hover:scale-110'
                    }`}
                    title={`${m.title} (${m.location})`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-lg sm:h-8 sm:w-8 ${
                        active
                          ? 'border-[#FFF9F2] bg-[#542D3A] text-[#FFE7B3] ring-4 ring-[#D6B477]/55'
                          : 'border-[#C98291] bg-[#FFF9F2]/95 text-[#542D3A] hover:border-[#542D3A]'
                      }`}
                    >
                      <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </span>
                    <span
                      className={`pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-full border border-[#D6B477]/65 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-md transition-opacity ${
                        active
                          ? 'bg-[#542D3A] text-[#FFF9F2] opacity-100'
                          : 'bg-[#FFF9F2]/95 text-[#542D3A] opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {m.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {travelAndMilestones.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {travelAndMilestones.map((m) => {
                  const active = activeMapMilestone?.id === m.id;
                  return (
                    <button
                      key={`chip-${m.id}`}
                      type="button"
                      onClick={() => setSelectedMapMilestone(m)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                        active
                          ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                          : 'border-[#D6B477]/50 bg-white/80 text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#230E18] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      <span>{m.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="luxury-glass rounded-[28px] p-6 lg:col-span-4">
            {activeMapMilestone ? (
              <div className="space-y-4">
                <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#FCE8E8] dark:bg-[#2A121D]">
                  {resolveCoverSrc(activeMapMilestone) ? (
                    <SecurePhotoImg
                      src={resolveCoverSrc(activeMapMilestone)}
                      variant="thumb"
                      alt={activeMapMilestone.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[#8c5263] dark:text-[#D9B8C2]">
                      No cover photo yet
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                    {activeMapMilestone.date} · {activeMapMilestone.location}
                  </p>
                  <h4 className="mt-1 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {activeMapMilestone.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                    {activeMapMilestone.description}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold text-[#542D3A] dark:text-[#FFF5F0]">
                    Chapter Photographs ({activeMapPhotos.length})
                  </p>
                  {activeMapPhotos.length === 0 ? (
                    <p className="text-xs text-[#8c5263] dark:text-[#D9B8C2]">
                      No additional gallery photos for this milestone yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {activeMapPhotos.map((p, idx) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => openLightbox(activeMapPhotos, idx)}
                          className="aspect-square overflow-hidden rounded-xl border border-[#D6B477]/50"
                        >
                          <SecurePhotoImg
                            src={resolvePhotoSrc(p)}
                            fallbackSrc={resolvePhotoFallbackSrc(p)}
                            alt={p.caption}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#7D5260] dark:text-[#D9B8C2]">
                Select a map pin to view trip details.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mode 3: Living Memory Wall */}
      {viewMode === 'wall' && (
        <section className="space-y-4">
          <p className="text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            An automatically updated living mosaic of every published photograph and chapter cover.
          </p>
          <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
            {wallPhotos.map((p, idx) => {
              const photoSrc = resolvePhotoSrc(p);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => openLightbox(wallPhotos, idx)}
                  className="luxury-glass block w-full break-inside-avoid overflow-hidden rounded-2xl p-2 text-left transition-transform hover:-translate-y-0.5"
                >
                  {photoSrc && (
                    <SecurePhotoImg
                      src={photoSrc}
                      fallbackSrc={resolvePhotoFallbackSrc(p)}
                      alt={p.caption}
                      className="w-full rounded-xl object-cover"
                    />
                  )}
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                      {p.location || p.date}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#542D3A] dark:text-[#FFF5F0]">
                      {p.caption}
                    </p>
                  </div>
                </button>
              );
            })}
            {photos.length === 0 &&
              travelAndMilestones.map((m) => {
                const coverSrc = resolveCoverSrc(m);
                if (!coverSrc) return null;
                return (
                  <div
                    key={m.id}
                    className="luxury-glass break-inside-avoid overflow-hidden rounded-2xl p-2"
                  >
                    <SecurePhotoImg
                      src={coverSrc}
                      variant="thumb"
                      alt={m.title}
                      className="w-full rounded-xl object-cover"
                    />
                    <div className="p-2.5">
                      <p className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                        {m.title} · {m.date}
                      </p>
                      <p className="mt-1 text-xs text-[#6c4150] dark:text-[#EAD0D9]">
                        {m.description}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Mode 4: Our Future Adventures */}
      {viewMode === 'future' && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {futureAdventures.map((adv) => (
            <div
              key={adv.id}
              className="luxury-glass rounded-[28px] p-6 transition-transform hover:-translate-y-0.5"
            >
              <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
                {adv.date || 'Planned Dream'}
              </p>
              <h4 className="mt-2 font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                {adv.title}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                {adv.detail}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Darkroom Monograph Lightbox with Zoom, Details Sidebar & Filmstrip Rail */}
      {lightboxState && currentLightboxPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery viewer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setLightboxState(null);
            }
          }}
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const startX = touchStartXRef.current;
            const endX = e.changedTouches[0]?.clientX;
            touchStartXRef.current = null;
            if (startX == null || endX == null || lightboxCount <= 1 || lightboxZoomed) return;
            const dx = endX - startX;
            if (Math.abs(dx) >= 45) {
              stepLightbox(dx < 0 ? 1 : -1);
            }
          }}
          className="fixed inset-0 z-[95] flex flex-col bg-[#0F060A]/95 text-[#FFF9F2] backdrop-blur-lg"
        >
          {/* Top Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex shrink-0 items-center justify-between gap-3 border-b border-[#D6B477]/20 px-4 py-3 sm:px-6"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold tracking-[0.16em] text-[#E7C38A] uppercase tabular-nums">
                {String(lightboxState.index + 1).padStart(2, '0')} /{' '}
                {String(lightboxCount).padStart(2, '0')} ·{' '}
                {currentLightboxAlbum?.title || 'Curated Archive'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoomed((z) => !z)}
                aria-label={lightboxZoomed ? 'Reset zoom' : 'Zoom photograph'}
                title={lightboxZoomed ? 'Fit Frame' : 'Zoom Inspect'}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#D6B477]/40 bg-[#1E0C15] px-3.5 text-xs font-semibold text-[#FFF9F2] transition-colors hover:bg-[#321523]"
              >
                {lightboxZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                <span className="hidden sm:inline">{lightboxZoomed ? 'Fit' : 'Zoom'}</span>
              </button>

              <button
                type="button"
                onClick={() => togglePhotoFavorite(currentLightboxPhoto.id)}
                aria-label={
                  currentLightboxPhoto.isFavorite
                    ? 'Remove favorite mark'
                    : 'Mark photograph as favorite'
                }
                className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors ${
                  currentLightboxPhoto.isFavorite
                    ? 'border-[#C98291] bg-[#491E33] text-[#FFF5F0]'
                    : 'border-[#D6B477]/40 bg-[#1E0C15] text-[#FCE8E8] hover:bg-[#321523]'
                }`}
              >
                <Heart
                  className={`h-4 w-4 ${currentLightboxPhoto.isFavorite ? 'fill-[#E7C38A] text-[#E7C38A]' : ''}`}
                />
                <span className="hidden sm:inline">
                  {currentLightboxPhoto.isFavorite ? 'Favorited' : 'Favorite'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLightboxState(null)}
                aria-label="Close photo viewer"
                className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 rounded-full bg-[#E7C38A] px-4 text-xs font-semibold text-[#1A0810] transition-colors hover:bg-[#f2d6a6]"
              >
                <X className="h-4 w-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Center Split Stage: Darkroom Frame + Monograph Sidebar */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
            {/* Image Stage */}
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setLightboxState(null);
              }}
              className="relative flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 sm:p-8"
            >
              {lightboxCount > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(-1);
                  }}
                  aria-label="Previous photograph"
                  className="absolute top-1/2 left-3 z-20 flex min-h-[46px] min-w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-[#D6B477]/65 bg-[#1B0A13]/90 text-[#FFF9F2] shadow-xl transition-transform hover:scale-105 hover:bg-[#321523] sm:left-5"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentLightboxSrc && !lightboxImgError) {
                    setLightboxZoomed((z) => !z);
                  }
                }}
                className={`relative flex max-h-full max-w-full items-center justify-center overflow-hidden rounded-2xl border border-[#D6B477]/35 bg-[#090306] shadow-2xl ${
                  lightboxZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
              >
                {currentLightboxSrc && !lightboxImgError ? (
                  <SecurePhotoImg
                    src={currentLightboxSrc}
                    variant="full"
                    lazy={false}
                    fallbackSrc={resolvePhotoFallbackSrc(currentLightboxPhoto)}
                    alt={currentLightboxPhoto.caption}
                    onError={() => setLightboxImgError(true)}
                    className={`max-h-[58vh] w-auto max-w-full object-contain transition-transform duration-300 select-none lg:max-h-[72vh] ${
                      lightboxZoomed ? 'scale-150' : 'scale-100'
                    }`}
                  />
                ) : (
                  <div className="flex h-64 w-80 flex-col items-center justify-center gap-2 p-6 text-center text-xs text-[#EAD0D9]">
                    <p className="font-semibold text-[#FFE7B3]">Photograph Preview Unavailable</p>
                    <p className="opacity-85">
                      This photograph&apos;s metadata is preserved, but its image source could not be
                      loaded right now.
                    </p>
                  </div>
                )}
              </div>

              {lightboxCount > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    stepLightbox(1);
                  }}
                  aria-label="Next photograph"
                  className="absolute top-1/2 right-3 z-20 flex min-h-[46px] min-w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-[#D6B477]/65 bg-[#1B0A13]/90 text-[#FFF9F2] shadow-xl transition-transform hover:scale-105 hover:bg-[#321523] sm:right-5"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>

            {/* Right Monograph Details Panel */}
            <aside
              onClick={(e) => e.stopPropagation()}
              className="flex shrink-0 flex-col justify-between border-t border-[#D6B477]/20 bg-[#170910] p-5 lg:w-96 lg:border-t-0 lg:border-l lg:p-6"
            >
              <div className="space-y-4 overflow-y-auto">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-[#E7C38A] uppercase">
                    Chapter Monograph
                  </p>
                  <h3 className="mt-1 font-serif-display text-2xl font-bold text-[#FFF9F2]">
                    {currentLightboxAlbum?.title || 'Forever Yours'}
                  </h3>
                </div>

                <p className="font-serif-display text-lg leading-relaxed text-[#FCE8E8]">
                  {currentLightboxPhoto.caption}
                </p>

                <div className="space-y-2 border-t border-[#D6B477]/20 pt-3 text-xs text-[#D9B8C2]">
                  <div className="flex items-center gap-2 tabular-nums">
                    <Calendar className="h-3.5 w-3.5 text-[#E7C38A]" />
                    <span>{currentLightboxPhoto.date || currentLightboxAlbum?.date || 'Saved Memory'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#E7C38A]" />
                    <span>
                      {currentLightboxPhoto.location ||
                        currentLightboxAlbum?.location ||
                        'Sri Lanka'}
                    </span>
                  </div>
                </div>

                {currentLightboxAlbum?.story && (
                  <p className="border-t border-[#D6B477]/20 pt-3 text-xs leading-relaxed italic text-[#D4B1BE]">
                    {currentLightboxAlbum.story}
                  </p>
                )}
              </div>

              {lightboxCount > 1 && (
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#D6B477]/20 pt-4">
                  <button
                    type="button"
                    onClick={() => stepLightbox(-1)}
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-full border border-[#D6B477]/50 bg-[#230E18] px-3 text-xs font-semibold text-[#FCE8E8] hover:bg-[#3A192A]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => stepLightbox(1)}
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1 rounded-full bg-[#E7C38A] px-3 text-xs font-semibold text-[#1A0810] hover:bg-[#f2d6a6]"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </aside>
          </div>

          {/* Bottom Interactive Filmstrip Rail */}
          {lightboxCount > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`flex shrink-0 items-center gap-2 overflow-x-auto border-t border-[#D6B477]/20 bg-[#12060B] px-4 py-2.5 ${
                lightboxCount <= 12 ? 'sm:justify-center' : ''
              }`}
            >
              {lightboxState.list.map((thumb, idx) => {
                const thumbSrc = resolvePhotoSrc(thumb);
                const active = idx === lightboxState.index;
                return (
                  <button
                    key={`rail-${thumb.id}`}
                    type="button"
                    onClick={() => jumpLightboxTo(idx)}
                    aria-label={`Jump to photo ${idx + 1}: ${thumb.caption}`}
                    className={`h-12 w-16 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      active
                        ? 'scale-105 border-[#E7C38A] ring-2 ring-[#E7C38A]/70 opacity-100'
                        : 'border-white/15 opacity-50 hover:opacity-90'
                    }`}
                  >
                    {thumbSrc && (
                      <SecurePhotoImg
                        src={thumbSrc}
                        variant="thumb"
                        fallbackSrc={resolvePhotoFallbackSrc(thumb)}
                        alt={thumb.caption}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
