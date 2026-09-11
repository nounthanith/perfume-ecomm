import { redirect } from "next/navigation";
import { requireRole } from "@/lib/guard";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const session = await requireRole("admin");
    if (!session) redirect("/login");
    return (
        <div>
            <div>
                {["dashboard", "product-management", "category-management"].map((item) => (
                    <a className="hover:bg-foreground/20 px-2" key={item} href={`/${item}`}>
                        {item}
                    </a>
                ))}
            </div>
            <main className="px-2">
                {children}
            </main>
        </div>
    );
}