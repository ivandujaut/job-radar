import { redirect } from "next/navigation";
import {
  AutonomyStep,
  ConnectStep,
  ProfileStep,
  RulesStep,
} from "@/components/onboarding/steps";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";

export const dynamic = "force-dynamic";

const STEPS = ["profile", "rules", "connect", "autonomy"] as const;
type Step = (typeof STEPS)[number];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await loadSettings(session.userId);
  const { step } = await searchParams;
  const current: Step = STEPS.includes(step as Step) ? (step as Step) : "profile";

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6 md:p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Configurá tu radar</h1>
        <p className="text-sm text-muted-foreground">Cuatro pasos y los agentes arrancan.</p>
      </header>

      <ol className="flex gap-2 text-xs">
        {STEPS.map((s, i) => (
          <li
            key={s}
            className={`flex-1 rounded-full py-1 text-center ${
              s === current
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </li>
        ))}
      </ol>

      {current === "profile" && <ProfileStep profile={settings.profile} />}
      {current === "rules" && <RulesStep profile={settings.profile} />}
      {current === "connect" && <ConnectStep />}
      {current === "autonomy" && <AutonomyStep autonomy={settings.autonomy} />}
    </main>
  );
}
