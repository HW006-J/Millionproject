import { NextResponse } from "next/server";
import { getStripeClient, getStripeConfig } from "@/lib/stripe";
import { processStripeEvent } from "@/lib/webhooks/processStripeEvent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = getStripeConfig();
  if (!config) {
    // Fail closed: never attempt signature verification with incomplete configuration.
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event;
  try {
    event = getStripeClient(config).webhooks.constructEvent(rawBody, signature, config.webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    await processStripeEvent(event);
  } catch {
    console.error("Stripe webhook processing failed for event:", event.id, event.type);
    return NextResponse.json({ error: "Processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
