import { IntegrationsView } from "@/components/integrations/integrations-view";
import { getIntegrations } from "@/src/integrations.ts";

export const dynamic = "force-dynamic";

export default function IntegrationsPage() {
  const integrations = getIntegrations();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Integraciones</h1>
        <p className="text-sm text-muted-foreground">
          Conectá job-radar con fuentes de vacantes, LinkedIn y tus proveedores. El estado refleja lo
          que ya está configurado en tu instancia.
        </p>
      </header>

      <IntegrationsView integrations={integrations} />
    </main>
  );
}
