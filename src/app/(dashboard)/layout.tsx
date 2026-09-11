import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await requireRole("admin");
    if (!session) redirect("/login");
    return (
        <div>
            Dashboard Layout
            {children}
        </div>
    );
}