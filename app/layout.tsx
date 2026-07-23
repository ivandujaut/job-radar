import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "job-radar",
  description: "Agentes de búsqueda laboral con revisión humana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    <html lang="es" className={cn("dark", "font-sans", geist.variable)}>
      {/* Browser extensions (e.g. ColorZilla) inject attributes like
          cz-shortcut-listen on <body> before React hydrates, causing a
          hydration mismatch. suppressHydrationWarning silences it for this
          node only. */}
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );

  return <ClerkProvider>{shell}</ClerkProvider>;
}
