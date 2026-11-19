import "server-only";
import type { PlanDef } from "./plans";

export interface CheckoutResult {
  status: "succeeded" | "redirect";
  providerRef: string;
  redirectUrl?: string;
}

/**
 * Payment provider abstraction. The demo provider records simulated payments so the
 * whole subscription flow is exercisable without credentials. A real provider (e.g.
 * Stripe Checkout + webhooks) implements the same interface; webhooks then call
 * `activateSubscription` on `checkout.session.completed` / `invoice.paid`.
 */
export interface PaymentProvider {
  id: string;
  label: string;
  live: boolean;
  checkout(input: { userId: string; email: string; plan: PlanDef; interval: "MONTH" | "YEAR" }): Promise<CheckoutResult>;
  cancel(providerRef: string | null): Promise<void>;
}

const demoProvider: PaymentProvider = {
  id: "demo",
  label: "Paiements de démonstration (aucun débit)",
  live: false,
  async checkout({ userId, plan, interval }) {
    return { status: "succeeded", providerRef: `demo_${plan.key.toLowerCase()}_${interval.toLowerCase()}_${userId.slice(-6)}_${Date.now()}` };
  },
  async cancel() {},
};

const stripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Stripe",
  live: true,
  async checkout() {
    // Integration point: create a Stripe Checkout Session with the plan's price id and
    // return { status: "redirect", redirectUrl: session.url }. Requires STRIPE_SECRET_KEY,
    // price ids per plan and a webhook endpoint at /api/billing/webhook.
    throw new Error("Stripe is not configured. Set PAYMENT_PROVIDER=demo or complete the Stripe integration.");
  },
  async cancel() {
    throw new Error("Stripe is not configured.");
  },
};

export function paymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "stripe" && process.env.STRIPE_SECRET_KEY ? stripeProvider : demoProvider;
}
