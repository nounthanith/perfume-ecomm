import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guard";
import Sidebar from "@/components/layouts/Sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await requireRole("admin");

    if (!session) redirect("/login");

    const user = {
        ...session.user,
        name: session.user.name ?? undefined,
        email: session.user.email ?? undefined,
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground">
            {/* Sidebar Navigation Component */}
            <Sidebar user={user} />

            {/* Main Content Area */}
            <main className="pt-14 transition-all lg:pl-64 lg:pt-0">
                <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}