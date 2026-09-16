import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guard";
import PosHeader from "@/components/layouts/PosHeader";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireRole("admin", "cashier");

  if (!session) redirect("/login");

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <PosHeader
        name={session.user.name ?? undefined}
        role={session.user.role}
      />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}