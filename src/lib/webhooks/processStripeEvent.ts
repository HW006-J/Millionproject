import type Stripe from "stripe";
import { claimWebhookEvent, markWebhookEventFailed, markWebhookEventProcessed } from "./claimWebhookEvent";
import { handleChargeRefunded } from "./handleChargeRefunded";
import { handleCheckoutSessionCompleted } from "./handleCheckoutSessionCompleted";
import { handlePaymentIntentFailed } from "./handlePaymentIntentFailed";

export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const claim = await claimWebhookEvent("stripe", event.id, event.type);

  if (claim === "already_processed" || claim === "in_progress") {
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        break;
    }

    await markWebhookEventProcessed(event.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await markWebhookEventFailed(event.id, message);
    throw error;
  }
}
