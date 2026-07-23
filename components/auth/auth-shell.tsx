import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { RadarIcon } from "@hugeicons/core-free-icons";

/**
 * Two-column auth shell. Left: brand top-left, form vertically centered. Right:
 * headline + a preview of the product that bleeds off the right and bottom
 * edges (top-left corner framed, the rest clipped by overflow-hidden).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="relative flex w-full flex-col p-8 lg:w-[46%]">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={RadarIcon} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">job-radar</span>
        </Link>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-muted/30 lg:block lg:flex-1">
        <div className="p-12 pb-0">
          <h2 className="max-w-md text-3xl font-semibold tracking-tight">
            Tus agentes buscan y aplican. Vos solo aprobás.
          </h2>
          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            job-radar escanea vacantes, las rankea contra tu CV y prepara cada aplicación y nota de
            conexión. Nada se envía sin tu visto bueno.
          </p>
        </div>
        <Image
          src="/dashboard-preview.png"
          alt="Vista del dashboard de job-radar"
          width={1400}
          height={1000}
          priority
          className="absolute left-12 top-56 w-[1100px] max-w-none rounded-tl-2xl border-l border-t border-border shadow-2xl"
        />
      </div>
    </div>
  );
}
