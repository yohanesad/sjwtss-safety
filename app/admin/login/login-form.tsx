"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Card, Field, FormError, inputClass, primaryButton } from "@/components/ui";
import { loginAction, type FormState } from "../actions";

export default function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <Card>
      <form action={action} className="space-y-4">
        <FormError message={state.error} />
        <Field label="Email">
          <input name="email" type="email" autoComplete="username" required className={inputClass} />
        </Field>
        <Field label="Kata sandi">
          <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </Field>
        <Submit />
      </form>
    </Card>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={primaryButton}>
      {pending ? "Memproses…" : "Masuk"}
    </button>
  );
}
