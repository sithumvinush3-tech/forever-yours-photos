import { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Gift,
  Heart,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Trash2,
  Upload,
} from 'lucide-react';
import { useMemories } from '../context/MemoryContext';
import type { MemoryPhoto, Milestone, SurpriseItem } from '../types';
import { sortByDateAsc } from '../utils/dates';
import { resolvePhotoFallbackSrc, resolvePhotoSrc } from '../utils/photoHelpers';
import { SecurePhotoImg } from './SecurePhotoImg';

type StudioSection = 'chapters' | 'photos' | 'surprises' | 'couple' | 'backup';

export function AdminStudioView() {
  const {
    config,
    allMilestones,
    allPhotos,
    surprises,
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
  } = useMemories();

  const [section, setSection] = useState<StudioSection>('chapters');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Selected milestone editor state
  const sortedMilestones = sortByDateAsc(allMilestones);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    sortedMilestones[0]?.id || '',
  );
  const [creatingChapter, setCreatingChapter] = useState(false);

  const activeMilestone =
    sortedMilestones.find((m) => m.id === selectedMilestoneId) || sortedMilestones[0];

  const [chapterForm, setChapterForm] = useState<{
    title: string;
    date: string;
    location: string;
    category: 'travel' | 'milestone' | 'celebration';
    description: string;
    story: string;
    published: boolean;
  }>(() => ({
    title: activeMilestone?.title || '',
    date: activeMilestone?.date || '2026-11-11',
    location: activeMilestone?.location || '',
    category: activeMilestone?.category || 'travel',
    description: activeMilestone?.description || '',
    story: activeMilestone?.story || '',
    published: activeMilestone?.published ?? true,
  }));

  const selectChapterForEdit = (m: Milestone) => {
    setCreatingChapter(false);
    setSelectedMilestoneId(m.id);
    setChapterForm({
      title: m.title,
      date: m.date,
      location: m.location,
      category: m.category,
      description: m.description,
      story: m.story || '',
      published: m.published,
    });
  };

  const startNewChapter = () => {
    setCreatingChapter(true);
    setChapterForm({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      location: 'Sri Lanka',
      category: 'travel',
      description: '',
      story: '',
      published: true,
    });
  };

  const handleSaveChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) return;
    if (creatingChapter) {
      const id = `custom-chapter-${Date.now()}`;
      const created: Milestone = {
        id,
        title: chapterForm.title.trim(),
        date: chapterForm.date,
        location: chapterForm.location.trim() || 'Sri Lanka',
        category: chapterForm.category,
        description: chapterForm.description.trim(),
        story: chapterForm.story.trim() || undefined,
        published: chapterForm.published,
        lat: 6.9271,
        lng: 79.8612,
        orderIndex: allMilestones.length + 1,
      };
      upsertMilestone(created);
      setCreatingChapter(false);
      setSelectedMilestoneId(id);
      flashStatus(`Created chapter "${created.title}".`);
    } else if (activeMilestone) {
      upsertMilestone({
        ...activeMilestone,
        title: chapterForm.title.trim(),
        date: chapterForm.date,
        location: chapterForm.location.trim(),
        category: chapterForm.category,
        description: chapterForm.description.trim(),
        story: chapterForm.story.trim() || undefined,
        published: chapterForm.published,
      });
      flashStatus(`Updated chapter "${chapterForm.title.trim()}".`);
    }
  };

  // Photo caption quick editor
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoDraft, setPhotoDraft] = useState<{
    caption: string;
    date: string;
    location: string;
    milestoneId: string;
  }>({ caption: '', date: '', location: '', milestoneId: '' });

  const startEditPhoto = (photo: MemoryPhoto) => {
    setEditingPhotoId(photo.id);
    setPhotoDraft({
      caption: photo.caption,
      date: photo.date || '',
      location: photo.location || '',
      milestoneId: photo.milestoneId,
    });
  };

  const saveEditPhoto = (id: string) => {
    updatePhoto(id, {
      caption: photoDraft.caption.trim(),
      date: photoDraft.date.trim() || undefined,
      location: photoDraft.location.trim() || undefined,
      milestoneId: photoDraft.milestoneId,
    });
    setEditingPhotoId(null);
    flashStatus('Photograph details saved.');
  };

  // Surprise editor state
  const [surpriseForm, setSurpriseForm] = useState<{
    kind: 'quote' | 'secret_memory';
    title: string;
    dateHint: string;
    message: string;
  }>({
    kind: 'secret_memory',
    title: '',
    dateHint: '',
    message: '',
  });

  const handleAddSurprise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!surpriseForm.title.trim() || !surpriseForm.message.trim()) return;
    const item: SurpriseItem = {
      id: `surprise-${Date.now()}`,
      kind: surpriseForm.kind,
      title: surpriseForm.title.trim(),
      dateHint: surpriseForm.dateHint.trim() || undefined,
      message: surpriseForm.message.trim(),
    };
    upsertSurprise(item);
    setSurpriseForm({ kind: 'secret_memory', title: '', dateHint: '', message: '' });
    flashStatus(`Added "${item.title}" to the Header Surprise jar.`);
  };

  // Couple & Intro form
  const [coupleForm, setCoupleForm] = useState({
    himName: config.himName,
    herName: config.herName,
    herNickname: config.herNickname,
    anniversaryDate: config.anniversaryDate,
    birthdayMonthDay: config.birthdayMonthDay,
    openingQuote: config.openingQuote || '',
  });

  const handleSaveCouple = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      himName: coupleForm.himName.trim() || 'Sithum',
      herName: coupleForm.herName.trim() || 'Nihara',
      herNickname: coupleForm.herNickname.trim() || 'Manika',
      anniversaryDate: coupleForm.anniversaryDate,
      birthdayMonthDay: coupleForm.birthdayMonthDay.trim() || '01-08',
      openingQuote: coupleForm.openingQuote.trim(),
    });
    flashStatus('Couple details and opening quote updated.');
  };

  // Backup import/export state
  const [importText, setImportText] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  function flashStatus(msg: string) {
    setStatusMsg(msg);
    window.setTimeout(() => {
      setStatusMsg((curr) => (curr === msg ? null : curr));
    }, 4000);
  }

  const handleDownloadBackup = () => {
    const json = exportStudioData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forever-yours-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashStatus('Downloaded JSON backup of your Studio edits.');
  };

  const handleImportBackup = () => {
    const result = importStudioData(importText);
    if (result.ok) {
      setImportText('');
      flashStatus('Backup imported and applied cleanly.');
    } else {
      flashStatus(result.error || 'Could not import JSON.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      {/* Studio Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#D6B477]/35 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-[#C98291] uppercase dark:text-[#E7C38A]">
            Create Studio · Admin Editor
          </p>
          <h2 className="mt-1 font-serif-display text-3xl font-bold text-[#542D3A] sm:text-4xl dark:text-[#FFF5F0]">
            Small Edits &amp; Curation Studio
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#7D5260] dark:text-[#D9B8C2]">
            Fine-tune milestone dates, chapter stories, photo captions, favorite hearts, and
            Surprise jar notes directly in your browser—no login or external storage required.
          </p>
        </div>

        {statusMsg && (
          <div
            role="status"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Section Switcher */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'chapters', label: 'Chapters & Dates', icon: Calendar },
            { id: 'photos', label: 'Photo Captions', icon: ImageIcon },
            { id: 'surprises', label: 'Surprise Notes', icon: Gift },
            { id: 'couple', label: 'Couple & Intro', icon: Sliders },
            { id: 'backup', label: 'Backup / Reset', icon: Download },
          ] as { id: StudioSection; label: string; icon: typeof Calendar }[]
        ).map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSection(tab.id)}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-[#542D3A] bg-[#542D3A] text-[#FFF9F2] dark:border-[#E7C38A] dark:bg-[#E7C38A] dark:text-[#1A0810]'
                  : 'border-[#D6B477]/50 bg-white/85 text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#230E18] dark:text-[#FCE8E8] dark:hover:bg-[#3A192A]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Chapters & Dates */}
      {section === 'chapters' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="luxury-glass space-y-2 rounded-[24px] p-4 lg:col-span-5">
            <div className="mb-3 flex items-center justify-between gap-2 px-1">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                All Milestones ({sortedMilestones.length})
              </p>
              <button
                type="button"
                onClick={startNewChapter}
                className="inline-flex items-center gap-1 rounded-full bg-[#542D3A] px-3 py-1.5 text-[11px] font-semibold text-[#FFF9F2] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Chapter</span>
              </button>
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {sortedMilestones.map((m) => {
                const selected = !creatingChapter && activeMilestone?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectChapterForEdit(m)}
                    className={`flex w-full items-start justify-between gap-3 rounded-2xl border p-3 text-left transition-colors ${
                      selected
                        ? 'border-[#C98291] bg-[#FCE8E8]/85 text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#3A192A] dark:text-[#FFF5F0]'
                        : 'border-[#D6B477]/35 bg-white/75 text-[#542D3A] hover:bg-[#FFF9F2] dark:bg-[#210E18]/80 dark:text-[#FCE8E8] dark:hover:bg-[#2C1320]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-serif-display text-lg font-bold">{m.title}</p>
                      <p className="mt-0.5 text-xs text-[#8c5263] tabular-nums dark:text-[#D9B8C2]">
                        {m.date} · {m.location}
                      </p>
                    </div>
                    {!m.published && (
                      <EyeOff className="mt-1 h-4 w-4 shrink-0 text-[#9A6876] dark:text-[#D9B8C2]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleSaveChapter}
            className="luxury-glass space-y-4 rounded-[24px] p-6 lg:col-span-7"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6B477]/30 pb-3">
              <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                {creatingChapter ? 'Create New Milestone' : `Editing: ${activeMilestone?.title || ''}`}
              </h3>
              {!creatingChapter && activeMilestone && !activeMilestone.isDefaultSeed && (
                <button
                  type="button"
                  onClick={() => {
                    deleteMilestone(activeMilestone.id);
                    flashStatus(`Removed custom chapter "${activeMilestone.title}".`);
                  }}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-400/50 px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                <span>Chapter Title</span>
                <input
                  type="text"
                  required
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#C98291] focus:outline-none dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                />
              </label>

              <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                <span>Date</span>
                <input
                  type="date"
                  required
                  value={chapterForm.date}
                  onChange={(e) => setChapterForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] tabular-nums focus:border-[#C98291] focus:outline-none dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                />
              </label>

              <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                <span>Location</span>
                <input
                  type="text"
                  value={chapterForm.location}
                  onChange={(e) => setChapterForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#C98291] focus:outline-none dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                />
              </label>

              <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                <span>Category</span>
                <select
                  value={chapterForm.category}
                  onChange={(e) =>
                    setChapterForm((f) => ({
                      ...f,
                      category: e.target.value as 'travel' | 'milestone' | 'celebration',
                    }))
                  }
                  className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#C98291] focus:outline-none dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                >
                  <option value="travel">Travel Chapter</option>
                  <option value="milestone">Relationship Milestone</option>
                  <option value="celebration">Celebration Keepsake</option>
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Short Summary</span>
              <textarea
                rows={2}
                value={chapterForm.description}
                onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#C98291] focus:outline-none dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Full Story Reflection</span>
              <textarea
                rows={3}
                value={chapterForm.story}
                onChange={(e) => setChapterForm((f) => ({ ...f, story: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] focus:border-[#C98291] focus:outline-none dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setChapterForm((f) => ({ ...f, published: !f.published }))}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477]/60 bg-white px-3.5 py-2 text-xs font-semibold text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]"
              >
                {chapterForm.published ? (
                  <>
                    <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Visible on Website</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-[#9A6876]" />
                    <span>Hidden Draft</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] shadow-sm hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810] dark:hover:bg-[#f0d2a0]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{creatingChapter ? 'Create Milestone' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Section 2: Photo Captions & Favorites */}
      {section === 'photos' && (
        <div className="space-y-4">
          <p className="text-xs text-[#7D5260] dark:text-[#D9B8C2]">
            All curated website photographs load directly from local static assets. Update
            captions, dates, chapter tags, or mark favorite hearts below.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {sortByDateAsc(allPhotos).map((photo) => {
              const isEditing = editingPhotoId === photo.id;
              const src = resolvePhotoSrc(photo);
              const chapter = allMilestones.find((m) => m.id === photo.milestoneId);

              return (
                <div
                  key={photo.id}
                  className="luxury-glass flex flex-col gap-3 rounded-[24px] p-4 sm:flex-row"
                >
                  <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-[#FCE8E8] sm:h-28 sm:w-28 dark:bg-[#2A121D]">
                    {src && (
                      <SecurePhotoImg
                        src={src}
                        fallbackSrc={resolvePhotoFallbackSrc(photo)}
                        alt={photo.caption}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={photoDraft.caption}
                          onChange={(e) =>
                            setPhotoDraft((d) => ({ ...d, caption: e.target.value }))
                          }
                          className="w-full rounded-xl border border-[#D6B477]/60 bg-white px-2.5 py-1.5 text-xs text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={photoDraft.date}
                            onChange={(e) =>
                              setPhotoDraft((d) => ({ ...d, date: e.target.value }))
                            }
                            className="rounded-lg border border-[#D6B477]/50 bg-white px-2 py-1 text-xs text-[#542D3A] tabular-nums dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                          />
                          <input
                            type="text"
                            placeholder="Location"
                            value={photoDraft.location}
                            onChange={(e) =>
                              setPhotoDraft((d) => ({ ...d, location: e.target.value }))
                            }
                            className="rounded-lg border border-[#D6B477]/50 bg-white px-2 py-1 text-xs text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                          />
                        </div>
                        <select
                          value={photoDraft.milestoneId}
                          onChange={(e) =>
                            setPhotoDraft((d) => ({ ...d, milestoneId: e.target.value }))
                          }
                          className="w-full rounded-lg border border-[#D6B477]/50 bg-white px-2 py-1 text-xs text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
                        >
                          {sortedMilestones.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.title} ({m.date})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => saveEditPhoto(photo.id)}
                            className="rounded-full bg-[#542D3A] px-3.5 py-1 text-xs font-semibold text-[#FFF9F2] dark:bg-[#E7C38A] dark:text-[#1A0810]"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPhotoId(null)}
                            className="rounded-full border border-[#D6B477]/60 px-3 py-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-[11px] font-semibold text-[#C98291] tabular-nums dark:text-[#E7C38A]">
                          {chapter?.title || 'Shared Archive'} · {photo.date}
                        </p>
                        <p className="line-clamp-2 text-sm text-[#542D3A] dark:text-[#FFF5F0]">
                          {photo.caption}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => startEditPhoto(photo)}
                            className="rounded-full border border-[#D6B477]/55 bg-white px-3 py-1 text-[11px] font-semibold text-[#542D3A] hover:bg-[#FCE8E8] dark:bg-[#27111C] dark:text-[#FCE8E8]"
                          >
                            Edit Caption &amp; Date
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              togglePhotoFavorite(photo.id);
                              flashStatus('Updated favorite highlight.');
                            }}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold ${
                              photo.isFavorite
                                ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                                : 'border-[#D6B477]/45 bg-white/80 text-[#7D5260] dark:bg-[#27111C] dark:text-[#D9B8C2]'
                            }`}
                          >
                            <Heart
                              className={`h-3 w-3 ${photo.isFavorite ? 'fill-[#C98291] text-[#C98291] dark:fill-[#E7C38A] dark:text-[#E7C38A]' : ''}`}
                            />
                            <span>{photo.isFavorite ? 'Favorite' : 'Mark Favorite'}</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Surprise Notes */}
      {section === 'surprises' && (
        <div className="grid gap-6 lg:grid-cols-12">
          <form
            onSubmit={handleAddSurprise}
            className="luxury-glass space-y-4 rounded-[24px] p-6 lg:col-span-5"
          >
            <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Add to Surprise Jar
            </h3>
            <p className="text-xs text-[#7D5260] dark:text-[#D9B8C2]">
              Notes added here appear randomly when anyone clicks the &ldquo;Surprise&rdquo; button
              in the header.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'secret_memory', label: 'Secret Memory' },
                  { id: 'quote', label: 'Warm Quote' },
                ] as const
              ).map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSurpriseForm((s) => ({ ...s, kind: k.id }))}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                    surpriseForm.kind === k.id
                      ? 'border-[#C98291] bg-[#FCE8E8] text-[#542D3A] dark:border-[#E7C38A] dark:bg-[#491E33] dark:text-[#FFF5F0]'
                      : 'border-[#D6B477]/40 bg-white/70 text-[#7D5260] dark:bg-[#210E18] dark:text-[#D9B8C2]'
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>

            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Headline</span>
              <input
                type="text"
                required
                placeholder="e.g., Laughing in the Rain"
                value={surpriseForm.title}
                onChange={(e) => setSurpriseForm((s) => ({ ...s, title: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Date or Chapter Hint (Optional)</span>
              <input
                type="text"
                placeholder="e.g., July 14, 2026"
                value={surpriseForm.dateHint}
                onChange={(e) => setSurpriseForm((s) => ({ ...s, dateHint: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>

            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Message</span>
              <textarea
                rows={3}
                required
                placeholder="Write a heartwarming quote or secret memory..."
                value={surpriseForm.message}
                onChange={(e) => setSurpriseForm((s) => ({ ...s, message: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>

            <button
              type="submit"
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Surprise Note</span>
            </button>
          </form>

          <div className="luxury-glass space-y-3 rounded-[24px] p-6 lg:col-span-7">
            <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Saved Surprise Notes ({surprises.length})
            </h3>
            <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
              {surprises.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[#D6B477]/35 bg-white/80 p-4 dark:bg-[#210E18]/85"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold tracking-[0.14em] text-[#C98291] uppercase dark:text-[#E7C38A]">
                      {item.kind === 'secret_memory' ? 'Secret Memory' : 'Quote'}
                      {item.dateHint ? ` · ${item.dateHint}` : ''}
                    </p>
                    <p className="mt-0.5 font-serif-display text-lg font-bold text-[#542D3A] dark:text-[#FFF5F0]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6c4150] dark:text-[#EAD0D9]">
                      {item.message}
                    </p>
                  </div>
                  {surprises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteSurprise(item.id);
                        flashStatus(`Removed "${item.title}".`);
                      }}
                      aria-label={`Delete ${item.title}`}
                      className="shrink-0 rounded-full p-2 text-[#9A6876] hover:bg-rose-50 hover:text-rose-700 dark:text-[#D9B8C2] dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 4: Couple & Intro */}
      {section === 'couple' && (
        <form
          onSubmit={handleSaveCouple}
          className="luxury-glass max-w-3xl space-y-4 rounded-[24px] p-6"
        >
          <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
            Couple Names, Key Dates &amp; Opening Quote
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Partner One</span>
              <input
                type="text"
                value={coupleForm.himName}
                onChange={(e) => setCoupleForm((f) => ({ ...f, himName: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Partner Two</span>
              <input
                type="text"
                value={coupleForm.herName}
                onChange={(e) => setCoupleForm((f) => ({ ...f, herName: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Affectionate Nickname</span>
              <input
                type="text"
                value={coupleForm.herNickname}
                onChange={(e) => setCoupleForm((f) => ({ ...f, herNickname: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>
            <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
              <span>Relationship Start Date</span>
              <input
                type="date"
                value={coupleForm.anniversaryDate}
                onChange={(e) => setCoupleForm((f) => ({ ...f, anniversaryDate: e.target.value }))}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] tabular-nums dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
            <span>Opening Quote</span>
            <textarea
              rows={3}
              value={coupleForm.openingQuote}
              onChange={(e) => setCoupleForm((f) => ({ ...f, openingQuote: e.target.value }))}
              className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 text-sm text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
            />
          </label>
          <button
            type="submit"
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Couple Details</span>
          </button>
        </form>
      )}

      {/* Section 5: Backup & Reset */}
      {section === 'backup' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="luxury-glass space-y-4 rounded-[24px] p-6">
            <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Export or Restore Edits
            </h3>
            <p className="text-xs leading-relaxed text-[#7D5260] dark:text-[#D9B8C2]">
              Because Forever Yours runs cleanly with local static assets and browser persistence,
              you can download a JSON copy of your Studio edits to move across browsers or restore
              at any time.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full bg-[#542D3A] px-5 py-2 text-xs font-semibold text-[#FFF9F2] hover:bg-[#6d3b4c] dark:bg-[#E7C38A] dark:text-[#1A0810]"
            >
              <Download className="h-4 w-4" />
              <span>Download Studio Backup (.json)</span>
            </button>

            <div className="space-y-2 border-t border-[#D6B477]/30 pt-4">
              <label className="block text-xs font-semibold text-[#542D3A] dark:text-[#FCE8E8]">
                Paste Backup JSON to Restore
              </label>
              <textarea
                rows={4}
                placeholder='{"config": ..., "milestones": [...]}'
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full rounded-xl border border-[#D6B477]/55 bg-white px-3 py-2 font-mono text-xs text-[#542D3A] dark:bg-[#1E0C15] dark:text-[#FFF5F0]"
              />
              <button
                type="button"
                disabled={!importText.trim()}
                onClick={handleImportBackup}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B477] bg-white px-4 py-2 text-xs font-semibold text-[#542D3A] disabled:opacity-45 dark:bg-[#27111C] dark:text-[#FCE8E8]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Apply Backup JSON</span>
              </button>
            </div>
          </div>

          <div className="luxury-glass space-y-4 rounded-[24px] p-6">
            <h3 className="font-serif-display text-2xl font-bold text-[#542D3A] dark:text-[#FFF5F0]">
              Restore Curated Defaults
            </h3>
            <p className="text-xs leading-relaxed text-[#7D5260] dark:text-[#D9B8C2]">
              Revert local Studio edits back to the original curated chapters (including July 14,
              2026 for Alien Fall &amp; Lanka Fall), captions, and Surprise notes.
            </p>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex min-h-[42px] items-center gap-1.5 rounded-full border border-rose-400/60 bg-white px-5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:bg-[#27111C] dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Reset Studio Edits to Defaults</span>
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-rose-400/50 bg-rose-50/75 p-4 dark:bg-rose-950/35">
                <p className="w-full text-xs font-semibold text-rose-900 dark:text-rose-200">
                  Confirm restoring original curated seed details?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetStudioOverrides();
                    setConfirmReset(false);
                    flashStatus('Restored curated defaults across all chapters and captions.');
                  }}
                  className="rounded-full bg-rose-700 px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="rounded-full border border-[#D6B477] bg-white px-4 py-1.5 text-xs font-semibold text-[#542D3A] dark:bg-[#27111C] dark:text-[#FCE8E8]"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
