"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/** Submit button that asks for confirmation before destructive actions. */
export function ConfirmSubmit({
  message,
  children,
  ...props
}: ComponentProps<typeof Button> & { message: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
