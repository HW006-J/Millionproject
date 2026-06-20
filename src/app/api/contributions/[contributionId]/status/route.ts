import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * The minimal possible response for the processing page to poll: just the
 * payment status. Never includes the contributor's name, amount, or any
 * other contribution data.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ contributionId: string }> },
) {
  const { contributionId } = await params;

  const contribution = await prisma.contribution.findUnique({
    where: { id: contributionId },
    select: { paymentStatus: true },
  });

  if (!contribution) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ status: contribution.paymentStatus });
}
