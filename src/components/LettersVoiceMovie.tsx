import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Download,
  Film,
  Lock,
  Mail,
  MailOpen,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import { LocalAssistantService } from '../services';
import type { LoveLetter } from '../types';
import { sortByDateAsc } from '../utils/dates';
import { renderMemoryMovieBlob } from '../utils/media';
import {
  resolveCoverSrc,
  resolvePhotoSrc,
  resolveRenderableMediaUrl,
  resolveVoiceSrc,
} from '../utils/photoHelpers';
import { SecureDriveAudio, SecurePhotoImg } from './SecurePhotoImg';

export function LettersVoiceMovie() {
  const { letters, voiceMemories, photos, milestones, config, activityResetTick } = useMemories();
  const [openedLetter, setOpenedLetter] = useState<LoveLetter | null>(null);

  const moviePool = useMemo(() => {
    const photoItems = sortByDateAsc(photos)
      .map((p) => ({
        id: p.id,
        imageData: resolvePhotoSrc(p),
        caption: p.caption,
        date: p.date,
        location: p.location,
      }))
      .filter((item) => Boolean(item.imageData));
    if (photoItems.length > 0) {
      return photoItems;
    }
    return sortByDateAsc(milestones)
      .map((m) => ({
        id: m.id,
        imageData: resolveCoverSrc(m),
        caption: m.description,
        date: m.date,
        location: m.location,
      }))
      .filter((item) => Boolean(item.imageData));
  }, [photos, milestones]);

  const [selectedSlideIds, setSelectedSlideIds] = useState<string[]>([]);
  const [movieTitle, setMovieTitle] = useState('Forever Yours — Our Memories Film');
  const [narrationScenes, setNarrationScenes] = useState<{
    openingTitle: string;
    closingLine: string;
    scenes: { index: number; subtitle: string }[];
  } | null>(null);
  const [composingScript, setComposingScript] = useState(false);
  const [renderingMovie, setRenderingMovie] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [exportedExt, setExportedExt] = useState('webm');
  const [movieError, setMovieError] = useState<string | null>(null);
  const videoUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (activityResetTick === 0) return;
    setOpenedLetter(null);
    setSelectedSlideIds([]);
  }, [activityResetTick]);

  useEffect(() => {
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, []);

  const openWhenLetters = useMemo(
    () => letters.filter((l) => l.letterType === 'open_when' || l.letterType === 'signature'),
    [letters],
  );

  const selectedSlides = useMemo(() => {
    const picked = moviePool.filter((m) => selectedSlideIds.includes(m.id));
    return picked.length > 0 ? picked : moviePool.slice(0, 6);
  }, [moviePool, selectedSlideIds]);

  const toggleMovieSlide = (id: string) => {
    setSelectedSlideIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleComposeNarration = async () => {
    if (selectedSlides.length === 0) return;
    setComposingScript(true);
    setMovieError(null);
    try {
      const plan = LocalAssistantService.buildLocalMovieNarration({
        title: movieTitle,
        slides: selectedSlides.map((s) => ({
          caption: s.caption,
          location: s.location,
          date: s.date,
        })),
        himName: config.himName,
        herName: config.herName,
        herNickname: config.herNickname,
      });
      setNarrationScenes(plan);
    } catch (err) {
      setMovieError(
        err instanceof Error ? err.message : 'Could not build narration template.',
      );
    } finally {
      setComposingScript(false);
    }
  };

  const handleExportMovie = async () => {
    if (selectedSlides.length === 0) return;
    setRenderingMovie(true);
    setRenderProgress(0);
    setMovieError(null);
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }
    setExportedVideoUrl(null);
    try {
      const slidesPayload = await Promise.all(
        selectedSlides.map(async (s, idx) => ({
          imageData: await resolveRenderableMediaUrl(s.imageData),
          subtitle:
            narrationScenes?.scenes.find((sc) => sc.index === idx)?.subtitle ||
            s.caption ||
            s.location ||
            'Our Memory',
          date: s.date,
          location: s.location,
        })),
      );
      const result = await renderMemoryMovieBlob({
        slides: slidesPayload,
        openingTitle: narrationScenes?.openingTitle || movieTitle,
        closingLine:
          narrationScenes?.closingLine ||
          `Forever yours, ${config.himName} & ${config.herName}`,
        coupleLabel: `${config.himName} & ${config.herName}`,
        onProgress: setRenderProgress,
      });
      const url = URL.createObjectURL(result.blob);
      videoUrlRef.current = url;
      setExportedVideoUrl(url);
      setExportedExt(result.extension);
    } catch (err) {
      setMovieError(
        err instanceof Error
          ? err.message
          : 'Video export failed on this browser. Please try another browser or fewer slides.',
      );
    } finally {
      setRenderingMovie(false);
    }
  };

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
      {/* 1. Wax-Sealed Envelopes & Stationery Letters */}
      <section>
        <div className="mb-6 border-b border-[#D6B477]/35 pb-5">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Wax-Sealed Stationery Envelopes
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Love Letters &amp; Time-Capsule Notes
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {openWhenLetters.map((letter) => {
            const isTimeLocked = Boolean(letter.unlockDate && letter.unlockDate > todayIso);
            const isOpen = openedLetter?.id === letter.id;
            return (
              <button
                key={letter.id}
                type="button"
                disabled={isTimeLocked}
                onClick={() => setOpenedLetter(letter)}
                className={`group flex flex-col justify-between rounded-[26px] border p-5 text-left transition-all ${
                  isOpen
                    ? 'border-[#542D3A] bg-white shadow-lg dark:border-[#E7C38A] dark:bg-[#27111C]'
                    : 'luxury-glass hover:-translate-y-0.5'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#542D3A] text-[#D6B477] shadow-sm dark:bg-[#E7C38A] dark:text-[#1A0810]">
                    {isTimeLocked ? (
                      <Lock className="h-5 w-5" />
                    ) : isOpen ? (
                      <MailOpen className="h-5 w-5" />
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#C98291] dark:text-[#E7C38A]">
                    {isTimeLocked ? `Unlocks ${letter.unlockDate}` : 'Break Seal'}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {letter.title}
                  </h3>
                  {letter.promptLabel && (
                    <p className="mt-1 text-xs text-[#7D5260] dark:text-[#D9B8C2]">
                      {letter.promptLabel}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {openedLetter && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="stationery-paper mt-6 rounded-[30px] border-2 border-[#D6B477] p-6 shadow-xl sm:p-10"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D6B477]/45 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
                  {openedLetter.promptLabel || 'Handwritten Love Letter'}
                </p>
                <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {openedLetter.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpenedLetter(null)}
                className="rounded-full border border-[#D6B477] bg-white px-4 py-1.5 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
              >
                Seal Envelope
              </button>
            </div>
            <p className="font-handwriting mt-5 whitespace-pre-line text-2xl leading-relaxed text-[#542D3A] sm:text-3xl dark:text-[#F5DCE4]">
              {openedLetter.body}
            </p>
          </motion.div>
        )}
      </section>

      {/* 2. Voice Memories */}
      <section className="luxury-glass rounded-[32px] p-6 sm:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
          <Volume2 className="h-4 w-4 text-[#D6B477]" />
          <span>Voice Memories</span>
        </div>
        <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
          Recorded Audio Notes
        </h3>
        {voiceMemories.length === 0 ? (
          <p className="mt-3 text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            {config.himName}&apos;s handwritten love letters and Memory Movie Maker below are ready to
            enjoy anytime.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {voiceMemories.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-[#D6B477]/60 bg-white p-5 shadow-xs dark:bg-[#230E18]"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                    {v.title}
                  </p>
                  <div className="flex h-5 items-end gap-0.5" aria-hidden="true">
                    {[0.6, 1, 0.45, 0.85, 0.55].map((h, i) => (
                      <span
                        key={i}
                        style={{
                          height: `${Math.round(h * 18)}px`,
                          animation: `waveBar 1.2s ease-in-out ${i * 0.14}s infinite`,
                        }}
                        className="w-1 rounded-full bg-[#C98291] dark:bg-[#E7C38A]"
                      />
                    ))}
                  </div>
                </div>
                {v.transcript && (
                  <p className="mt-1 text-xs text-[#6c4150] dark:text-[#EAD0D9]">{v.transcript}</p>
                )}
                <SecureDriveAudio
                  controls
                  src={resolveVoiceSrc(v)}
                  className="mt-3 w-full"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Memory Movie Maker & Cinema */}
      <section className="luxury-glass rounded-[32px] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#C98291] uppercase dark:text-[#E7C38A]">
              <Film className="h-4 w-4 text-[#D6B477]" />
              <span>Memories Movie Maker &amp; Memory Cinema</span>
            </p>
            <h3 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Render &amp; Download a Memory Film
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleComposeNarration()}
              disabled={composingScript || selectedSlides.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477] bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#C98291] dark:text-[#E7C38A]" />
              <span>{composingScript ? 'Writing Script...' : '1. Compose Template Subtitles'}</span>
            </button>
            <button
              type="button"
              onClick={() => void handleExportMovie()}
              disabled={renderingMovie || selectedSlides.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] shadow-md hover:bg-[#6a3a4a] disabled:opacity-60 dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
            >
              <Play className="h-3.5 w-3.5 text-[#D6B477] dark:text-[#1A0810]" />
              <span>
                {renderingMovie
                  ? `Rendering Film (${renderProgress}%)...`
                  : '2. Render Downloadable Video'}
              </span>
            </button>
          </div>
        </div>

        {movieError && (
          <div className="mt-4 rounded-2xl border border-rose-400 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
            {movieError}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <label className="block text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              Movie Title
              <input
                type="text"
                value={movieTitle}
                onChange={(e) => setMovieTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#D6B477]/70 bg-white px-3.5 py-2 text-sm text-[#542D3A] focus:border-[#542D3A] focus:outline-none dark:bg-[#190A12] dark:text-[#FFF5F0] dark:focus:border-[#E7C38A]"
              />
            </label>
            <p className="text-xs font-medium text-[#7D5260] dark:text-[#D9B8C2]">
              Select photos to include ({selectedSlides.length} active):
            </p>
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
              {moviePool.map((item) => {
                const active = selectedSlideIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleMovieSlide(item.id)}
                    className={`aspect-square overflow-hidden rounded-xl border-2 ${
                      active
                        ? 'border-[#542D3A] dark:border-[#E7C38A]'
                        : 'border-[#D6B477]/40 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <SecurePhotoImg
                      src={item.imageData}
                      alt={item.caption}
                      className="h-full w-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-[#D6B477]/60 bg-white/90 p-5 lg:col-span-6 dark:bg-[#230E18]">
            {exportedVideoUrl ? (
              <div className="space-y-4 text-center">
                <video
                  controls
                  src={exportedVideoUrl}
                  className="aspect-video w-full rounded-xl bg-[#2a121a]"
                />
                <a
                  href={exportedVideoUrl}
                  download={`forever-yours-movie.${exportedExt}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#542D3A] px-6 py-2.5 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6a3a4a] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
                >
                  <Download className="h-4 w-4 text-[#D6B477] dark:text-[#1A0810]" />
                  <span>Download Memory Movie (.{exportedExt.toUpperCase()})</span>
                </a>
              </div>
            ) : (
              <div className="space-y-3 text-center">
                <Film className="mx-auto h-9 w-9 text-[#C98291] dark:text-[#E7C38A]" />
                <p className="font-serif-display text-xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                  {narrationScenes?.openingTitle || movieTitle}
                </p>
                <p className="text-xs leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                  {narrationScenes
                    ? `Template narration ready for ${selectedSlides.length} scenes. Click "Render Downloadable Video" to compile your smooth Ken Burns film with romantic piano music and subtitles.`
                    : 'Optionally compose romantic scene subtitles from your photo details first, then click "Render Downloadable Video" to export a playable film file.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
