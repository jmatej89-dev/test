import { z } from "zod";

export const boxLoginSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Zadejte přístupový kód z krabice.")
    .max(64)
    .transform((v) => v.toUpperCase()),
  password: z.string().min(1, "Zadejte heslo z krabice.").max(200),
});

export const adminLoginSchema = z.object({
  email: z.email("Zadejte platný e-mail.").max(200),
  password: z.string().min(1, "Zadejte heslo.").max(200),
});

export const accusationSchema = z.object({
  suspectedPersonId: z.string().min(1, "Vyberte podezřelého."),
  reasoning: z.string().max(4000).optional(),
});

export const createBoxSchema = z.object({
  caseId: z.string().min(1),
  customerLabel: z.string().max(200).optional(),
});

export const createCaseSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Slug smí obsahovat jen malá písmena, čísla a pomlčky."),
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().trim().min(2).max(5000),
  difficulty: z.coerce.number().int().min(1).max(5).default(1),
});
