import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guard";
import LoginForm from "./login-form";

export const metadata = { title: "Masuk · Security" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/admin");
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-1 text-xl font-bold">Panel Security</h1>
      <p className="mb-5 text-sm text-[var(--muted)]">Masuk untuk memverifikasi pengunjung.</p>
      <LoginForm />
    </main>
  );
}
