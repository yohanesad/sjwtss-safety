"use client";

import { useActionState } from "react";
import { Field, FormError, inputClass, secondaryButton } from "@/components/ui";
import { createUserAction, type FormState } from "../../actions";

export default function UserForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(createUserAction, {});
  return (
    <form action={action} className="grid gap-3 md:grid-cols-2" key={state.ok}>
      <div className="md:col-span-2">
        <FormError message={state.error} />
        {state.ok ? <p className="text-sm text-green-700">{state.ok}</p> : null}
      </div>
      <Field label="Nama"><input name="name" required className={inputClass} /></Field>
      <Field label="Email"><input name="email" type="email" required className={inputClass} /></Field>
      <Field label="Kata sandi awal" hint="Minimal 8 karakter.">
        <input name="password" type="password" minLength={8} required autoComplete="new-password" className={inputClass} />
      </Field>
      <Field label="Peran">
        <select name="role" defaultValue="SECURITY" className={inputClass}>
          <option value="SECURITY">Security (verifikasi pengunjung)</option>
          <option value="ADMIN">Admin (+ kelola soal & pengguna)</option>
        </select>
      </Field>
      <div>
        <button disabled={pending} className={secondaryButton}>{pending ? "Menyimpan…" : "Buat akun"}</button>
      </div>
    </form>
  );
}
