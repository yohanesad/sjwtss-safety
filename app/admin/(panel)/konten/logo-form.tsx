"use client";

import { useActionState } from "react";
import { FormError, secondaryButton } from "@/components/ui";
import { uploadLogoAction, type ContentState } from "../../actions";

export default function LogoForm() {
  const [state, action, pending] = useActionState<ContentState, FormData>(uploadLogoAction, {});
  return (
    <form action={action} className="space-y-2">
      <input
        id="logo-file"
        name="logo"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-[var(--border)] file:bg-white file:px-3 file:py-2"
      />
      {state.group === "logo" ? <FormError message={state.error} /> : null}
      {state.group === "logo" && state.ok ? <p className="text-sm font-medium text-green-700">{state.ok}</p> : null}
      <button disabled={pending} className={secondaryButton}>
        {pending ? "Mengunggah…" : "Ganti logo"}
      </button>
    </form>
  );
}
