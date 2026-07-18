import "server-only";

/**
 * Never select Person.isCulprit for anything that reaches the customer
 * portal — it's the answer to the case and must stay server-side, checked
 * only inside the accusation Server Action.
 */
export const PERSON_PUBLIC_SELECT = {
  id: true,
  name: true,
  role: true,
  occupation: true,
  bio: true,
  photoUrl: true,
  address: true,
  relationship: true,
  alibi: true,
  statement: true,
} as const;
