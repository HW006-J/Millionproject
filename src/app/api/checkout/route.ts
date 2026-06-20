import { NextResponse } from "next/server";
import { CAMPAIGN_SLUG } from "@/lib/campaign";
import { isValidCustomAmountCents } from "@/lib/money";
import { getCheckoutProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { validatePublicName } from "@/lib/publicName";

export const dynamic = "force-dynamic";

interface CheckoutRequestBody {
  amountCents?: unknown;
  isAnonymous?: unknown;
  customName?: unknown;
  hideAmountPublicly?: unknown;
  submissionToken?: unknown;
}

function isValidAmountCents(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isInteger(value) && isValidCustomAmountCents(value)
  );
}

export async function POST(request: Request) {
  // Checked first: never create a database row if no provider is safely available
  // (covers mock mode being disallowed and Stripe mode being misconfigured).
  const provider = getCheckoutProvider();
  if (!provider) {
    return NextResponse.json({ error: "Checkout is not available." }, { status: 503 });
  }

  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidAmountCents(body.amountCents)) {
    return NextResponse.json({ error: "Enter a valid contribution amount." }, { status: 400 });
  }

  const isAnonymous = body.isAnonymous !== false;
  const nameValidation = validatePublicName({
    isAnonymous,
    customName: typeof body.customName === "string" ? body.customName : undefined,
  });

  if (!nameValidation.ok) {
    return NextResponse.json({ error: nameValidation.error }, { status: 400 });
  }

  const hideAmountPublicly = body.hideAmountPublicly === true;
  const submissionToken =
    typeof body.submissionToken === "string" && body.submissionToken.length > 0
      ? body.submissionToken
      : null;

  const campaign = await prisma.campaign.findUnique({
    where: { slug: CAMPAIGN_SLUG },
  });

  if (!campaign || !campaign.isActive) {
    return NextResponse.json({ error: "Campaign is not available." }, { status: 503 });
  }

  const result = await provider.createCheckout({
    campaignId: campaign.id,
    amountCents: body.amountCents,
    isAnonymous: nameValidation.value.isAnonymous,
    publicName: nameValidation.value.publicName,
    hideAmountPublicly,
    submissionToken,
  });

  return NextResponse.json(result);
}
