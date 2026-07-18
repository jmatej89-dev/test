"use client";

import { useMemo, useState } from "react";

type PublicPerson = {
  id: string;
  name: string;
  role: string;
  occupation: string | null;
  bio: string;
  photoUrl: string | null;
  address: string | null;
  relationship: string | null;
  alibi: string | null;
  statement: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  VICTIM: "Oběť",
  SUSPECT: "Podezřelý",
  WITNESS: "Svědek",
  OTHER: "Osoba",
};

export function PersonSearch({ persons }: { persons: PublicPerson[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter((p) =>
      [p.name, p.occupation, p.bio, p.address, p.relationship, p.alibi, p.statement]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q)),
    );
  }, [persons, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hledat jméno, povolání, adresu, alibi…"
        className="w-full rounded border border-line bg-navy-900 px-3 py-2 text-white placeholder:text-ink-faint focus:border-accent focus:outline-none"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((person) => (
          <div
            key={person.id}
            className="rounded-lg border border-line bg-navy-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{person.name}</span>
              <span className="rounded bg-navy-800 px-2 py-0.5 text-xs text-ink-muted">
                {ROLE_LABEL[person.role] ?? person.role}
              </span>
            </div>
            {person.occupation && (
              <p className="mt-1 text-sm text-ink-faint">
                {person.occupation}
              </p>
            )}
            <p className="mt-2 text-sm text-white/85">{person.bio}</p>
            <dl className="mt-3 space-y-1 border-t border-line-soft pt-3 text-xs">
              {person.relationship && (
                <div>
                  <dt className="inline text-ink-faint">Vztah: </dt>
                  <dd className="inline text-ink-muted">{person.relationship}</dd>
                </div>
              )}
              {person.address && (
                <div>
                  <dt className="inline text-ink-faint">Adresa: </dt>
                  <dd className="inline text-ink-muted">{person.address}</dd>
                </div>
              )}
              {person.alibi && (
                <div>
                  <dt className="inline text-ink-faint">Alibi: </dt>
                  <dd className="inline text-ink-muted">{person.alibi}</dd>
                </div>
              )}
              {person.statement && (
                <div>
                  <dt className="text-ink-faint">Výpověď:</dt>
                  <dd className="mt-0.5 text-ink-muted italic">
                    „{person.statement}“
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-ink-faint">Nic nenalezeno.</p>
        )}
      </div>
    </div>
  );
}
