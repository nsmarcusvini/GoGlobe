"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/app/admin/actions";
import { ANSWER_SCHEMAS, answerInput, isQuestionId } from "@/lib/app/answers";
import { fieldErrors } from "@/lib/admin/schemas";
import { getSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "@/lib/zod";

const Id = z.string().uuid();

async function currentUser() {
  const { supabase, user } = await getSession();
  if (!user) redirect("/entrar?next=/app/painel");
  return { supabase, user };
}

// -------------------------------------------------------------- onboarding --

export async function saveAnswer(
  questionId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isQuestionId(questionId)) return { ok: false, message: "Pergunta inválida." };
  const { supabase, user } = await currentUser();
  const parsed = ANSWER_SCHEMAS[questionId].safeParse(answerInput(questionId, formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { error } = await supabase.from("profiles").update(parsed.data).eq("user_id", user.id);
  if (error) return { ok: false, message: "Não foi possível salvar. Tente de novo." };
  return { ok: true };
}

export async function completeOnboarding() {
  const { supabase, user } = await currentUser();
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("user_id", user.id);
  revalidatePath("/app", "layout");
  redirect("/app/resultados");
}

// ------------------------------------------------------------------- plans --

/** Starts following a pathway: creates the plan and its checklist from steps + documents. */
export async function followPathway(pathwayId: string): Promise<void> {
  if (!Id.safeParse(pathwayId).success) redirect("/app/resultados?erro=caminho");
  const { supabase, user } = await currentUser();

  const existing = await supabase
    .from("user_plans")
    .select("id")
    .eq("pathway_id", pathwayId)
    .maybeSingle();
  if (existing.data) redirect(`/app/planos/${existing.data.id}`);

  // RLS: only published pathways are visible, so users can't follow drafts.
  const { data: pathway } = await supabase
    .from("pathways")
    .select(
      "id, version, steps:pathway_steps(id, step_order, title_pt), documents(id, name_pt, sort_order)",
    )
    .eq("id", pathwayId)
    .eq("status", "published")
    .maybeSingle();
  if (!pathway) redirect("/app/resultados?erro=caminho");

  const { data: plan, error } = await supabase
    .from("user_plans")
    .insert({ user_id: user.id, pathway_id: pathway.id, pathway_version: pathway.version })
    .select("id")
    .single();
  if (error || !plan) redirect("/app/resultados?erro=acompanhar");

  const steps = [...(pathway.steps ?? [])].sort((a, b) => a.step_order - b.step_order);
  const documents = [...(pathway.documents ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const items = [
    ...steps.map((s, i) => ({
      user_plan_id: plan.id,
      source_type: "step" as const,
      source_id: s.id,
      title: s.title_pt,
      sort_order: i,
    })),
    ...documents.map((d, i) => ({
      user_plan_id: plan.id,
      source_type: "document" as const,
      source_id: d.id,
      title: d.name_pt,
      sort_order: 1000 + i,
    })),
  ];
  if (items.length) await supabase.from("checklist_items").insert(items);

  revalidatePath("/app", "layout");
  redirect(`/app/planos/${plan.id}`);
}

export async function toggleItem(
  itemId: string,
  planId: string,
  done: boolean,
): Promise<ActionState> {
  if (!Id.safeParse(itemId).success || !Id.safeParse(planId).success) {
    return { ok: false, message: "Item inválido." };
  }
  const { supabase } = await currentUser();
  const { error } = await supabase
    .from("checklist_items")
    .update({ is_done: done })
    .eq("id", itemId)
    .eq("user_plan_id", planId);
  if (error) return { ok: false, message: "Não foi possível atualizar o item." };
  revalidatePath(`/app/planos/${planId}`);
  revalidatePath("/app/painel");
  return { ok: true };
}

const NotesInput = z.object({ notes: z.string().max(5000, "Use até 5.000 caracteres.") });

export async function saveItemNotes(
  itemId: string,
  planId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!Id.safeParse(itemId).success || !Id.safeParse(planId).success) {
    return { ok: false, message: "Item inválido." };
  }
  const parsed = NotesInput.safeParse({ notes: formData.get("notes") ?? "" });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { supabase } = await currentUser();
  const notes = parsed.data.notes.trim() || null;
  const { error } = await supabase
    .from("checklist_items")
    .update({ notes })
    .eq("id", itemId)
    .eq("user_plan_id", planId);
  if (error) return { ok: false, message: "Não foi possível salvar a nota." };
  revalidatePath(`/app/planos/${planId}`);
  return { ok: true, message: "Nota salva." };
}

const StatusInput = z.enum(["exploring", "preparing", "applied", "paused", "done"]);

export async function setPlanStatus(
  planId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!Id.safeParse(planId).success) return { ok: false, message: "Plano inválido." };
  const status = StatusInput.safeParse(formData.get("status"));
  if (!status.success) return { ok: false, message: "Status inválido." };
  const { supabase } = await currentUser();
  const { error } = await supabase
    .from("user_plans")
    .update({ status: status.data })
    .eq("id", planId);
  if (error) return { ok: false, message: "Não foi possível atualizar o status." };
  revalidatePath(`/app/planos/${planId}`);
  revalidatePath("/app/painel");
  return { ok: true, message: "Status atualizado." };
}

export async function unfollowPathway(planId: string) {
  if (!Id.safeParse(planId).success) return;
  const { supabase } = await currentUser();
  await supabase.from("user_plans").delete().eq("id", planId);
  revalidatePath("/app", "layout");
  redirect("/app/painel");
}

// ----------------------------------------------------------------- account --

export async function signOut() {
  const { supabase } = await getSession();
  await supabase.auth.signOut();
  redirect("/");
}

const DeleteInput = z.object({
  confirm: z.literal("EXCLUIR", { error: "Digite EXCLUIR para confirmar." }),
});

/** LGPD: deletes the auth user; profile, plans, checklist and subscription cascade. */
export async function deleteAccount(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = DeleteInput.safeParse({ confirm: String(formData.get("confirm") ?? "").trim() });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const { supabase, user } = await currentUser();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, message: "Não foi possível excluir a conta. Tente de novo." };

  await supabase.auth.signOut();
  redirect("/?conta=excluida");
}
