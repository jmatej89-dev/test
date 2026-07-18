import { getAuthorizedAdmin } from "@/lib/dal";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAuthorizedAdmin();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AdminNav adminName={admin.name} adminRole={admin.role} />
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
