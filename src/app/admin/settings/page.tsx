import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/admin/auth";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { formatCents } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { PauseToggleButton } from "./PauseToggleButton";
import { TargetEditForm } from "./TargetEditForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage() {
  // Authorization is checked here, independently of the Proxy and of any layout.
  const admin = await requireAdmin();

  const campaign = await prisma.campaign.findUnique({ where: { slug: CAMPAIGN_SLUG } });

  if (!campaign) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12 text-center">
        <p className="text-sm text-neutral-400">Campaign data is not available.</p>
      </main>
    );
  }

  const currentTargetDollars = (campaign.targetAmountCents / 100).toFixed(2);

  return (
    <main className="flex min-h-screen flex-col items-center gap-8 px-6 py-12">
      <AdminNav email={admin.email} />

      <div className="flex w-full max-w-2xl flex-col gap-10">
        <h1 className="text-xl font-bold text-white">Settings</h1>

        <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Campaign status
          </h2>
          <p className="text-sm text-neutral-400">
            Campaign is currently{" "}
            <span className="font-semibold text-white">
              {campaign.isActive ? "ACTIVE" : "PAUSED"}
            </span>
            . Pausing only blocks new checkout creation — any payment already
            in progress with Stripe will still be confirmed normally, and
            refunds keep working regardless.
          </p>
          <PauseToggleButton isActive={campaign.isActive} />
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-neutral-800 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
            Campaign target
          </h2>
          <p className="text-sm text-neutral-400">
            Currently {formatCents(campaign.targetAmountCents)}. Confirmed
            amount: {formatCents(campaign.confirmedAmountCents)}. The target
            cannot be set below the confirmed amount.
          </p>
          <TargetEditForm currentTargetDollars={currentTargetDollars} />
        </section>
      </div>
    </main>
  );
}
