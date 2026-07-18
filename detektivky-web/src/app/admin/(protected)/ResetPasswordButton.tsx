"use client";

import { useState, useTransition } from "react";
import { resetBoxPassword } from "@/app/actions/admin";

export function ResetPasswordButton({ boxId }: { boxId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  if (result) {
    return (
      <span className="font-mono text-xs text-accent">
        Nové heslo: {result}
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Vygenerovat nové heslo? Staré přestane platit.")) return;
        startTransition(async () => {
          const res = await resetBoxPassword(boxId);
          setResult("password" in res ? res.password : `Chyba: ${res.error}`);
        });
      }}
      className="text-xs text-ink-faint hover:text-white disabled:opacity-60"
    >
      {isPending ? "…" : "Reset hesla"}
    </button>
  );
}
