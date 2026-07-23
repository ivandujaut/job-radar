import { redirect } from "next/navigation";
import { ApplicationCard } from "@/components/queue/application-card";
import { ConnectionCard } from "@/components/queue/connection-card";
import { RunEngineButton } from "@/components/dashboard/run-engine-button";
import { toggleAutoApply } from "@/app/(app)/settings/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";
import { loadQueue } from "@/src/store.ts";
import type { QueueItem, QueueStatus } from "@/src/types.ts";

export const dynamic = "force-dynamic";

const TABS = ["review", "applications", "connections", "history"] as const;
type Tab = (typeof TABS)[number];

const TAB_TITLES: Record<Tab, string> = {
  review: "Revisión",
  applications: "Aplicaciones",
  connections: "Conexiones",
  history: "Historial",
};

const STATUS_LABELS: Record<QueueStatus, string> = {
  pending_rank: "sin rankear",
  pending_review: "en revisión",
  approved: "aprobado",
  rejected: "rechazado",
  sent: "enviado",
  discarded: "descartado",
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="font-mono text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 pt-6">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
  );
}

function ItemCard({ item, readonly }: { item: QueueItem; readonly?: boolean }) {
  return item.kind === "connection" ? (
    <ConnectionCard item={item} readonly={readonly} />
  ) : (
    <ApplicationCard item={item} readonly={readonly} />
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const settings = await loadSettings(session.userId);
  const { autonomy } = settings;

  const { tab } = await searchParams;
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "review";

  const items = await loadQueue();
  const byStatus = (s: QueueStatus) => items.filter((i) => i.status === s);
  const review = byStatus("pending_review");
  const applications = items
    .filter((i) => i.kind === "application" && i.ranking)
    .sort((a, b) => (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0));
  const connections = items.filter((i) => i.kind === "connection");
  const history = items.filter((i) => ["approved", "rejected", "sent"].includes(i.status));

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-10">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{TAB_TITLES[activeTab]}</h1>
          <p className="text-sm text-muted-foreground">
            {autonomy.autoApplyEnabled
              ? `Auto-apply activo en ATS con match ≥ ${autonomy.autoApplyThreshold}. Las notas de conexión siempre pasan por vos.`
              : "Auto-apply en pausa. Todo espera tu revisión."}
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

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="En revisión" value={review.length} />
        <StatCard label="Aprobados" value={byStatus("approved").length} />
        <StatCard label="Enviados" value={byStatus("sent").length} />
        <StatCard label="Descartados" value={byStatus("discarded").length} />
      </section>

      <section className="space-y-4">
        {activeTab === "review" &&
          (review.length === 0 ? (
            <EmptyState
              message="No hay nada esperando revisión."
              action={<RunEngineButton label="Buscar vacantes ahora" />}
            />
          ) : (
            review.map((i) => <ItemCard key={i.id} item={i} />)
          ))}

        {activeTab === "applications" &&
          (applications.length === 0 ? (
            <EmptyState message="Todavía no hay vacantes rankeadas." action={<RunEngineButton />} />
          ) : (
            applications.map((i) => (
              <div key={i.id} className="space-y-1">
                <Badge variant="outline">{STATUS_LABELS[i.status]}</Badge>
                <ApplicationCard item={i} readonly={i.status !== "pending_review"} />
              </div>
            ))
          ))}

        {activeTab === "connections" &&
          (connections.length === 0 ? (
            <EmptyState message="Todavía no hay conexiones descubiertas. Corré el people finder desde la CLI para poblarlas." />
          ) : (
            connections.map((i) => (
              <div key={i.id} className="space-y-1">
                <Badge variant="outline">{STATUS_LABELS[i.status]}</Badge>
                <ConnectionCard item={i} readonly={i.status !== "pending_review"} />
              </div>
            ))
          ))}

        {activeTab === "history" &&
          (history.length === 0 ? (
            <EmptyState message="Sin decisiones todavía." />
          ) : (
            history.map((i) => (
              <div key={i.id} className="space-y-1">
                <Badge variant="outline">{STATUS_LABELS[i.status]}</Badge>
                <ItemCard item={i} readonly />
              </div>
            ))
          ))}
      </section>
    </main>
  );
}
