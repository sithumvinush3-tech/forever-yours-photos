import { useEffect, useState } from 'react';
import { CheckCircle2, Printer, X } from 'lucide-react';
import { AdminStudioView } from './components/AdminStudioView';
import { AmbientParticles, UploadedFloralOverlay } from './components/AmbientParticles';
import { CelebrationView } from './components/CelebrationView';
import { EternalRoseView } from './components/EternalRoseView';
import { OurFirstsView, PhotoBoothView } from './components/FirstsAndPhotoBooth';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { IntroStage } from './components/IntroStage';
import { LettersVoiceMovie } from './components/LettersVoiceMovie';
import { LivingGarden3D } from './components/LivingGarden3D';
import { LoveArcadeView } from './components/LoveArcadeView';
import { MemoryGarden } from './components/MemoryGarden';
import { SecretDiaryAndVault } from './components/SecretDiaryAndVault';
import { SecurePhotoImg } from './components/SecurePhotoImg';
import { StarMapView } from './components/StarMapView';
import { ScratchOffTimelineView, StoryTimelineView } from './components/StoryAndScratchOff';
import { TravelsAndMap } from './components/TravelsAndMap';
import { World3DView, YearInReviewView } from './components/World3DAndReview';
import { MemoryProvider, useMemories } from './context/MemoryContext';
import type { NavTab, ParticleMode } from './types';
import { birthdayAudio } from './utils/audioEngine';
import { formatBirthdayLabel, formatFullDateLabel, sortByDateAsc } from './utils/dates';
import { resolveCoverSrc, resolvePhotoSrc } from './utils/photoHelpers';

function PrintableMemoryBookModal({ onClose }: { onClose: () => void }) {
  const { config, milestones, photos, letters } = useMemories();
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#FFF9F2] p-6 text-[#542D3A] sm:p-10">
      <div className="no-print mx-auto mb-8 flex max-w-4xl items-center justify-between border-b border-[#D6B477]/50 pb-4">
        <p className="text-sm font-semibold text-[#542D3A]">
          Digital Memory Book Preview — Ready for Print or Save as PDF
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#542D3A] px-4 py-2 text-xs font-semibold text-[#FFF9F2]"
          >
            <Printer className="h-4 w-4 text-[#D6B477]" />
            <span>Print / Save PDF</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-full border border-[#D6B477] bg-white px-3.5 py-2 text-xs font-semibold text-[#542D3A]"
          >
            <X className="h-4 w-4" />
            <span>Close</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-10">
        <div className="border-b border-[#D6B477]/50 pb-8 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#C98291] uppercase">
            Forever Yours
          </p>
          <h1 className="mt-2 font-serif-display text-4xl font-bold text-[#542D3A]">
            {config.himName} &amp; {config.herName} ({config.herNickname})
          </h1>
          <p className="mt-2 text-sm text-[#7D5260]">
            Relationship Started {formatFullDateLabel(config.anniversaryDate)} · Birthday
            Celebration {formatBirthdayLabel(config.birthdayMonthDay)}
          </p>
        </div>

        {sortByDateAsc(milestones).map((m) => {
          const tripPhotos = sortByDateAsc(photos.filter((p) => p.milestoneId === m.id));
          const coverSrc = resolveCoverSrc(m);
          return (
            <section key={m.id} className="break-inside-avoid space-y-3 border-b border-[#D6B477]/35 pb-6">
              <p className="text-xs font-semibold text-[#C98291]">
                {m.date} · {m.location}
              </p>
              <h2 className="font-serif-display text-2xl font-bold text-[#542D3A]">{m.title}</h2>
              <p className="text-sm leading-relaxed text-[#542D3A]">{m.description}</p>
              {m.story && <p className="text-sm italic text-[#6c4150]">{m.story}</p>}
              {coverSrc && (
                <SecurePhotoImg
                  src={coverSrc}
                  variant="full"
                  lazy={false}
                  alt={m.title}
                  className="max-h-72 w-full rounded-xl object-cover"
                />
              )}
              {tripPhotos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {tripPhotos.map((p) => {
                    const photoSrc = resolvePhotoSrc(p);
                    if (!photoSrc) return null;
                    return (
                      <div key={p.id} className="space-y-1">
                        <SecurePhotoImg
                          src={photoSrc}
                          variant="full"
                          lazy={false}
                          alt={p.caption}
                          className="aspect-[4/3] w-full rounded-lg object-cover"
                        />
                        <p className="text-xs italic text-[#6c4150]">{p.caption}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        <section className="space-y-4">
          <h2 className="font-serif-display text-2xl font-bold text-[#542D3A]">
            Saved Love Letters
          </h2>
          {letters
            .filter((l) => l.letterType === 'signature' || l.letterType === 'open_when')
            .map((l) => (
              <div
                key={l.id}
                className="stationery-paper !bg-[#FFFDF9] !text-[#542D3A] break-inside-avoid rounded-xl border border-[#D6B477] p-5"
              >
                <h3 className="font-serif-display text-lg font-bold text-[#542D3A]">{l.title}</h3>
                <p className="font-handwriting mt-2 whitespace-pre-line text-xl text-[#542D3A]">
                  {l.body}
                </p>
              </div>
            ))}
        </section>
      </div>
    </div>
  );
}

function ForeverYoursShell() {
  const {
    config,
    bgDecor,
    toggleBgDecor,
    gardenModeActive,
    activityResetToast,
    dismissActivityResetToast,
  } = useMemories();
  const [activeTab, setActiveTab] = useState<NavTab>('intro');
  const [particleMode, setParticleMode] = useState<ParticleMode>('petals');
  const [showPrintBook, setShowPrintBook] = useState(false);

  useEffect(() => {
    birthdayAudio.initAutoPlay();
  }, []);

  const showLivingGarden = (activeTab === 'home' && bgDecor.livingGarden) || gardenModeActive;

  return (
    <div className="relative min-h-screen text-[#542D3A] dark:text-[#FDF3EF]">
      {showLivingGarden && <LivingGarden3D onNavigate={setActiveTab} />}
      {!gardenModeActive && showLivingGarden && <UploadedFloralOverlay subtleOverVideo />}
      {!gardenModeActive && !showLivingGarden && (
        <AmbientParticles mode={particleMode} immersiveBackdrop={bgDecor.immersiveBackdrop} />
      )}
      {!gardenModeActive && (
        <Header
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenPrintBook={() => setShowPrintBook(true)}
        />
      )}

      {!gardenModeActive && (
        <main className={`relative z-20 pb-16 ${showLivingGarden ? 'living-garden-bg' : ''}`}>
          {activeTab === 'intro' && <IntroStage onComplete={() => setActiveTab('home')} />}
          {activeTab === 'home' && <HomePage onNavigate={setActiveTab} />}
          {activeTab === 'arcade' && <LoveArcadeView />}
          {activeTab === 'garden' && (
            <MemoryGarden
              onNavigate={setActiveTab}
              particleMode={particleMode}
              onChangeParticles={setParticleMode}
              immersiveBackdrop={bgDecor.immersiveBackdrop}
              onToggleBackdrop={() => toggleBgDecor('immersiveBackdrop')}
            />
          )}
          {activeTab === 'celebration' && <CelebrationView />}
          {activeTab === 'travels' && <TravelsAndMap />}
          {activeTab === 'world3d' && <World3DView />}
          {activeTab === 'year-review' && <YearInReviewView />}
          {activeTab === 'firsts' && <OurFirstsView />}
          {activeTab === 'photobooth' && <PhotoBoothView />}
          {activeTab === 'story' && <StoryTimelineView />}
          {activeTab === 'scratch' && <ScratchOffTimelineView />}
          {activeTab === 'diary' && <SecretDiaryAndVault />}
          {activeTab === 'starmap' && <StarMapView />}
          {activeTab === 'rose' && <EternalRoseView />}
          {activeTab === 'letters' && <LettersVoiceMovie />}
          {activeTab === 'studio' && <AdminStudioView />}
        </main>
      )}

      {!gardenModeActive && (
        <footer
          className={`no-print relative z-20 border-t border-[#D6B477]/35 py-6 text-center text-xs font-medium text-[#8c5263] dark:border-[#D6B477]/25 dark:text-[#D9B8C2] ${
            showLivingGarden
              ? 'bg-[#FFF9F2]/96 dark:bg-[#160910]/96'
              : 'bg-[#FFF9F2]/90 dark:bg-[#160910]/90'
          }`}
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4">
            <p>
              Forever Yours · {config.himName} &amp; {config.herName} ({config.herNickname}) ·
              Relationship Since {formatFullDateLabel(config.anniversaryDate)}
            </p>
          </div>
        </footer>
      )}

      {showPrintBook && (
        <PrintableMemoryBookModal onClose={() => setShowPrintBook(false)} />
      )}

      {activityResetToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 bottom-4 z-[75] flex max-w-sm items-start gap-2.5 rounded-2xl border border-[#D6B477] bg-[#FFF9F2] px-4 py-3 text-xs text-[#542D3A] shadow-2xl dark:bg-[#230E18] dark:text-[#FFF5F0]"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="flex-1 leading-relaxed">{activityResetToast}</p>
          <button
            type="button"
            onClick={dismissActivityResetToast}
            aria-label="Dismiss notification"
            className="rounded-full p-1 text-[#7D5260] hover:bg-[#FCE8E8] dark:text-[#D9B8C2] dark:hover:bg-[#3A192A]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <MemoryProvider>
      <ForeverYoursShell />
    </MemoryProvider>
  );
}
