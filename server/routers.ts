import { z } from "zod";
import Stripe from "stripe";
import { planCatalog, planFromId } from "../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  catalog: router({
    plans: publicProcedure.query(() => planCatalog),
    product: publicProcedure.query(() => ({
      name: "snyx.store.api",
      eyebrow: "AUTOMAÇÕES QUE FICAM NO FLUXO",
      description: "A extensão que conecta seu workspace, seu código e seus copilotos em uma única camada operacional.",
      version: "v3.1",
      stats: [
        { label: "tarefas resolvidas", value: "12.8k" },
        { label: "tempo economizado", value: "41h" },
        { label: "workspaces ativos", value: "2.4k" },
      ],
    })),
  }),
  billing: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({ planId: z.enum(["pro", "studio"]) }))
      .mutation(async ({ ctx, input }) => {
        const plan = planFromId(input.planId);
        if (!stripe) throw new Error("Configure o Stripe em Settings → Payment para ativar o checkout.");
        const priceId = input.planId === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_STUDIO;
        if (!priceId) throw new Error(`O preço do plano ${plan.name} ainda não foi configurado.`);
        const origin = ctx.req.headers.origin || "http://localhost:3000";
        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          customer_email: ctx.user.email || undefined,
          client_reference_id: String(ctx.user.id),
          allow_promotion_codes: true,
          metadata: { user_id: String(ctx.user.id), customer_email: ctx.user.email || "", customer_name: ctx.user.name || "", plan_id: input.planId },
          success_url: `${origin}/app?checkout=success`,
          cancel_url: `${origin}/?checkout=cancelled#plans`,
        });
        return { url: session.url };
      }),
  }),
  dashboard: router({
    summary: adminProcedure.query(() => ({
      totals: [
        { label: "MRR estimado", value: "R$ 18.420", change: "+12,4%", tone: "coral" },
        { label: "Licenças ativas", value: "1.284", change: "+8,2%", tone: "lime" },
        { label: "Em teste", value: "186", change: "+21,6%", tone: "amber" },
        { label: "Churn mensal", value: "2,8%", change: "−0,6%", tone: "blue" },
      ],
      activity: [
        { name: "Marina Costa", email: "marina@atelier.co", plan: "Pro mensal", status: "Ativa", key: "SNYX-7K4-M9Q.API", time: "há 8 min" },
        { name: "Rafael Nunes", email: "rafael@orbita.dev", plan: "Studio anual", status: "Ativa", key: "SNYX-4B2-PQ8.API", time: "há 31 min" },
        { name: "Ana Beatriz", email: "ana@northlab.io", plan: "Free trial", status: "Em teste", key: "SNYX-9H1-K2M.API", time: "há 1 h" },
        { name: "João Victor", email: "joao@fluxo.app", plan: "Pro mensal", status: "Pausada", key: "SNYX-3N7-T6R.API", time: "há 2 h" },
      ],
      chart: [42, 48, 45, 58, 64, 61, 72, 69, 78, 74, 88, 94],
    })),
  }),
});

export type AppRouter = typeof appRouter;
