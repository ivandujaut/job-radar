import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "job-radar",
  description: "Agentes de búsqueda laboral con revisión humana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const shell = (
    // suppressHydrationWarning is required by next-themes (it sets the theme
    // class on <html> on the client) and also silences attributes injected by
    // browser extensions (e.g. ColorZilla's cz-shortcut-listen) before hydration.
    <html lang="es" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );

  return <ClerkProvider>{shell}</ClerkProvider>;
}
