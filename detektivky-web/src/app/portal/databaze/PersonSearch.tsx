"use client";

import { useMemo, useState } from "react";

type PublicPerson = {
  id: string;
  name: string;
  role: string;
  occupation: string | null;
  bio: string;
  photoUrl: string | null;
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
    return persons.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q) ||
        p.bio.toLowerCase().includes(q),
    );
  }, [persons, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Hledat jméno, povolání…"
        className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100 placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {filtered.map((person) => (
          <div
            key={person.id}
            className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{person.name}</span>
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400">
                {ROLE_LABEL[person.role] ?? person.role}
              </span>
            </div>
            {person.occupation && (
              <p className="mt-1 text-sm text-neutral-500">
                {person.occupation}
              </p>
            )}
            <p className="mt-2 text-sm text-neutral-300">{person.bio}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-neutral-500">Nic nenalezeno.</p>
        )}
      </div>
    </div>
  );
}
