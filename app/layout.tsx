import type { Metadata } from "next";
import { Epilogue, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ClientLayout } from "@/components/shared/client-layout";
import { cn } from "@/lib/utils";

const epilogue = Epilogue({
  subsets: ["latin"],
  variable: "--font-epilogue",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Tanamaaro | Roast Without Fear",
  description: "India's raw roasting platform for colleges, chaos & creators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("dark", epilogue.variable, manrope.variable)}>
      <body className="bg-black text-white antialiased flex flex-col min-h-screen font-manrope">
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
