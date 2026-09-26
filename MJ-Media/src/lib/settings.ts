import { getDb } from "./db";

export type Settings = {
  site_name: string;
  tagline: string;
  author_name: string;
  about: string;
  footer_note: string;
  contact_email: string;
  social_x: string;
  social_instagram: string;
  social_facebook: string;
};

const DEFAULTS: Settings = {
  site_name: "MJ media",
  tagline: "",
  author_name: "MJ",
  about: "",
  footer_note: "",
  contact_email: "",
  social_x: "",
  social_instagram: "",
  social_facebook: "",
};

export function getSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const out: Settings = { ...DEFAULTS };
  for (const r of rows) if (r.key in out) (out as Record<string, string>)[r.key] = r.value;
  return out;
}

export function saveSettings(patch: Partial<Settings>) {
  const db = getDb();
  const stmt = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
  const tx = db.transaction(() => {
    for (const [k, v] of Object.entries(patch)) if (k in DEFAULTS) stmt.run(k, v ?? "");
  });
  tx();
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
