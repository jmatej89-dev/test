import fs from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { addMedia } from "@/lib/articles";
import { slugify } from "@/lib/slug";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Nepřihlášen." }, { status: 401 });
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Chybí soubor." }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "Nepodporovaný typ souboru. Povoleno: JPG, PNG, WebP, GIF, SVG, AVIF." }, { status: 415 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Soubor je větší než 12 MB." }, { status: 413 });

  const base = slugify(path.parse(file.name).name).slice(0, 40) || "obrazek";
  const filename = `${base}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "data", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
  addMedia({ filename, original_name: file.name, mime: file.type, size: file.size, alt: String(form.get("alt") ?? "") });
  return NextResponse.json({ url: `/uploads/${filename}`, filename });
}
