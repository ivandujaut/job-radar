import { IntegrationCard } from "@/components/integrations/integration-card";
import { INTEGRATION_CATEGORIES, type Integration } from "@/src/integrations.ts";

export function IntegrationsView({ integrations }: { integrations: Integration[] }) {
  const count = (s: Integration["status"]) => integrations.filter((i) => i.status === s).length;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        {count("connected")} conectadas · {count("available")} disponibles · {count("soon")} en el roadmap
      </p>

      {INTEGRATION_CATEGORIES.map((category) => {
        const items = integrations.filter((i) => i.category === category);
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
    </div>
  );
}
