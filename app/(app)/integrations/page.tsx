import { redirect } from "next/navigation";
import { IntegrationsView } from "@/components/integrations/integrations-view";
import { getIntegrations, getSystemStatus } from "@/src/integrations.ts";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  const settings = await loadSettings(session.userId);

  const integrations = getIntegrations(settings.disabledSources);
  const system = getSystemStatus();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Integraciones</h1>
        <p className="text-sm text-muted-foreground">
          Conectá job-radar con tus fuentes de vacantes, tu perfil de LinkedIn y tu propia IA. Pausá
          las que no quieras usar en las búsquedas; el resto sigue funcionando.
        </p>
      </header>

      <IntegrationsView integrations={integrations} system={system} />
    </main>
  );
}
