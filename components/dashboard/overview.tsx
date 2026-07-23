import {
  Target01Icon,
  InboxIcon,
  Rocket01Icon,
  SentIcon,
} from "@hugeicons/core-free-icons";
import { StatCard } from "@/components/dashboard/stat-card";
import { PipelineFunnel } from "@/components/dashboard/pipeline-funnel";
import { MatchDistribution } from "@/components/dashboard/match-distribution";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import type { Metrics } from "@/src/metrics.ts";

const KPI_ICON: Record<string, React.ComponentProps<typeof StatCard>["icon"]> = {
  pipeline: Target01Icon,
  review: InboxIcon,
  auto: Rocket01Icon,
  sent: SentIcon,
};

export function DashboardOverview({ metrics }: { metrics: Metrics }) {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.kpis.map((kpi) => (
          <StatCard
            key={kpi.key}
            label={kpi.label}
            value={kpi.value}
            icon={KPI_ICON[kpi.key] ?? Target01Icon}
            accent={kpi.tone}
            hint={kpi.hint}
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ActivityChart data={metrics.activity} className="lg:col-span-2" />
        <RecentActivity items={metrics.recent} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PipelineFunnel funnel={metrics.funnel} exits={metrics.exits} />
        <MatchDistribution rankedTotal={metrics.distribution.rankedTotal} bands={metrics.distribution.bands} />
      </section>
    </div>
  );
}
