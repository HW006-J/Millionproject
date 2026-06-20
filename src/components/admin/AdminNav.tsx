import Link from "next/link";
import { logoutAction } from "@/app/admin/actions";

interface AdminNavProps {
  email: string;
}

export function AdminNav({ email }: AdminNavProps) {
  return (
    <nav className="flex w-full max-w-4xl flex-col gap-3 border-b border-neutral-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-4 text-sm">
        <Link href="/admin" className="text-white hover:underline">
          Dashboard
        </Link>
        <Link href="/admin/contributions" className="text-white hover:underline">
          Contributions
        </Link>
        <Link href="/admin/settings" className="text-white hover:underline">
          Settings
        </Link>
      </div>
      <div className="flex items-center gap-4 text-sm text-neutral-400">
        <span>{email}</span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-full border border-neutral-700 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:border-white"
          >
            Log out
          </button>
        </form>
      </div>
    </nav>
  );
}
