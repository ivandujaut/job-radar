import Image from "next/image";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { RadarIcon } from "@hugeicons/core-free-icons";

/**
 * Two-column auth shell: the sign-in / sign-up form on the left, a live preview
 * of the product on the right (hidden on small screens).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      <div className="flex w-full flex-col items-center justify-center gap-8 p-6 lg:w-[520px]">
        <Link href="/" className="flex items-center gap-2 self-start">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <HugeiconsIcon icon={RadarIcon} size={18} strokeWidth={1.8} aria-hidden />
          </span>
          <span className="text-lg font-semibold tracking-tight">job-radar</span>
        </Link>
        <div className="flex w-full flex-1 flex-col items-center justify-center">{children}</div>
      </div>

      <div className="relative hidden flex-1 flex-col overflow-hidden border-l border-border bg-muted/30 pl-16 pt-16 lg:flex">
        <h2 className="max-w-md text-3xl font-semibold tracking-tight">
          Tus agentes buscan y aplican. Vos solo aprobás.
        </h2>
        <p className="mt-3 max-w-md text-sm text-muted-foreground">
          job-radar escanea vacantes, las rankea contra tu CV y prepara cada aplicación y nota de
          conexión. Nada se envía sin tu visto bueno.
        </p>
        <Image
          src="/dashboard-preview.png"
          alt="Vista del dashboard de job-radar"
          width={1400}
          height={1000}
          priority
          className="mt-12 w-[1100px] max-w-none rounded-tl-xl border-l border-t border-border shadow-2xl"
        />
      </div>
    </div>
  );
}
