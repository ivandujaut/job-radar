import { redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { logoutAction } from "@/app/auth-actions";
import { ApplicationCard } from "@/components/queue/application-card";
import { ConnectionCard } from "@/components/queue/connection-card";
import { Sidebar } from "@/components/sidebar/sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getSession } from "@/src/auth.ts";
import { loadSettings, onboardingComplete } from "@/src/settings.ts";
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

function EmptyState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{message}</p>
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

function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        title="Salir"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <HugeiconsIcon icon={Logout01Icon} size={20} strokeWidth={1.8} aria-hidden />
        <span>Salir</span>
      </button>
    </form>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = loadSettings(session.userId);
  if (!onboardingComplete(settings)) redirect("/onboarding");
  const { autonomy } = settings;

  const { tab } = await searchParams;
  const activeTab: Tab = TABS.includes(tab as Tab) ? (tab as Tab) : "review";

  const items = loadQueue();
  const byStatus = (s: QueueStatus) => items.filter((i) => i.status === s);
  const review = byStatus("pending_review");
  const applications = items
    .filter((i) => i.kind === "application" && i.ranking)
    .sort((a, b) => (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0));
  const connections = items.filter((i) => i.kind === "connection");
  const history = items.filter((i) => ["approved", "rejected", "sent"].includes(i.status));

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onSignOut={<SignOutButton />} />

      <main className="mx-auto w-full max-w-4xl space-y-8 p-6 md:p-10">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{TAB_TITLES[activeTab]}</h1>
          <p className="text-sm text-muted-foreground">
            {autonomy.autoApplyEnabled
              ? `Auto-apply activo en ATS con match ≥ ${autonomy.autoApplyThreshold}. Las notas de conexión siempre pasan por vos.`
              : "Auto-apply en pausa. Todo espera tu revisión."}
          </p>
          {settings.lastRun && (
            <p className="text-xs text-muted-foreground">
              Última corrida del motor: {new Date(settings.lastRun.at).toLocaleString("es-AR")} ·{" "}
              {settings.lastRun.autoApplied} aplicadas
              {settings.lastRun.live ? "" : " (dry-run)"}, {settings.lastRun.queued} a revisión,{" "}
              {settings.lastRun.discarded} descartadas
            </p>
          )}
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
              <EmptyState message="No hay nada esperando revisión. Corré un scan o el people finder para alimentar la cola." />
            ) : (
              review.map((i) => <ItemCard key={i.id} item={i} />)
            ))}

          {activeTab === "applications" &&
            (applications.length === 0 ? (
              <EmptyState message="Todavía no hay vacantes rankeadas." />
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
              <EmptyState message="Todavía no hay conexiones descubiertas." />
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
    </div>
  );
}
