import Stripe from "stripe";
import type { Express, Request, Response } from "express";

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", async (req: Request, res: Response) => {
    const secret = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !webhookSecret) return res.status(503).json({ error: "Stripe não configurado" });
    const stripe = new Stripe(secret);
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string") return res.status(400).json({ error: "Assinatura ausente" });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error) {
      return res.status(400).json({ error: `Webhook inválido: ${error instanceof Error ? error.message : "erro desconhecido"}` });
    }
    if (event.id.startsWith("evt_test_")) {
      console.log("[Stripe Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[Stripe Webhook] checkout.session.completed", event.id, session.client_reference_id);
    }
    if (event.type === "customer.subscription.deleted") {
      console.log("[Stripe Webhook] customer.subscription.deleted", event.id);
    }
    return res.json({ received: true });
  });
}
