import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { PathwayInput } from "@/lib/eligibility";

// Content queries shared by public (anon, ISR) pages and the logged-in app.
// RLS decides visibility: anon and users only ever get published content.

type Client = SupabaseClient<Database>;
type Tables = Database["public"]["Tables"];

export type Country = Pick<
  Tables["countries"]["Row"],
  "id" | "code" | "name_pt" | "currency" | "official_site_url"
>;
export type Requirement = Pick<
  Tables["requirements"]["Row"],
  | "id"
  | "key"
  | "label_pt"
  | "description_pt"
  | "rule"
  | "is_hard"
  | "source_url"
  | "last_verified_at"
  | "sort_order"
>;
export type Step = Tables["pathway_steps"]["Row"];
export type Document = Tables["documents"]["Row"];
export type Cost = Tables["cost_items"]["Row"];

export type PathwayListItem = Pick<
  Tables["pathways"]["Row"],
  | "id"
  | "slug"
  | "official_name"
  | "name_pt"
  | "category"
  | "summary_pt"
  | "typical_duration_text"
  | "leads_to_residence"
  | "official_url"
  | "last_verified_at"
  | "version"
> & { country: Country; requirements: Requirement[] };

export type PathwayDetail = PathwayListItem &
  Pick<Tables["pathways"]["Row"], "points_calculator_url"> & {
    steps: Step[];
    documents: Document[];
    costs: Cost[];
  };

export type ExchangeRate = Tables["exchange_rates"]["Row"];

const COUNTRY_COLS = "id, code, name_pt, currency, official_site_url";
const REQ_COLS =
  "id, key, label_pt, description_pt, rule, is_hard, source_url, last_verified_at, sort_order";
const LIST_COLS = `id, slug, official_name, name_pt, category, summary_pt, typical_duration_text, leads_to_residence, official_url, last_verified_at, version, country:countries!inner(${COUNTRY_COLS}), requirements(${REQ_COLS})`;

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

export async function listCountries(db: Client): Promise<Country[]> {
  const { data, error } = await db.from("countries").select(COUNTRY_COLS).eq("is_active", true);
  if (error) throw new Error(error.message);
  const order = ["AU", "NZ", "CA"];
  return (data ?? []).sort((a, b) => order.indexOf(a.code) - order.indexOf(b.code));
}

export async function listPathways(
  db: Client,
  filter: { countryCode?: string } = {},
): Promise<PathwayListItem[]> {
  let query = db.from("pathways").select(LIST_COLS).eq("status", "published");
  if (filter.countryCode) query = query.eq("country.code", filter.countryCode.toUpperCase());
  const { data, error } = await query.order("name_pt");
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    ...p,
    country: p.country as unknown as Country,
    requirements: [...(p.requirements ?? [])].sort(bySort),
  }));
}

async function detail(
  db: Client,
  where: { slug: string; countryCode?: string },
): Promise<PathwayDetail | null> {
  let query = db
    .from("pathways")
    .select(
      `${LIST_COLS}, points_calculator_url, steps:pathway_steps(*), documents(*), costs:cost_items(*)`,
    )
    .eq("status", "published")
    .eq("slug", where.slug);
  if (where.countryCode) query = query.eq("country.code", where.countryCode.toUpperCase());
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    ...data,
    country: data.country as unknown as Country,
    requirements: [...(data.requirements ?? [])].sort(bySort),
    steps: [...(data.steps ?? [])].sort((a, b) => a.step_order - b.step_order),
    documents: [...(data.documents ?? [])].sort(bySort),
    costs: [...(data.costs ?? [])].sort(bySort),
  };
}

export function getPathwayDetail(db: Client, countryCode: string, slug: string) {
  return detail(db, { slug, countryCode });
}

/** Slugs are unique per country; the app route uses the slug alone. */
export function getPathwayDetailBySlug(db: Client, slug: string) {
  return detail(db, { slug });
}

export async function getExchangeRates(db: Client): Promise<Map<string, ExchangeRate>> {
  const { data, error } = await db.from("exchange_rates").select("*");
  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((rate) => [rate.currency, rate]));
}

/** Maps content rows to the eligibility engine's input. */
export function toEngineInput(pathway: PathwayListItem): PathwayInput {
  return {
    id: pathway.id,
    slug: pathway.slug,
    name: pathway.name_pt,
    countryCode: pathway.country.code,
    requirements: pathway.requirements.map((r) => ({
      id: r.id,
      key: r.key,
      label: r.label_pt,
      isHard: r.is_hard,
      rule: r.rule,
    })),
  };
}

/** URL helpers: country codes are lowercase in URLs. */
export const pathwayHref = (p: { slug: string; country: { code: string } }) =>
  `/caminhos/${p.country.code.toLowerCase()}/${p.slug}`;
export const appPathwayHref = (p: { slug: string }) => `/app/caminhos/${p.slug}`;
export const countryHref = (code: string) => `/paises/${code.toLowerCase()}`;
