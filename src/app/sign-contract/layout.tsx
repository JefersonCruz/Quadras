
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "../globals.css"; // Assuming globals.css is in src/app
import { Toaster } from "@/components/ui/toaster";
// Note: No AuthProvider here by default for a public-facing page,
// authentication for signing will be handled by the page component itself if needed.

const geistSans = GeistSans;
const geistMono = GeistMono;

export const metadata: Metadata = {
  title: "Assinatura de Contrato - ANODE Lite",
  description: "Página para assinatura de contratos digitais.",
};

export default function SignContractLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans bg-background text-foreground`}
      >
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  );
}
