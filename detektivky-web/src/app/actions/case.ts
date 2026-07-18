"use server";

import { getAuthorizedBox } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { accusationSchema } from "@/lib/validation";
import { logAudit } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export type AccusationFormState =
  | { error: string }
  | { result: { isCorrect: boolean; culpritName: string | null } }
  | undefined;

export async function submitAccusation(
  _prevState: AccusationFormState,
  formData: FormData,
): Promise<AccusationFormState> {
  const box = await getAuthorizedBox();

  const parsed = accusationSchema.safeParse({
    suspectedPersonId: formData.get("suspectedPersonId"),
    reasoning: formData.get("reasoning"),
  });
  if (!parsed.success) {
    return { error: "Vyberte prosím podezřelého, kterého chcete obvinit." };
  }

  const suspect = await prisma.person.findFirst({
    where: { id: parsed.data.suspectedPersonId, caseId: box.caseId },
  });
  if (!suspect) {
    return { error: "Neplatný výběr podezřelého." };
  }

  const isCorrect = suspect.isCulprit;

  await prisma.accusation.create({
    data: {
      boxId: box.id,
      suspectedPersonId: suspect.id,
      reasoning: parsed.data.reasoning,
      isCorrect,
    },
  });
  await logAudit("box", box.id, "accusation_submitted", {
    suspectedPersonId: suspect.id,
    isCorrect,
  });

  revalidatePath("/portal/reseni");

  return {
    result: {
      isCorrect,
      culpritName: isCorrect ? suspect.name : null,
    },
  };
}
