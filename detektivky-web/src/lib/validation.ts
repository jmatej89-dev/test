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

export const updateCaseSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  description: z.string().trim().min(2).max(5000),
  difficulty: z.coerce.number().int().min(1).max(5).default(1),
});

const personRole = z.enum(["VICTIM", "SUSPECT", "WITNESS", "OTHER"]);

export const personSchema = z.object({
  caseId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  role: personRole,
  occupation: z.string().max(200).optional(),
  bio: z.string().trim().min(1).max(3000),
  photoUrl: z.string().trim().max(500).optional(),
  address: z.string().max(300).optional(),
  relationship: z.string().max(300).optional(),
  alibi: z.string().max(2000).optional(),
  statement: z.string().max(3000).optional(),
  isCulprit: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const updatePersonSchema = personSchema.extend({
  personId: z.string().min(1),
});

const documentType = z.enum(["PHOTO", "PDF", "NOTE"]);

export const documentSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  type: documentType,
  url: z.string().trim().max(500).optional(),
  content: z.string().max(5000).optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateDocumentSchema = documentSchema.extend({
  documentId: z.string().min(1),
});

export const wiretapSchema = z.object({
  caseId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  audioUrl: z.string().trim().min(1).max(500),
  transcript: z.string().max(8000).optional(),
  participants: z.string().max(300).optional(),
  dateLabel: z.string().max(100).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateWiretapSchema = wiretapSchema.extend({
  wiretapId: z.string().min(1),
});

export const emailSchema = z.object({
  caseId: z.string().min(1),
  fromPersonId: z.string().optional(),
  toPersonId: z.string().optional(),
  subject: z.string().trim().min(1).max(300),
  body: z.string().trim().min(1).max(8000),
  dateLabel: z.string().max(100).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateEmailSchema = emailSchema.extend({
  emailId: z.string().min(1),
});

export const timelineEventSchema = z.object({
  caseId: z.string().min(1),
  timeLabel: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  locationLabel: z.string().max(200).optional(),
  involvedLabel: z.string().max(300).optional(),
  sortOrder: z.coerce.number().int().default(0),
});

export const updateTimelineEventSchema = timelineEventSchema.extend({
  timelineEventId: z.string().min(1),
});
