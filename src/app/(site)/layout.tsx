import ClientLayout from "@/components/layouts/ClientLayout";
import Footer from "@/components/layouts/Footer";

export default function ClientLayoutWapper({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <ClientLayout />
            {children}
            <Footer />
        </div>
    );
}