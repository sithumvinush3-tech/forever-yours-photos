import { LocalAssistantService } from '../services/LocalAssistantService';

export async function compressImageFileToDataUrl(
  file: File,
  maxDimension = 1360,
  quality = 0.82,
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read selected image file.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Invalid or unsupported image file.'));
    image.src = dataUrl;
  });

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  ctx.drawImage(img, 0, 0, width, height);

  let compressed = canvas.toDataURL('image/jpeg', quality);
  let currentQuality = quality;
  while (compressed.length > 700000 && currentQuality > 0.45) {
    currentQuality -= 0.1;
    compressed = canvas.toDataURL('image/jpeg', currentQuality);
  }
  let step = 0;
  while (compressed.length > 720000 && step < 4) {
    step += 1;
    width = Math.max(320, Math.round(width * 0.78));
    height = Math.max(320, Math.round(height * 0.78));
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    compressed = canvas.toDataURL('image/jpeg', Math.max(0.5, currentQuality));
  }
  return compressed;
}

/**
 * Generates an honest metadata-based caption suggestion purely client-side
 * without calling any external backend or AI API.
 */
export async function requestAutoCaption(params: {
  imageData?: string;
  fileName?: string;
  title?: string;
  location?: string;
  date?: string;
  description?: string;
  coupleLabel?: string;
  himName?: string;
  herName?: string;
  herNickname?: string;
}): Promise<string> {
  return LocalAssistantService.suggestMetadataCaption(params);
}

export type BoothLayout = 'vertical' | 'grid2x2' | 'wide';
export type BoothTheme = 'burgundy' | 'obsidian' | 'cream' | 'blush' | 'gold';
export type BoothSticker = 'none' | 'hearts' | 'sparkles' | 'roses' | 'crown';

export interface PhotoAdjustment {
  brightness: number; // 100 default
  contrast: number; // 100 default
  warmth: number; // 0 default (sepia %)
  grayscale?: number; // 0 default (0 or 100)
  rotation: number; // 0, 90, 180, 270
}

export async function renderPhotoStripPng(params: {
  images: string[];
  captions: string[];
  stripTitle: string;
  dateLabel: string;
  coupleLabel?: string;
  theme: BoothTheme;
  layout?: BoothLayout;
  sticker?: BoothSticker;
  adjustments?: PhotoAdjustment;
}): Promise<string> {
  const {
    images,
    captions,
    stripTitle,
    dateLabel,
    coupleLabel = 'Sithum & Nihara',
    theme,
    layout = 'vertical',
    sticker = 'hearts',
    adjustments,
  } = params;

  const count = Math.max(1, Math.min(4, images.length));
  const width = layout === 'vertical' ? 760 : layout === 'grid2x2' ? 1080 : 1240;
  const headerH = 148;
  const footerH = 112;

  let height = 900;
  if (layout === 'vertical') {
    height = headerH + count * 468 + footerH;
  } else if (layout === 'grid2x2') {
    const rows = count > 2 ? 2 : 1;
    height = headerH + rows * 440 + footerH;
  } else {
    height = headerH + 460 + footerH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize photo strip canvas.');

  const palette =
    theme === 'cream'
      ? { bg: '#FFF9F2', border: '#D6B477', text: '#542D3A', accent: '#C98291', frameBg: '#F6E8E8' }
      : theme === 'obsidian'
        ? { bg: '#160910', border: '#D6B477', text: '#FFF9F2', accent: '#E8A5B3', frameBg: '#230F1A' }
        : theme === 'blush'
          ? { bg: '#FCE8E8', border: '#C98291', text: '#542D3A', accent: '#9B4D5F', frameBg: '#FFF9F2' }
          : theme === 'gold'
            ? { bg: '#2C1B12', border: '#E7C38A', text: '#FFF7E8', accent: '#E7C38A', frameBg: '#3D2518' }
            : { bg: '#542D3A', border: '#D6B477', text: '#FFF9F2', accent: '#FCE8E8', frameBg: '#381C26' };

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = palette.border;
  ctx.lineWidth = 4;
  ctx.strokeRect(18, 18, width - 36, height - 36);
  ctx.lineWidth = 1;
  ctx.strokeRect(28, 28, width - 56, height - 56);

  const stickerGlyph =
    sticker === 'hearts'
      ? '♥'
      : sticker === 'sparkles'
        ? '✦'
        : sticker === 'roses'
          ? '❀'
          : sticker === 'crown'
            ? '♛'
            : '';

  if (stickerGlyph) {
    ctx.fillStyle = palette.border;
    ctx.font = '600 24px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(stickerGlyph, 56, 62);
    ctx.fillText(stickerGlyph, width - 56, 62);
    ctx.fillText(stickerGlyph, 56, height - 46);
    ctx.fillText(stickerGlyph, width - 56, height - 46);
  }

  ctx.fillStyle = palette.accent;
  ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`FOREVER YOURS · ${coupleLabel.toUpperCase()}`, width / 2, 68);

  ctx.fillStyle = palette.text;
  ctx.font = '700 36px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(stripTitle || 'Our Keepsake Strip', width / 2, 112);

  const loadImg = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.crossOrigin = 'anonymous';
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Image load failed'));
      i.src = src;
    });

  const drawFrame = async (idx: number, x: number, y: number, w: number, h: number) => {
    const imgH = h - 46;
    ctx.fillStyle = palette.frameBg;
    ctx.fillRect(x - 6, y - 6, w + 12, h - 2);
    ctx.strokeStyle = palette.border;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 6, y - 6, w + 12, h - 2);

    ctx.fillStyle = '#0f0508';
    ctx.fillRect(x, y, w, imgH);

    try {
      const img = await loadImg(images[idx]);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, imgH);
      ctx.clip();

      if (adjustments) {
        const gray = adjustments.grayscale ?? 0;
        ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) sepia(${adjustments.warmth}%) grayscale(${gray}%)`;
      }

      const cx = x + w / 2;
      const cy = y + imgH / 2;
      ctx.translate(cx, cy);
      const rot = ((adjustments?.rotation ?? 0) % 360 + 360) % 360;
      if (rot) {
        ctx.rotate((rot * Math.PI) / 180);
      }

      const rotatedQuarterTurn = rot === 90 || rot === 270;
      const scale = rotatedQuarterTurn
        ? Math.max(w / img.height, imgH / img.width)
        : Math.max(w / img.width, imgH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    } catch {
      ctx.fillStyle = '#33111d';
      ctx.fillRect(x, y, w, imgH);
    }

    ctx.fillStyle = palette.text;
    ctx.font = 'italic 16px "Playfair Display", Georgia, serif';
    ctx.textAlign = 'center';
    const cap = (captions[idx] || '').slice(0, layout === 'vertical' ? 64 : 38);
    ctx.fillText(cap, x + w / 2, y + imgH + 26);
  };

  if (layout === 'vertical') {
    const padX = 58;
    const boxW = width - padX * 2;
    const boxH = 436;
    for (let idx = 0; idx < count; idx++) {
      await drawFrame(idx, padX, headerH + idx * 468, boxW, boxH);
    }
  } else if (layout === 'grid2x2') {
    const padX = 56;
    const gap = 32;
    const boxW = (width - padX * 2 - gap) / 2;
    const boxH = 408;
    for (let idx = 0; idx < count; idx++) {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = padX + col * (boxW + gap);
      const y = headerH + row * 440;
      await drawFrame(idx, x, y, boxW, boxH);
    }
  } else {
    const padX = 52;
    const gap = 24;
    const boxW = (width - padX * 2 - gap * (count - 1)) / count;
    const boxH = 420;
    for (let idx = 0; idx < count; idx++) {
      const x = padX + idx * (boxW + gap);
      await drawFrame(idx, x, headerH, boxW, boxH);
    }
  }

  ctx.fillStyle = palette.accent;
  ctx.font = '500 17px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dateLabel || `${coupleLabel} · Forever Yours`, width / 2, height - 48);

  try {
    return canvas.toDataURL('image/png');
  } catch {
    throw new Error(
      'Unable to export PNG right now. Please try selecting another curated photo or taking a fresh camera snapshot.',
    );
  }
}

export async function renderMemoryMovieBlob(params: {
  slides: { imageData: string; subtitle: string; date?: string; location?: string }[];
  openingTitle: string;
  closingLine: string;
  coupleLabel?: string;
  onProgress?: (pct: number) => void;
}): Promise<{ blob: Blob; mimeType: string; extension: string }> {
  const {
    slides,
    openingTitle,
    closingLine,
    coupleLabel = 'Sithum & Nihara',
    onProgress,
  } = params;
  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for video rendering.');

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load slide image.'));
      img.src = src;
    });

  const loaded = await Promise.all(
    slides.map(async (s) => ({
      ...s,
      img: await loadImage(s.imageData).catch(() => null),
    })),
  );

  const audioCtx = new AudioContext();
  let musicTimer: number | null = null;

  try {
    await audioCtx.resume().catch(() => {});
    const dest = audioCtx.createMediaStreamDestination();
    const masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.22;
    masterGain.connect(dest);

    const notes = [261.63, 329.63, 392.0, 493.88, 523.25, 440.0, 349.23, 392.0];
    let noteTick = 0;
    musicTimer = window.setInterval(() => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[noteTick % notes.length];
      g.gain.setValueAtTime(0.001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.4);
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.45);
      noteTick += 1;
    }, 750);

    const canvasStream = canvas.captureStream(30);
    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const preferredMimes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    const supportedMime =
      typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function'
        ? preferredMimes.find((m) => MediaRecorder.isTypeSupported(m))
        : undefined;

    const recorder = supportedMime
      ? new MediaRecorder(combinedStream, { mimeType: supportedMime, videoBitsPerSecond: 3500000 })
      : new MediaRecorder(combinedStream);
    const mimeType = supportedMime || recorder.mimeType || 'video/webm';
    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const fps = 30;
    const introFrames = 60;
    const slideFrames = 90;
    const outroFrames = 60;
    const totalFrames = introFrames + loaded.length * slideFrames + outroFrames;

    const donePromise = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error('Video encoder failed during export.'));
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });

    recorder.start(250);

    for (let frame = 0; frame < totalFrames; frame++) {
      ctx.fillStyle = '#090305';
      ctx.fillRect(0, 0, width, height);

      if (frame < introFrames) {
        const alpha = Math.min(1, frame / 25);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#e0568f';
        ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`FOREVER YOURS · ${coupleLabel.toUpperCase()}`, width / 2, height / 2 - 42);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 52px "Playfair Display", Georgia, serif';
        ctx.fillText(openingTitle, width / 2, height / 2 + 18);
        ctx.restore();
      } else if (frame < introFrames + loaded.length * slideFrames) {
        const rel = frame - introFrames;
        const slideIdx = Math.floor(rel / slideFrames);
        const localFrame = rel % slideFrames;
        const slide = loaded[slideIdx];
        const progress = localFrame / slideFrames;
        const fade =
          localFrame < 15 ? localFrame / 15 : localFrame > slideFrames - 15 ? (slideFrames - localFrame) / 15 : 1;

        ctx.save();
        ctx.globalAlpha = Math.max(0.05, Math.min(1, fade));
        if (slide?.img) {
          const zoom = 1 + progress * 0.08;
          const baseScale = Math.max(width / slide.img.width, height / slide.img.height) * zoom;
          const dw = slide.img.width * baseScale;
          const dh = slide.img.height * baseScale;
          ctx.drawImage(slide.img, (width - dw) / 2, (height - dh) / 2, dw, dh);
        }

        const grad = ctx.createLinearGradient(0, height * 0.5, 0, height);
        grad.addColorStop(0, 'rgba(10, 3, 5, 0)');
        grad.addColorStop(1, 'rgba(10, 3, 5, 0.92)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#f472b6';
        ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          [slide?.location, slide?.date].filter(Boolean).join(' · ') || 'Forever Yours',
          width / 2,
          height - 92,
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = 'italic 30px "Playfair Display", Georgia, serif';
        ctx.fillText((slide?.subtitle || '').slice(0, 78), width / 2, height - 48);
        ctx.restore();
      } else {
        const local = frame - (introFrames + loaded.length * slideFrames);
        ctx.save();
        ctx.globalAlpha = Math.min(1, local / 25);
        ctx.fillStyle = '#e7c38a';
        ctx.font = 'italic 36px "Playfair Display", Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(closingLine, width / 2, height / 2 - 12);
        ctx.fillStyle = '#e0568f';
        ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`Forever Yours · ${coupleLabel}`, width / 2, height / 2 + 44);
        ctx.restore();
      }

      onProgress?.(Math.round(((frame + 1) / totalFrames) * 100));
      await new Promise((r) => setTimeout(r, Math.round(1000 / fps)));
    }

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
    const blob = await donePromise;
    return { blob, mimeType, extension };
  } finally {
    if (musicTimer !== null) {
      window.clearInterval(musicTimer);
    }
    audioCtx.close().catch(() => {});
  }
}
