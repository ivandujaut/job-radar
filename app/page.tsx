import { ApplicationCard } from "@/components/queue/application-card";
import { ConnectionCard } from "@/components/queue/connection-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadQueue } from "@/src/store.ts";
import type { QueueItem, QueueStatus } from "@/src/types.ts";

export const dynamic = "force-dynamic";

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

export default function Page() {
  const items = loadQueue();
  const byStatus = (s: QueueStatus) => items.filter((i) => i.status === s);
  const review = byStatus("pending_review");
  const applications = items
    .filter((i) => i.kind === "application" && i.ranking)
    .sort((a, b) => (b.ranking?.score ?? 0) - (a.ranking?.score ?? 0));
  const connections = items.filter((i) => i.kind === "connection");
  const history = items.filter((i) =>
    ["approved", "rejected", "sent"].includes(i.status)
  );

  return (
    <main className="mx-auto max-w-4xl space-y-8 p-6 md:p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">job-radar</h1>
        <p className="text-sm text-muted-foreground">
          Los agentes buscan y redactan. Nada se envía sin tu aprobación.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="En revisión" value={review.length} />
        <StatCard label="Aprobados" value={byStatus("approved").length} />
        <StatCard label="Enviados" value={byStatus("sent").length} />
        <StatCard label="Descartados" value={byStatus("discarded").length} />
      </section>

      <Tabs defaultValue="review">
        <TabsList>
          <TabsTrigger value="review">
            Revisión
            {review.length > 0 && (
              <Badge variant="secondary" className="ml-1.5">
                {review.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="applications">Aplicaciones</TabsTrigger>
          <TabsTrigger value="connections">Conexiones</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="mt-4 space-y-4">
          {review.length === 0 ? (
            <EmptyState message="No hay nada esperando revisión. Corré un scan o el people finder para alimentar la cola." />
          ) : (
            review.map((i) => <ItemCard key={i.id} item={i} />)
          )}
        </TabsContent>

        <TabsContent value="applications" className="mt-4 space-y-4">
          {applications.length === 0 ? (
            <EmptyState message="Todavía no hay vacantes rankeadas." />
          ) : (
            applications.map((i) => (
              <div key={i.id} className="space-y-1">
                <Badge variant="outline">{STATUS_LABELS[i.status]}</Badge>
                <ApplicationCard item={i} readonly={i.status !== "pending_review"} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-4 space-y-4">
          {connections.length === 0 ? (
            <EmptyState message="Todavía no hay conexiones descubiertas." />
          ) : (
            connections.map((i) => (
              <div key={i.id} className="space-y-1">
                <Badge variant="outline">{STATUS_LABELS[i.status]}</Badge>
                <ConnectionCard item={i} readonly={i.status !== "pending_review"} />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {history.length === 0 ? (
            <EmptyState message="Sin decisiones todavía." />
          ) : (
            history.map((i) => (
              <div key={i.id} className="space-y-1">
                <Badge variant="outline">{STATUS_LABELS[i.status]}</Badge>
                <ItemCard item={i} readonly />
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
