"use client";

import { useActionState } from "react";
import { sendMagicLink } from "@/app/(auth)/actions";
import type { ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { authCopy } from "@/content/auth";

export function SignInForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(sendMagicLink, {
    ok: false,
  });

  if (state.ok) {
    return (
      <div
        role="status"
        className="grid gap-4 rounded-md border-l-2 border-route bg-surface-sunk p-6"
      >
        <p className="type-eyebrow text-green-ink">{authCopy.sentEyebrow}</p>
        <p className="text-lg font-semibold">{state.message}</p>
        <p className="text-ink-muted">{authCopy.sentBody}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="next" value={next} />
      <Field
        name="email"
        type="email"
        label={authCopy.emailLabel}
        autoComplete="email"
        inputMode="email"
        required
        error={state.errors?.email}
      />
      <Button type="submit" size="lg" arrow disabled={pending}>
        {pending ? authCopy.sending : authCopy.submit}
      </Button>
      {state.message && !state.ok && (
        <p role="alert" className="text-[0.9375rem] font-medium text-(--status-fails)">
          {state.message}
        </p>
      )}
    </form>
  );
}
