"use server";

import { PaymentProvider } from "@prisma/client";
import { redirect } from "next/navigation";
import { confirmContribution } from "@/lib/confirmContribution";
import { isMockModeAllowed } from "@/lib/payments";

export async function confirmMockContribution(formData: FormData) {
  if (!isMockModeAllowed()) {
    redirect("/");
  }

  const contributionId = formData.get("contributionId");
  if (typeof contributionId !== "string" || contributionId.length === 0) {
    redirect("/");
  }

  const result = await confirmContribution(contributionId, PaymentProvider.MOCK);

  if (result.status === "confirmed" || result.status === "already_confirmed") {
    redirect(`/success/${result.contributionId}`);
  }

  redirect("/");
}
