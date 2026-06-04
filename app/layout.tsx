import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "KostaHub — Sistem Manajemen Peternakan",
  description: "Platform monitoring dan manajemen peternakan multi-farm berbasis web.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={cn("antialiased", "font-sans", geist.variable)}>
      <body className="bg-[#F2EDE0] text-[#0D140F] min-h-screen" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
