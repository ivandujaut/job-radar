import { redirect } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard/overview";
import { RunEngineButton } from "@/components/dashboard/run-engine-button";
import { toggleAutoApply } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";
import { loadQueue } from "@/src/store.ts";
import { computeMetrics } from "@/src/metrics.ts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const settings = await loadSettings(session.userId);
  const { autonomy } = settings;

  const items = await loadQueue();
  const metrics = computeMetrics(items, {
    autoApplyThreshold: autonomy.autoApplyThreshold,
    reviewFloor: autonomy.reviewFloor,
  });

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Vista general de tu búsqueda: pipeline, calidad de match y actividad reciente.
          </p>
          {settings.lastRun && (
            <p className="text-xs text-muted-foreground">
              Última corrida: {new Date(settings.lastRun.at).toLocaleString("es-AR")} ·{" "}
              {settings.lastRun.autoApplied} aplicadas
              {settings.lastRun.live ? "" : " (dry-run)"}, {settings.lastRun.queued} a revisión,{" "}
              {settings.lastRun.discarded} descartadas
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <form action={toggleAutoApply}>
            <Button variant="outline" size="sm" type="submit">
              {autonomy.autoApplyEnabled ? "Pausar auto-apply" : "Reanudar auto-apply"}
            </Button>
          </form>
          <RunEngineButton />
        </div>
      </header>

      <DashboardOverview metrics={metrics} />
    </main>
  );
}
