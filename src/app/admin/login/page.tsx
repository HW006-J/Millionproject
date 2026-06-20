import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-white">Admin login</h1>
      <LoginForm />
    </main>
  );
}
