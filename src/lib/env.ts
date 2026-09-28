import { z } from "@/lib/zod";

// Public variables must be referenced statically (process.env.NEXT_PUBLIC_X) so
// Next.js can inline them into the client bundle.
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

const booleanFlag = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_6MONTHS: z.string().optional(),
  PAYMENTS_ENABLED: booleanFlag,
  AI_ENABLED: booleanFlag,
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().optional(),
  AI_MONTHLY_MESSAGE_QUOTA: z.coerce.number().int().positive().optional(),
});

export type PublicEnv = z.infer<typeof publicSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function readEmpty(value: string | undefined) {
  return value === "" ? undefined : value;
}

let publicCache: PublicEnv | undefined;
let serverCache: ServerEnv | undefined;

/** Validated public env. Safe to call on server and client. */
export function publicEnv(): PublicEnv {
  publicCache ??= publicSchema.parse({
    NEXT_PUBLIC_SITE_URL: readEmpty(process.env.NEXT_PUBLIC_SITE_URL),
    NEXT_PUBLIC_SUPABASE_URL: readEmpty(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readEmpty(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: readEmpty(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    NEXT_PUBLIC_POSTHOG_KEY: readEmpty(process.env.NEXT_PUBLIC_POSTHOG_KEY),
  });
  return publicCache;
}

/** Validated server-only env. Import only from server code (see lib/env.server.ts). */
export function readServerEnv(): ServerEnv {
  serverCache ??= serverSchema.parse(
    Object.fromEntries(
      Object.keys(serverSchema.shape).map((key) => [key, readEmpty(process.env[key])]),
    ),
  );
  return serverCache;
}

/** True when Supabase public config is present (lets CI build without a database). */
export function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
