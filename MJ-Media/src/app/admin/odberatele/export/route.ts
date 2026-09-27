import { isAdmin } from "@/lib/auth";
import { listSubscribers } from "@/lib/newsletter";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const rows = listSubscribers().map((s) => `${s.email},${s.created_at}`);
  const csv = ["email,prihlaseno", ...rows].join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="odberatele-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
