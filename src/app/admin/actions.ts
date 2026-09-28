"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "@/lib/zod";
import {
  CHILD_SCHEMAS,
  CONTENT_STATUSES,
  fieldErrors,
  isChildTable,
  PathwayInput,
  VERIFIED_CHILD_TABLES,
  type ChildTable,
} from "@/lib/admin/schemas";
import { checkAdmin } from "@/lib/auth/session";
import { publicEnv } from "@/lib/env";

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

const DB_ERRORS: Record<string, string> = {
  "23505": "Já existe um item com esse identificador neste caminho.",
  "23514": "Os dados não passaram numa regra do banco (ex.: publicar exige data de verificação).",
  "23503": "Referência inválida (país ou caminho inexistente).",
  "42501": "Sem permissão para esta ação.",
};

function dbError(error: { code?: string; message: string }): ActionState {
  return { ok: false, message: DB_ERRORS[error.code ?? ""] ?? `Erro ao salvar: ${error.message}` };
}

/** Every action re-checks the role on the server; the layout guard is not enough. */
async function requireAdmin() {
  const session = await checkAdmin();
  if (session.status !== "admin") redirect("/admin/entrar");
  return session.supabase;
}

// Bound arguments come from the client too: validate them like any input.
const Id = z.string().uuid();
function validIds(...ids: Array<string | null>): boolean {
  return ids.every((id) => id === null || Id.safeParse(id).success);
}

function formObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$")) out[key] = value;
  }
  return out;
}

// ------------------------------------------------------------------ auth ---

const EmailInput = z.object({ email: z.string().trim().toLowerCase().email("E-mail inválido.") });

export async function sendAdminMagicLink(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = EmailInput.safeParse(formObject(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const session = await checkAdmin();
  const redirectTo = new URL("/auth/callback", publicEnv().NEXT_PUBLIC_SITE_URL);
  redirectTo.searchParams.set("next", "/admin");

  // shouldCreateUser: false. Admin sign-in never creates accounts. The reply is
  // the same whether or not the e-mail exists, to avoid account enumeration.
  await session.supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: redirectTo.toString() },
  });
  return {
    ok: true,
    message:
      "Se este e-mail tiver acesso, enviamos um link de entrada. Confira sua caixa de entrada.",
  };
}

export async function signOutAdmin() {
  const session = await checkAdmin();
  await session.supabase.auth.signOut();
  redirect("/admin/entrar");
}

// -------------------------------------------------------------- pathways ---

export async function savePathway(
  pathwayId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!validIds(pathwayId)) return { ok: false, message: "Identificador inválido." };
  const supabase = await requireAdmin();
  const parsed = PathwayInput.safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      errors: fieldErrors(parsed.error),
    };
  }

  if (pathwayId) {
    const { error } = await supabase.from("pathways").update(parsed.data).eq("id", pathwayId);
    if (error) return dbError(error);
    revalidatePath("/admin", "layout");
    return { ok: true, message: "Caminho salvo." };
  }

  const { data, error } = await supabase
    .from("pathways")
    .insert({ ...parsed.data, status: "draft" })
    .select("id")
    .single();
  if (error) return dbError(error);
  revalidatePath("/admin", "layout");
  redirect(`/admin/caminhos/${data.id}`);
}

const StatusInput = z.enum(CONTENT_STATUSES);

export async function setPathwayStatus(
  pathwayId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!validIds(pathwayId)) return { ok: false, message: "Identificador inválido." };
  const supabase = await requireAdmin();
  const status = StatusInput.safeParse(formData.get("status"));
  if (!status.success) return { ok: false, message: "Status inválido." };

  const { error } = await supabase
    .from("pathways")
    .update({ status: status.data })
    .eq("id", pathwayId);
  if (error) {
    return error.code === "23514"
      ? { ok: false, message: "Para publicar, marque o caminho como verificado primeiro." }
      : dbError(error);
  }
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Status atualizado." };
}

/** Stamps the pathway and its requirements/costs as verified now. */
export async function markVerifiedToday(pathwayId: string): Promise<ActionState> {
  if (!validIds(pathwayId)) return { ok: false, message: "Identificador inválido." };
  const supabase = await requireAdmin();
  const now = new Date().toISOString();
  const results = await Promise.all([
    supabase.from("pathways").update({ last_verified_at: now }).eq("id", pathwayId),
    supabase.from("requirements").update({ last_verified_at: now }).eq("pathway_id", pathwayId),
    supabase.from("cost_items").update({ last_verified_at: now }).eq("pathway_id", pathwayId),
  ]);
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbError(failed.error);
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Caminho, requisitos e custos marcados como verificados hoje." };
}

// ---------------------------------------------------------- child tables ---

// The typed client cannot narrow a union of table names, so child writes go
// through this minimal shape. Payloads are validated by CHILD_SCHEMAS above.
type LooseTable = {
  insert: (
    row: Record<string, unknown>,
  ) => PromiseLike<{ error: { code?: string; message: string } | null }>;
  update: (row: Record<string, unknown>) => {
    eq: (
      column: string,
      value: string,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{ error: { code?: string; message: string } | null }>;
    };
  };
  delete: () => {
    eq: (
      column: string,
      value: string,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{ error: { code?: string; message: string } | null }>;
    };
  };
};

export async function saveChild(
  table: ChildTable,
  pathwayId: string,
  rowId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isChildTable(table) || !validIds(pathwayId, rowId)) {
    return { ok: false, message: "Requisição inválida." };
  }
  const supabase = await requireAdmin();
  const parsed = CHILD_SCHEMAS[table].safeParse(formObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise os campos destacados.",
      errors: fieldErrors(parsed.error),
    };
  }

  const row: Record<string, unknown> = { ...parsed.data, pathway_id: pathwayId };
  // Editing a sourced item means it was just checked against the official page.
  if (VERIFIED_CHILD_TABLES.includes(table)) row.last_verified_at = new Date().toISOString();

  const target = supabase.from(table) as unknown as LooseTable;
  const { error } = rowId
    ? await target.update(row).eq("id", rowId).eq("pathway_id", pathwayId)
    : await target.insert(row);
  if (error) return dbError(error);

  revalidatePath(`/admin/caminhos/${pathwayId}`);
  return { ok: true, message: rowId ? "Item salvo." : "Item adicionado." };
}

export async function deleteChild(
  table: ChildTable,
  pathwayId: string,
  rowId: string,
): Promise<ActionState> {
  if (!isChildTable(table) || !validIds(pathwayId, rowId)) {
    return { ok: false, message: "Requisição inválida." };
  }
  const supabase = await requireAdmin();
  const target = supabase.from(table) as unknown as LooseTable;
  const { error } = await target.delete().eq("id", rowId).eq("pathway_id", pathwayId);
  if (error) return dbError(error);
  revalidatePath(`/admin/caminhos/${pathwayId}`);
  return { ok: true, message: "Item removido." };
}
