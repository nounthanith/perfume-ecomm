import ClientLayout from "@/components/layouts/ClientLayout";
import Footer from "@/components/layouts/Footer";
import SplashScreen from "@/components/shared/SplashScreen";

export default function ClientLayoutWapper({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <SplashScreen />
            <ClientLayout />
            {children}
            <Footer />
        </div>
    );
}