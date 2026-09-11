import ClientLayout from "@/components/layouts/ClientLayout";

export default function ClientLayoutWapper({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <ClientLayout />
            {children}
        </div>
    );
}