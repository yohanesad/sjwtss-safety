"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { completeVideoAction, startVideoAction } from "@/app/actions";
import { primaryButton, secondaryButton } from "@/components/ui";

function setTrackVisible(video: HTMLVideoElement | null, visible: boolean) {
  const track = video?.textTracks[0];
  if (track) track.mode = visible ? "showing" : "hidden";
}

/**
 * Pemutar tanpa kontrol bawaan: tidak ada seek, tidak ada percepatan, dan
 * video berhenti bila tab ditinggalkan. Pencegahan di browser ini hanya
 * lapis pertama — server tetap memeriksa lamanya waktu sejak video dimulai.
 */
export default function VideoPlayer({
  code,
  src,
  subtitleSrc,
}: {
  code: string;
  src: string;
  subtitleSrc: string;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const furthestRef = useRef(0);
  const startedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [captions, setCaptions] = useState(true);
  const [phase, setPhase] = useState<"watching" | "finishing" | "done">("watching");
  const [error, setError] = useState<string | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // Hentikan video bila pengunjung berpindah tab/aplikasi.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") videoRef.current?.pause();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  function toggleCaptions() {
    const next = !captions;
    setTrackVisible(videoRef.current, next);
    setCaptions(next);
  }

  async function togglePlay() {
    const v = videoRef.current;
    if (!v || phase !== "watching") return;
    if (v.paused) {
      try {
        await v.play();
      } catch {
        setError("Video tidak dapat diputar. Periksa sinyal lalu coba lagi.");
      }
    } else {
      v.pause();
    }
  }

  async function onEnded() {
    setPhase("finishing");
    const res = await completeVideoAction(code);
    if (res.ok) {
      setPhase("done");
    } else {
      setError(res.error ?? "Gagal menyimpan. Coba lagi.");
      setPhase("watching");
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video
          ref={videoRef}
          className="aspect-video w-full"
          playsInline
          preload="metadata"
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onPlay={() => {
            setPlaying(true);
            setError(null);
            if (!startedRef.current) {
              startedRef.current = true;
              void startVideoAction(code);
            }
          }}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (!v.seeking && v.currentTime > furthestRef.current) furthestRef.current = v.currentTime;
            if (v.duration) setProgress(Math.min(100, (v.currentTime / v.duration) * 100));
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
          onError={() => setLoadFailed(true)}
        >
          <source src={src} type="video/mp4" />
          <track kind="subtitles" srcLang="en" label="English" src={subtitleSrc} default />
        </video>
        {!playing && phase === "watching" && !loadFailed ? (
          <button
            type="button"
            onClick={togglePlay}
            aria-label="Putar video"
            className="absolute inset-0 flex items-center justify-center bg-black/40"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-3xl text-ink">
              ▶
            </span>
          </button>
        ) : null}
      </div>

      {loadFailed ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Video tidak dapat dimuat. Periksa sinyal Anda, muat ulang halaman, atau hubungi security.
        </p>
      ) : null}

      <div className="h-2 overflow-hidden rounded-full bg-neutral-200" aria-hidden>
        <div className="h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={togglePlay} disabled={phase !== "watching"} className={`${secondaryButton} flex-1`}>
          {playing ? "⏸ Jeda" : "▶ Putar"}
        </button>
        <button type="button" onClick={toggleCaptions} aria-pressed={captions} className={secondaryButton}>
          CC {captions ? "aktif" : "mati"}
        </button>
      </div>

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
