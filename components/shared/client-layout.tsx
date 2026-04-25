"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AccountDeletionGate } from "@/components/auth/account-deletion-gate";

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAdminRoute = pathname?.startsWith("/admin");
    const hideFooter = pathname?.startsWith("/profile");

    return (
        <AuthProvider>
            {!isAdminRoute && <Navbar />}
            <main className="flex-1 flex flex-col">
                {children}
            </main>
            {!isAdminRoute && <AccountDeletionGate />}
            {!isAdminRoute && !hideFooter && <Footer />}
        </AuthProvider>
    );
}
