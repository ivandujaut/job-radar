import { IntegrationCard } from "@/components/integrations/integration-card";
import {
  INTEGRATION_CATEGORIES,
  type Integration,
  type SystemStatus,
} from "@/src/integrations.ts";
import { cn } from "@/lib/utils";

function StatusChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-zinc-400")} aria-hidden />
      {label}
    </span>
  );
}

export function IntegrationsView({
  integrations,
  system,
}: {
  integrations: Integration[];
  system: SystemStatus;
}) {
  const count = (s: Integration["status"]) => integrations.filter((i) => i.status === s).length;
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {plural(count("connected"), "conectada", "conectadas")} ·{" "}
        {plural(count("available"), "disponible", "disponibles")} · {count("soon")} en el roadmap
      </p>

      {INTEGRATION_CATEGORIES.map((category) => {
        const items = integrations
          .filter((i) => i.category === category)
          .sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
        if (items.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {items.map((integration) => (
                <IntegrationCard key={integration.key} integration={integration} />
              ))}
            </div>
          </section>
        );
      })}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
        <span className="font-medium">Estado del sistema</span>
        <StatusChip ok={system.auth} label="Autenticación" />
        <StatusChip ok={system.db} label="Base de datos" />
        <StatusChip ok={system.ai} label="IA" />
        <span className="text-muted-foreground/70">Se gestiona por el equipo, no por vos.</span>
      </div>
    </div>
  );
}
