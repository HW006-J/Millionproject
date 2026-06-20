import { Prisma, PaymentProvider, PaymentStatus, type Contribution } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { CheckoutInput } from "./types";

function isUniqueConstraintViolation(error: unknown, target: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    (error.meta.target as string[]).includes(target)
  );
}

/**
 * Creates a pending Contribution, but is safe against duplicate checkout
 * submissions: if a Contribution already exists for the given
 * submissionToken (created moments ago by a double-click or a retried
 * request), that row is reused instead of creating a second one. The
 * uniqueness is enforced by the database itself (Contribution.submissionToken
 * is a unique column), so two concurrent requests with the same token can
 * never both succeed in creating separate rows.
 */
export async function findOrCreatePendingContribution(
  input: CheckoutInput & { paymentProvider: PaymentProvider },
): Promise<Contribution> {
  if (input.submissionToken) {
    const existing = await prisma.contribution.findUnique({
      where: { submissionToken: input.submissionToken },
    });
    if (existing) {
      return existing;
    }
  }

  try {
    return await prisma.contribution.create({
      data: {
        campaignId: input.campaignId,
        amountCents: input.amountCents,
        currency: "usd",
        paymentProvider: input.paymentProvider,
        paymentStatus: PaymentStatus.PENDING,
        isAnonymous: input.isAnonymous,
        publicName: input.publicName,
        hideAmountPublicly: input.hideAmountPublicly,
        submissionToken: input.submissionToken,
      },
    });
  } catch (error) {
    if (input.submissionToken && isUniqueConstraintViolation(error, "submissionToken")) {
      // Lost a race: another concurrent request just created it first.
      const existing = await prisma.contribution.findUnique({
        where: { submissionToken: input.submissionToken },
      });
      if (existing) {
        return existing;
      }
    }
    throw error;
  }
}

/** Where to send the visitor when a duplicate submission found a contribution that's no longer pending. */
export function resolveNonPendingRedirect(contribution: Pick<Contribution, "id" | "paymentStatus">): string {
  if (
    contribution.paymentStatus === PaymentStatus.CONFIRMED ||
    contribution.paymentStatus === PaymentStatus.REFUNDED
  ) {
    return `/success/${contribution.id}`;
  }
  return "/";
}
