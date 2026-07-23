import { redirect } from "next/navigation";
import { InboxIcon, CheckmarkCircle02Icon, SentIcon, CancelCircleIcon } from "@hugeicons/core-free-icons";
import { StatCard } from "@/components/dashboard/stat-card";
import { QueueList } from "@/components/queue/queue-list";
import { RunEngineButton } from "@/components/dashboard/run-engine-button";
import { toggleAutoApply } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";
import { loadQueue } from "@/src/store.ts";
import type { QueueItem, QueueStatus } from "@/src/types.ts";

export const dynamic = "force-dynamic";

const TABS = ["review", "applications", "connections", "history"] as const;
type Tab = (typeof TABS)[number];

const TAB_META: Record<Tab, { title: string; empty: string; count: (n: number) => string }> = {
  review: {
    title: "Revisión",
    empty: "No hay nada esperando revisión.",
    count: (n) => (n === 1 ? "1 vacante esperando tu decisión" : `${n} vacantes esperando tu decisión`),
  },
  applications: {
    title: "Aplicaciones",
    empty: "Todavía no hay vacantes rankeadas.",
    count: (n) => (n === 1 ? "1 vacante rankeada por match" : `${n} vacantes rankeadas por match`),
  },
  connections: {
    title: "Conexiones",
    empty: "Todavía no hay conexiones descubiertas. Corré el people finder desde la CLI para poblarlas.",
    count: (n) => (n === 1 ? "1 contacto sugerido" : `${n} contactos sugeridos`),
  },
  history: {
    title: "Historial",
    empty: "Sin decisiones todavía.",
    count: (n) => (n === 1 ? "1 decisión tomada" : `${n} decisiones tomadas`),
  },
};

function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3 py-4">
        <p className="text-sm text-muted-foreground">{message}</p>
        {action}
      </CardContent>
    </Card>
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

  const lists: Record<Tab, QueueItem[]> = { review, applications, connections, history };
  const active = lists[activeTab];
  const meta = TAB_META[activeTab];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{meta.title}</h1>
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
        <StatCard label="En revisión" value={review.length} icon={InboxIcon} accent="blue" />
        <StatCard label="Aprobados" value={byStatus("approved").length} icon={CheckmarkCircle02Icon} accent="green" />
        <StatCard label="Enviados" value={byStatus("sent").length} icon={SentIcon} accent="violet" />
        <StatCard label="Descartados" value={byStatus("discarded").length} icon={CancelCircleIcon} accent="zinc" />
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-medium text-foreground">{meta.count(active.length)}</h2>
          {(activeTab === "review" || activeTab === "applications") && active.length > 0 && (
            <p className="text-xs text-muted-foreground">
              El match va de 0 a 100: qué tan bien encaja tu perfil con la vacante. Verde: encaje
              fuerte (70+). Ámbar: medio (55+).
            </p>
          )}
        </div>

        {active.length === 0 ? (
          <EmptyState
            message={meta.empty}
            action={
              activeTab === "review" ? (
                <RunEngineButton label="Buscar vacantes ahora" />
              ) : activeTab === "applications" ? (
                <RunEngineButton />
              ) : undefined
            }
          />
        ) : (
          <QueueList
            items={active}
            readonly={activeTab === "history" ? true : undefined}
            showStatus={activeTab !== "review"}
          />
        )}
      </section>
    </main>
  );
}
