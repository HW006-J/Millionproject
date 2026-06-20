import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

export type ClaimResult = "claimed" | "already_processed" | "in_progress";

function isUniqueConstraintViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/**
 * Atomically claims a webhook event for processing, using the database's
 * unique constraint on providerEventId as the sole source of exclusivity —
 * never a read-then-write race.
 *
 * - First delivery: the `create` either succeeds (we're the only claimant)
 *   or fails with a unique violation (someone else's row already exists).
 * - Retry of a previously-failed delivery: an atomic conditional `updateMany`
 *   only succeeds for one caller even if two retries arrive concurrently,
 *   because Postgres serializes concurrent UPDATEs on the same row and
 *   re-evaluates the WHERE clause against the just-committed state.
 * - Already fully processed: always skipped.
 */
export async function claimWebhookEvent(
  provider: string,
  providerEventId: string,
  eventType: string,
): Promise<ClaimResult> {
  try {
    await prisma.webhookEvent.create({
      data: { provider, providerEventId, eventType, processed: false, claimedAt: new Date() },
    });
    return "claimed";
  } catch (error) {
    if (!isUniqueConstraintViolation(error)) {
      throw error;
    }
  }

  const staleBefore = new Date(Date.now() - CLAIM_TIMEOUT_MS);
  const reclaim = await prisma.webhookEvent.updateMany({
    where: {
      providerEventId,
      processed: false,
      OR: [{ claimedAt: null }, { claimedAt: { lt: staleBefore } }],
    },
    data: { claimedAt: new Date() },
  });

  if (reclaim.count === 1) {
    return "claimed";
  }

  const existing = await prisma.webhookEvent.findUnique({ where: { providerEventId } });
  return existing?.processed ? "already_processed" : "in_progress";
}

export async function markWebhookEventProcessed(providerEventId: string): Promise<void> {
  await prisma.webhookEvent.update({
    where: { providerEventId },
    data: { processed: true, processedAt: new Date() },
  });
}

export async function markWebhookEventFailed(
  providerEventId: string,
  failureReason: string,
): Promise<void> {
  await prisma.webhookEvent.update({
    where: { providerEventId },
    data: { failureReason: failureReason.slice(0, 500) },
  });
}
