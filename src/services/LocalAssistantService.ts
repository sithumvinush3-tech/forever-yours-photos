import type {
  DiaryEntry,
  LoveLetter,
  MemoryPhoto,
  Milestone,
  StoryEntry,
  TravelMemory,
} from '../types';
import { sortByDateAsc } from '../utils/dates';

/**
 * LocalAssistantService provides honest, deterministic, 100% client-side helpers
 * replacing removed backend Gemini API calls. None of these methods call an LLM or
 * expose API keys, and the UI clearly labels them as template/local search/calculation features.
 */
export const LocalAssistantService = {
  suggestMetadataCaption(params: {
    title?: string;
    location?: string;
    date?: string;
    description?: string;
    fileName?: string;
    coupleLabel?: string;
    himName?: string;
    herName?: string;
  }): string {
    const couple =
      params.coupleLabel || `${params.himName || 'Sithum'} & ${params.herName || 'Nihara'}`;
    const rawName = (params.fileName || '')
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    const label = (params.title || rawName || 'Cherished moment').trim();
    const where = params.location ? ` at ${params.location.trim()}` : '';
    const when = params.date ? ` (${params.date.trim()})` : '';
    const detail = params.description?.trim() ? ` — ${params.description.trim()}` : '';
    return `${label}${where}${when}${detail} · ${couple}`.slice(0, 260);
  },

  buildLocalStoryTemplate(params: {
    title: string;
    location?: string;
    date?: string;
    description?: string;
    captions?: string[];
    himName?: string;
    herName?: string;
    herNickname?: string;
  }): string {
    const him = params.himName || 'Sithum';
    const her = params.herName || 'Nihara';
    const nick = params.herNickname || her;
    const place = params.location?.trim() || 'together under open skies';
    const date = params.date?.trim() || 'that unforgettable day';
    const baseNote = params.description?.trim()
      ? `${params.description.trim()} `
      : '';
    const photoEcho =
      params.captions && params.captions.length > 0
        ? ` Looking back at snapshots like "${params.captions[0]}" brings every smile right back.`
        : '';

    return [
      `On ${date}, ${him} and ${her} (${nick}) stepped into "${params.title.trim()}" at ${place}.`,
      `${baseNote}Time slowed down with every shared laugh, quiet conversation, and view we captured side by side.${photoEcho}`,
      `Saved permanently inside Forever Yours as a chapter to revisit whenever we miss the magic of that day.`,
    ].join('\n\n');
  },

  searchLocalMemories(params: {
    question: string;
    milestones: Milestone[];
    photos: MemoryPhoto[];
    letters: LoveLetter[];
    diaryEntries?: DiaryEntry[];
    stories?: StoryEntry[];
    travels?: TravelMemory[];
  }): { answer: string; matchedPhotoIds: string[]; matchedMilestones: Milestone[] } {
    const rawQ = params.question.trim().toLowerCase();
    const stopWords = new Set([
      'the',
      'a',
      'an',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'our',
      'my',
      'me',
      'us',
      'we',
      'show',
      'find',
      'what',
      'where',
      'when',
      'which',
      'with',
      'and',
      'or',
    ]);
    const tokens = rawQ
      .split(/[^a-z0-9]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !stopWords.has(t));

    const scoreText = (haystack: string): number => {
      if (!rawQ) return 0;
      const lower = haystack.toLowerCase();
      if (lower.includes(rawQ)) return tokens.length + 3;
      let hits = 0;
      for (const tok of tokens) {
        if (lower.includes(tok)) hits += 1;
      }
      return hits;
    };

    const matchedMilestones = params.milestones
      .map((m) => ({
        item: m,
        score: scoreText(`${m.title} ${m.location} ${m.date} ${m.description} ${m.story || ''}`),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);

    const matchedPhotos = params.photos
      .map((p) => {
        const ms = params.milestones.find((m) => m.id === p.milestoneId);
        const s = scoreText(
          `${p.caption} ${p.location || ''} ${p.date || ''} ${p.fileName || ''} ${ms?.title || ''}`,
        );
        return { item: p, score: s };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);

    const matchedLetters = params.letters.filter(
      (l) => scoreText(`${l.title} ${l.promptLabel || ''} ${l.body}`) > 0,
    );
    const matchedDiary = (params.diaryEntries || []).filter(
      (d) => scoreText(`${d.title} ${d.body} ${d.entryDate}`) > 0,
    );
    const matchedStories = (params.stories || []).filter(
      (st) => scoreText(`${st.title} ${st.summary} ${st.narrative}`) > 0,
    );
    const matchedTravels = (params.travels || []).filter(
      (tr) => scoreText(`${tr.title} ${tr.location} ${tr.notes} ${tr.travelDate}`) > 0,
    );

    const parts: string[] = [];
    if (matchedMilestones.length > 0) {
      const m = matchedMilestones[0];
      parts.push(
        `Found ${matchedMilestones.length} matching chapter(s), including "${m.title}" (${m.location} · ${m.date}): ${m.description}`,
      );
    }
    if (matchedPhotos.length > 0) {
      parts.push(
        `Matched ${matchedPhotos.length} photograph(s) (e.g., "${matchedPhotos[0].caption}").`,
      );
    }
    if (matchedLetters.length > 0) {
      parts.push(
        `Matched ${matchedLetters.length} letter(s) including "${matchedLetters[0].title}".`,
      );
    }
    if (matchedDiary.length > 0) {
      parts.push(`Matched ${matchedDiary.length} diary entry/entries.`);
    }
    if (matchedStories.length > 0) {
      parts.push(`Matched ${matchedStories.length} story entry/entries.`);
    }
    if (matchedTravels.length > 0) {
      parts.push(`Matched ${matchedTravels.length} travel chronicle(s).`);
    }

    if (parts.length === 0) {
      return {
        answer:
          `Local keyword search across ${params.milestones.length} chapters, ${params.photos.length} photos, and ${params.letters.length} letters found no exact match for "${params.question.trim()}". Try searching a location name (e.g. Baker's Bend, Bambarakanda, Bandarawela), month, or caption word.`,
        matchedPhotoIds: [],
        matchedMilestones: [],
      };
    }

    return {
      answer: `Local Archive Search Results: ${parts.join(' ')}`,
      matchedPhotoIds: matchedPhotos.slice(0, 6).map((p) => p.id),
      matchedMilestones: matchedMilestones.slice(0, 4),
    };
  },

  computeLocalYearReviewHighlights(params: {
    milestones: Milestone[];
    photos: MemoryPhoto[];
    letters: LoveLetter[];
    himName?: string;
    herName?: string;
    anniversaryDate?: string;
  }): string[] {
    const sorted = sortByDateAsc(params.milestones);
    const locations = Array.from(
      new Set(sorted.map((m) => m.location?.trim()).filter((x): x is string => Boolean(x))),
    );
    const favCount = params.photos.filter((p) => p.isFavorite).length;
    const firstChapter = sorted[0];
    const latestChapter = sorted[sorted.length - 1];
    const couple = `${params.himName || 'Sithum'} & ${params.herName || 'Nihara'}`;

    const lines: string[] = [
      `Archive Totals: ${sorted.length} saved chapters, ${params.photos.length} photographs (${favCount} starred favorites), and ${params.letters.length} letters & notes for ${couple}.`,
      `Places Explored: ${locations.length} unique locations recorded${locations.length ? ` — ${locations.slice(0, 4).join(', ')}` : ''}.`,
    ];
    if (firstChapter) {
      lines.push(
        `Opening Chapter: "${firstChapter.title}" on ${firstChapter.date} at ${firstChapter.location}.`,
      );
    }
    if (latestChapter && latestChapter.id !== firstChapter?.id) {
      lines.push(
        `Most Recent Chapter: "${latestChapter.title}" on ${latestChapter.date} at ${latestChapter.location}.`,
      );
    }
    if (params.anniversaryDate) {
      lines.push(`Together Since: ${params.anniversaryDate} — all metrics calculated locally from your current archive.`);
    }
    return lines;
  },

  buildLocalMovieNarration(params: {
    title: string;
    slides: { caption?: string; location?: string; date?: string }[];
    himName?: string;
    herName?: string;
    herNickname?: string;
  }): {
    openingTitle: string;
    closingLine: string;
    scenes: { index: number; subtitle: string }[];
  } {
    const him = params.himName || 'Sithum';
    const her = params.herName || 'Nihara';
    const nick = params.herNickname || her;
    return {
      openingTitle: params.title.trim() || `${him} & ${her} — Memories Film`,
      closingLine: `Every frame with you, ${nick}, is forever.`,
      scenes: params.slides.map((s, index) => {
        const cap = (s.caption || '').trim();
        const loc = (s.location || '').trim();
        const date = (s.date || '').trim();
        const subtitle = cap || [loc, date].filter(Boolean).join(' · ') || `Chapter Moment #${index + 1}`;
        return { index, subtitle: subtitle.slice(0, 78) };
      }),
    };
  },
};
