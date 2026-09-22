import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ConfirmProvider } from "@/components/ConfirmProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "KostaHub — Sistem Manajemen Peternakan",
  description: "Platform monitoring dan manajemen peternakan multi-farm berbasis web.",
};

// Warna bar browser di HP mengikuti latar krem aplikasi
export const viewport: Viewport = {
  themeColor: "#F2EDE0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" className={cn("antialiased", "font-sans", geist.variable)}>
      <body className="bg-[#F2EDE0] text-[#0D140F] min-h-screen" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
        <ConfirmProvider>
          <ToastProvider>
            {children}
            {/* Satu Toaster global untuk semua pemanggilan toast() dari sonner */}
            <Toaster theme="light" position="top-right" richColors />
          </ToastProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
