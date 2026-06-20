export interface CheckoutInput {
  campaignId: string;
  amountCents: number;
  isAnonymous: boolean;
  publicName: string | null;
  hideAmountPublicly: boolean;
}

export interface CheckoutResult {
  contributionId: string;
  redirectUrl: string;
}

export interface CheckoutProvider {
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
}
