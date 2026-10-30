"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { completeVideoAction, startVideoAction } from "@/app/actions";
import { primaryButton, secondaryButton } from "@/components/ui";

/**
 * Pemutar tanpa kontrol bawaan: tidak ada seek, tidak ada percepatan, dan
 * video berhenti bila tab ditinggalkan. Pencegahan di browser ini hanya
 * lapis pertama; server tetap memeriksa lamanya waktu sejak video dimulai.
 *
 * Dua sumber: YouTube (IFrame API) atau berkas MP4 sendiri.
 */

interface Controls {
  play: () => void;
  pause: () => void;
}

interface MediaEvents {
  onReady: (controls: Controls) => void;
  onPlaying: () => void;
  onPaused: () => void;
  onProgress: (percent: number) => void;
  onEnded: () => void;
  onFailed: (reason?: string) => void;
}

export default function VideoPlayer({
  code,
  src,
  youtubeId,
}: {
  code: string;
  src: string;
  youtubeId: string | null;
}) {
  const router = useRouter();
  const controlsRef = useRef<Controls | null>(null);
  const startedRef = useRef(false);
  // Ketukan "Putar" sebelum pemutar siap diantre, lalu dijalankan begitu siap.
  const pendingPlayRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"watching" | "finishing" | "done">("watching");
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [failReason, setFailReason] = useState<string | null>(null);
  // Beberapa browser (iOS) hanya mau memutar YouTube bila pengguna mengetuk iframe-nya langsung.
  const [directTap, setDirectTap] = useState(false);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") controlsRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  const events: MediaEvents = {
    onReady: useCallback((c) => {
      controlsRef.current = c;
      if (pendingPlayRef.current) {
        pendingPlayRef.current = false;
        c.play();
      }
    }, []),
    onPlaying: useCallback(() => {
      setPlaying(true);
      setError(null);
      setDirectTap(false);
      if (!startedRef.current) {
        startedRef.current = true;
        void startVideoAction(code);
      }
    }, [code]),
    onPaused: useCallback(() => setPlaying(false), []),
    onProgress: useCallback((p) => setProgress(p), []),
    onEnded: useCallback(async () => {
      setPhase("finishing");
      const res = await completeVideoAction(code);
      if (res.ok) {
        setPhase("done");
      } else {
        setError(res.error ?? "Gagal menyimpan. Coba lagi.");
        setPhase("watching");
      }
    }, [code]),
    onFailed: useCallback((reason?: string) => {
      setLoadFailed(true);
      if (reason) setFailReason(reason);
    }, []),
  };

  function togglePlay() {
    if (phase !== "watching") return;
    if (playing) {
      controlsRef.current?.pause();
      return;
    }
    if (controlsRef.current) controlsRef.current.play();
    else pendingPlayRef.current = true;
    // Bila dalam 2 detik belum berputar, izinkan ketukan langsung ke pemutar.
    if (youtubeId) setTimeout(() => setDirectTap((prev) => prev || !startedRef.current), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        {youtubeId ? (
          <YouTubeMedia videoId={youtubeId} {...events} />
        ) : (
          <Mp4Media src={src} {...events} />
        )}
        {/* Lapisan penutup: mencegah ketukan ke antarmuka YouTube/tautan di dalam iframe. */}
        {youtubeId && !directTap ? <div className="absolute inset-0" /> : null}
        {!playing && phase === "watching" && !loadFailed && !directTap ? (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Putar video"
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-600 text-3xl text-white">
              ▶
            </span>
          </button>
        ) : null}
      </div>

      {directTap && !playing ? (
        <p role="status" className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm">
          Ketuk langsung pada video untuk memulai.
        </p>
      ) : null}

      {loadFailed ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Video tidak dapat dimuat. Periksa sinyal Anda, muat ulang halaman, atau hubungi security.
          {failReason ? <span className="mt-1 block text-xs opacity-80">Rincian: {failReason}</span> : null}
        </p>
      ) : null}

      <div className="h-2 overflow-hidden rounded-full bg-neutral-200" aria-hidden>
        <div className="h-full rounded-full bg-brand-600 transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <button
        type="button"
        onClick={togglePlay}
        disabled={phase !== "watching"}
        className={`${secondaryButton} w-full`}
      >
        {playing ? "⏸ Jeda" : "▶ Putar"}
      </button>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={phase !== "done"}
        onClick={() => router.refresh()}
        className={primaryButton}
      >
        {phase === "done" ? "Lanjut ke pertanyaan" : phase === "finishing" ? "Menyimpan…" : "Tonton sampai selesai untuk lanjut"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- MP4

function Mp4Media({ src, onReady, onPlaying, onPaused, onProgress, onEnded, onFailed }: MediaEvents & { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const furthestRef = useRef(0);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    onReady({
      play: () => {
        v.play().catch(() => onFailed("berkas video tidak ditemukan atau tidak bisa diputar"));
      },
      pause: () => v.pause(),
    });
  }, [onReady, onFailed]);

  return (
    <video
      ref={videoRef}
      className="aspect-video w-full"
      playsInline
      preload="metadata"
      controlsList="nodownload noremoteplayback"
      disablePictureInPicture
      onContextMenu={(e) => e.preventDefault()}
      onPlay={onPlaying}
      onPause={onPaused}
      onTimeUpdate={(e) => {
        const v = e.currentTarget;
        if (!v.seeking && v.currentTime > furthestRef.current) furthestRef.current = v.currentTime;
        if (v.duration) onProgress(Math.min(100, (v.currentTime / v.duration) * 100));
      }}
      onSeeking={(e) => {
        const v = e.currentTarget;
        // Tolak lompatan maju; mundur dibiarkan.
        if (v.currentTime > furthestRef.current + 0.75) v.currentTime = furthestRef.current;
      }}
      onRateChange={(e) => {
        if (e.currentTarget.playbackRate !== 1) e.currentTarget.playbackRate = 1;
      }}
      onEnded={onEnded}
      onError={() => onFailed("berkas video tidak ditemukan (VIDEO_YOUTUBE belum terbaca?)")}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

// ---------------------------------------------------------------- YouTube

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlaybackRate(): number;
  setPlaybackRate(rate: number): void;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      videoId: string;
      host?: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      },
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

/** Kode galat IFrame API YouTube -> penjelasan singkat. */
function youTubeError(code: number): string {
  switch (code) {
    case 2:
      return "ID video YouTube tidak valid";
    case 5:
      return "galat pemutar HTML5 pada perangkat ini";
    case 100:
      return "video tidak ditemukan, dihapus, atau berstatus Private";
    case 101:
    case 150:
      return "pemilik video tidak mengizinkan penyematan (aktifkan Allow embedding di YouTube Studio)";
    default:
      return `kode galat YouTube ${code}`;
  }
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error("YouTube API tidak tersedia"));
      };
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      tag.onerror = () => {
        apiPromise = null;
        reject(new Error("Gagal memuat YouTube"));
      };
      document.head.appendChild(tag);
    });
  }
  return apiPromise;
}

function YouTubeMedia({
  videoId,
  onReady,
  onPlaying,
  onPaused,
  onProgress,
  onEnded,
  onFailed,
}: MediaEvents & { videoId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    let player: YTPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let playingNow = false;
    let furthest = 0;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        const mount = document.createElement("div");
        host.appendChild(mount);
        player = new YT.Player(mount, {
          videoId,
          host: "https://www.youtube-nocookie.com",
          playerVars: {
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            iv_load_policy: 3,
            cc_load_policy: 1, // caption bawaan video ditampilkan
          },
          events: {
            onReady: () => {
              if (!player) return;
              const p = player;
              onReady({ play: () => p.playVideo(), pause: () => p.pauseVideo() });
            },
            onStateChange: (e) => {
              if (e.data === YT_PLAYING) {
                playingNow = true;
                onPlaying();
              } else if (e.data === YT_PAUSED) {
                playingNow = false;
                onPaused();
              } else if (e.data === YT_ENDED) {
                playingNow = false;
                onPaused();
                onProgress(100);
                onEnded();
              }
            },
            onError: (e) => onFailed(youTubeError(e.data)),
          },
        });

        // YouTube tidak punya event "seek"; pantau posisi dan kembalikan bila melompat maju.
        timer = setInterval(() => {
          if (!player || !playingNow) return;
          const t = player.getCurrentTime();
          if (t > furthest + 2) {
            player.seekTo(furthest, true);
            return;
          }
          if (t > furthest) furthest = t;
          if (player.getPlaybackRate() !== 1) player.setPlaybackRate(1);
          const d = player.getDuration();
          if (d > 0) onProgress(Math.min(100, (t / d) * 100));
        }, 500);
      })
      .catch(() => onFailed("skrip YouTube tidak dapat dimuat (jaringan memblokir youtube.com?)"));

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      player?.destroy();
    };
  }, [videoId, onReady, onPlaying, onPaused, onProgress, onEnded, onFailed]);

  return <div ref={hostRef} className="aspect-video w-full [&>iframe]:h-full [&>iframe]:w-full" />;
}
