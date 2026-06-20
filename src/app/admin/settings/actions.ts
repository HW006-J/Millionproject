"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { validateNewTarget } from "@/lib/admin/target";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { prisma } from "@/lib/prisma";

export interface SettingsActionResult {
  error?: string;
}

const GENERIC_ERROR = "Something went wrong. Try again.";

/**
 * Pauses or resumes the campaign. Touches only Campaign.isActive — this is
 * the sole gate on creating *new* Checkout Sessions/mock submissions
 * (enforced in /api/checkout); it never affects confirming a payment Stripe
 * has already collected, or processing refunds.
 */
export async function toggleCampaignActiveAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  await requireAdmin();

  const nextActiveValue = formData.get("nextActive");
  if (nextActiveValue !== "true" && nextActiveValue !== "false") {
    return { error: GENERIC_ERROR };
  }

  try {
    await prisma.campaign.update({
      where: { slug: CAMPAIGN_SLUG },
      data: { isActive: nextActiveValue === "true" },
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/");

  return {};
}

/**
 * Updates only Campaign.targetAmountCents. Never touches confirmedAmountCents,
 * confirmedContributionCount, or any contribution/payment record.
 */
export async function updateCampaignTargetAction(
  _prevState: SettingsActionResult,
  formData: FormData,
): Promise<SettingsActionResult> {
  await requireAdmin();

  const targetInput = formData.get("targetDollars");
  if (typeof targetInput !== "string") {
    return { error: GENERIC_ERROR };
  }

  const campaign = await prisma.campaign.findUnique({ where: { slug: CAMPAIGN_SLUG } });
  if (!campaign) {
    return { error: GENERIC_ERROR };
  }

  const validation = validateNewTarget(targetInput, campaign.confirmedAmountCents);
  if (!validation.ok) {
    return { error: validation.error };
  }

  try {
    await prisma.campaign.update({
      where: { slug: CAMPAIGN_SLUG },
      data: { targetAmountCents: validation.targetCents },
    });
  } catch {
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/");

  return {};
}
