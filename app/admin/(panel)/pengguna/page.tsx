import { Card } from "@/components/ui";
import { requireAdminPage } from "@/lib/auth/guard";
import { prisma } from "@/lib/db";
import { toggleUserAction } from "../../actions";
import UserForm from "./user-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pengguna · Panel Security" };

export default async function UsersPage() {
  const me = await requireAdminPage();
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Pengguna</h1>
      <Card>
        <h2 className="mb-3 font-bold">Tambah akun</h2>
        <UserForm />
      </Card>
      <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{u.name} {u.active ? "" : "(nonaktif)"}</span>
              <span className="block text-sm text-[var(--muted)]">{u.email} · {u.role === "ADMIN" ? "Admin" : "Security"}</span>
            </span>
            {u.id !== me.id ? (
              <form action={toggleUserAction.bind(null, u.id)}>
                <button className="text-sm underline">{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
