import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/sidebar";
import { verifyAdminAuth } from "@/lib/auth";
import "@/app/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Tana Maaro - Admin Control",
    description: "Internal Dashboard",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const admin = await verifyAdminAuth();
    if (!admin) {
        redirect("/admin-login");
    }

    return (
        <div className={`${inter.className} min-h-screen bg-black text-white flex`}>
            <Sidebar adminName={admin.name} adminEmail={admin.email} />
            <main className="flex-1 p-8 ml-64 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
