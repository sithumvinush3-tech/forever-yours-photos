import {
  useEffect,
  useState,
  type AudioHTMLAttributes,
  type ImgHTMLAttributes,
  type VideoHTMLAttributes,
} from 'react';

export function useDriveMediaUrl(src?: string, fallbackSrc?: string): string {
  return (src || fallbackSrc || '').trim();
}

interface SecurePhotoImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  fallbackSrc?: string;
  variant?: 'thumb' | 'full';
  lazy?: boolean;
}

export function SecurePhotoImg({
  src,
  fallbackSrc,
  variant: _variant,
  lazy = true,
  onError,
  alt = '',
  ...rest
}: SecurePhotoImgProps) {
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setUsedFallback(false);
  }, [src, fallbackSrc]);

  const effectiveSrc = usedFallback && fallbackSrc ? fallbackSrc : (src || fallbackSrc || '').trim();

  if (!effectiveSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-[#FCE8E8]/60 p-3 text-center text-[11px] font-medium text-[#7D5260] dark:bg-[#240F1A] dark:text-[#D9B8C2] ${rest.className || ''}`}
      >
        <span>Photo unavailable</span>
      </div>
    );
  }

  return (
    <img
      {...rest}
      src={effectiveSrc}
      alt={alt}
      loading={lazy ? 'lazy' : undefined}
      onError={(e) => {
        if (!usedFallback && fallbackSrc && fallbackSrc !== effectiveSrc) {
          setUsedFallback(true);
          return;
        }
        onError?.(e);
      }}
    />
  );
}

interface SecureDriveAudioProps extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src'> {
  src?: string;
}

export function SecureDriveAudio({ src, ...rest }: SecureDriveAudioProps) {
  const resolved = (src || '').trim();
  if (!resolved) {
    return (
      <p className="text-[11px] text-[#7D5260] dark:text-[#D9B8C2]">Audio unavailable</p>
    );
  }
  return <audio {...rest} src={resolved} />;
}

interface SecureDriveVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src?: string;
}

export function SecureDriveVideo({ src, ...rest }: SecureDriveVideoProps) {
  const resolved = (src || '').trim();
  if (!resolved) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-xl bg-black/40 text-xs text-white/80">
        Video unavailable
      </div>
    );
  }
  return <video {...rest} src={resolved} />;
}
