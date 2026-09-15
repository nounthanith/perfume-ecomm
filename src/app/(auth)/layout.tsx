import ClientLayout from "@/components/layouts/ClientLayout";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="!min-h-[80vh]">
            <ClientLayout />
            <div className="[&>*]:!h-auto [&>*]:!min-h-[100vh] sm:[&>*]:!min-h-[80vh] lg:[&>*]:!min-h-[60vh]">
                {children}
            </div>

        </div>
    )
}