"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export interface SetNameHiddenResult {
  error?: string;
}

const GENERIC_ERROR = "Something went wrong. Try again.";

/**
 * Hides or restores a contribution's public display name. Touches only
 * publicNameHidden — never amount, payment status, provider IDs,
 * confirmation time, or refund amount.
 */
export async function setContributionNameHiddenAction(
  _prevState: SetNameHiddenResult,
  formData: FormData,
): Promise<SetNameHiddenResult> {
  // Server-side authorization, independent of Proxy or any layout.
  await requireAdmin();

  const contributionId = formData.get("contributionId");
  const hiddenValue = formData.get("hidden");

  if (typeof contributionId !== "string" || contributionId.length === 0) {
    return { error: GENERIC_ERROR };
  }

  if (hiddenValue !== "true" && hiddenValue !== "false") {
    return { error: GENERIC_ERROR };
  }

  const hidden = hiddenValue === "true";

  try {
    const result = await prisma.contribution.updateMany({
      where: { id: contributionId },
      data: { publicNameHidden: hidden },
    });

    if (result.count === 0) {
      return { error: GENERIC_ERROR };
    }
  } catch {
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/admin/contributions");
  revalidatePath("/admin");
  revalidatePath("/");

  return {};
}
