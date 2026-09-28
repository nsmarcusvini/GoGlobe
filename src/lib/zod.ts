import { z } from "zod";

// Default validation messages in Brazilian Portuguese (spec: errors in pt-BR).
// Import `z` from here instead of "zod" so the locale is always applied.
z.config(z.locales.ptBR());

export { z };
