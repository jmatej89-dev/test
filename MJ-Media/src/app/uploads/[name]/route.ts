import fs from "node:fs/promises";
import path from "node:path";

const MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif",
};

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!/^[a-z0-9._-]+$/i.test(name) || name.includes("..")) return new Response("Not found", { status: 404 });
  const file = path.join(process.cwd(), "data", "uploads", name);
  try {
    const buf = await fs.readFile(file);
    const ext = path.extname(name).slice(1).toLowerCase();
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
