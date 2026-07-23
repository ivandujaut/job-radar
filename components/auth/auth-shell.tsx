import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { RadarIcon } from "@hugeicons/core-free-icons";

/**
 * Two-column auth shell. Left (1/4): brand pinned top-left, form centered on
 * both axes. Right (3/4): headline + a product preview that bleeds off the
 * right and bottom edges (top-left corner framed, the rest clipped).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-7">
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-6 lg:col-span-2">
        <Link href="/" className="absolute left-6 top-6 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={RadarIcon} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">job-radar</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted/30 lg:col-span-5 lg:block">
        <div className="p-12 pb-0">
          <h2 className="max-w-md text-3xl font-semibold tracking-tight">
            Tus agentes buscan y aplican. Vos solo aprobás.
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            job-radar escanea vacantes, las rankea contra tu CV y prepara cada aplicación y nota de
            conexión. Nada se envía sin tu visto bueno.
          </p>
        </div>
        {/* Notebook-style device frame: thick dark bezel on the top and left,
            rounded top-left corner; the device bleeds off the right and bottom
            edges (clipped by the panel's overflow-hidden). In dark mode the
            frame reads via a light hairline outlining the silhouette, not the
            fill color. */}
        <div className="absolute left-24 top-72 -right-[14%] overflow-hidden rounded-tl-[2rem] border-l-[14px] border-t-[14px] border-neutral-800 bg-neutral-900 shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/15">
          <Image
            src="/dashboard-preview.png"
            alt="Vista del dashboard de job-radar"
            width={1400}
            height={1000}
            priority
            className="block w-full max-w-none rounded-tl-xl ring-1 ring-white/5"
          />
        </div>
      </div>
    </div>
  );
}
