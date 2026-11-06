"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { savePhotoAction } from "@/app/actions";
import { primaryButton, secondaryButton } from "@/components/ui";
import type { Content } from "@/lib/content";

const MAX_SIDE = 800;

/** Menggambar sumber ke kanvas yang dikecilkan lalu mengekspor JPEG (biasanya 60–200 KB). */
function toJpeg(source: CanvasImageSource, width: number, height: number): Promise<Blob> {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas tidak tersedia"));
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("gagal membuat JPEG"))), "image/jpeg", 0.8),
  );
}

function attachStream(video: HTMLVideoElement, stream: MediaStream) {
  video.srcObject = stream;
  void video.play().catch(() => {});
}

type Phase = "idle" | "live" | "preview" | "uploading";

/**
 * Ambil foto wajah: kamera langsung lewat getUserMedia (HTTPS), dengan cadangan
 * input file `capture` bila kamera ditolak atau tidak tersedia. Hasil selalu JPEG kecil.
 */
export default function PhotoCapture({ code, t }: { code: string; t: Content["v"] }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraFailed, setCameraFailed] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopStream, [stopStream]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (phase === "live" && videoRef.current && streamRef.current) {
      attachStream(videoRef.current, streamRef.current);
    }
  }, [phase]);

  function showPreview(b: Blob) {
    setBlob(b);
    setPreviewUrl(URL.createObjectURL(b));
    setPhase("preview");
  }

  async function openCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraFailed(true);
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setPhase("live");
    } catch {
      setCameraFailed(true);
    }
  }

  async function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    try {
      const b = await toJpeg(v, v.videoWidth, v.videoHeight);
      stopStream();
      showPreview(b);
    } catch {
      setError("Gagal mengambil foto. Coba lagi.");
    }
  }

  async function onPickFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const bmp = await createImageBitmap(file);
      showPreview(await toJpeg(bmp, bmp.width, bmp.height));
    } catch {
      setError("Foto tidak dapat dibaca. Coba ambil ulang.");
    }
  }

  function retake() {
    setBlob(null);
    setPreviewUrl(null);
    setError(null);
    setPhase("idle");
  }

  async function upload() {
    if (!blob) return;
    setPhase("uploading");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", new File([blob], "foto.jpg", { type: "image/jpeg" }));
      const res = await savePhotoAction(code, fd);
      if (res.error) {
        setError(res.error);
        setPhase("preview");
        return;
      }
      router.refresh();
    } catch {
      setError("Foto gagal dikirim. Periksa sinyal lalu coba lagi.");
      setPhase("preview");
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-2xl bg-neutral-900">
        {phase === "live" ? (
          <>
            <video ref={videoRef} playsInline muted autoPlay className="h-full w-full -scale-x-100 object-cover" />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-4/5 w-3/5 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-4 border-white/70"
            />
          </>
        ) : null}
        {phase === "preview" || phase === "uploading" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl ?? ""} alt="Foto Anda" className="h-full w-full object-cover" />
        ) : null}
        {phase === "idle" ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-5xl text-white/50" aria-hidden>
            📷
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {phase === "idle" ? (
        <>
          {cameraFailed ? (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {t.cameraDenied}
            </p>
          ) : null}
          <button type="button" onClick={openCamera} className={primaryButton}>
            {t.buttonOpenCamera}
          </button>
          {cameraFailed ? (
            <label className={`${secondaryButton} w-full cursor-pointer py-3 text-base`}>
              {t.buttonPickPhoto}
              <input
                id="photo-file"
                type="file"
                accept="image/*"
                capture="user"
                className="sr-only"
                onChange={(e) => void onPickFile(e.target.files?.[0])}
              />
            </label>
          ) : null}
        </>
      ) : null}

      {phase === "live" ? (
        <button type="button" onClick={capture} className={primaryButton}>
          {t.buttonCapture}
        </button>
      ) : null}

      {phase === "preview" || phase === "uploading" ? (
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={retake} disabled={phase === "uploading"} className={`${secondaryButton} py-3 text-base`}>
            {t.buttonRetake}
          </button>
          <button type="button" onClick={upload} disabled={phase === "uploading"} className={`${primaryButton} !px-3 !text-base`}>
            {phase === "uploading" ? t.buttonUploading : t.buttonUsePhoto}
          </button>
        </div>
      ) : null}
    </div>
  );
}
