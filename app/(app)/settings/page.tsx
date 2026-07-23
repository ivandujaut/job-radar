import { redirect } from "next/navigation";
import { updateAutonomy } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const settings = await loadSettings(session.userId);
  const { autonomy } = settings;

  return (
    <main className="mx-auto w-full max-w-2xl space-y-8 p-6 md:p-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Cambiá cómo trabajan tus agentes. Los cambios aplican a la próxima corrida.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autonomía</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cuánto dejás que los agentes hagan solos. Las notas de conexión siempre pasan por vos.
          </p>
        </CardHeader>
        <CardContent>
          <form action={updateAutonomy} className="space-y-5">
            <label className="flex items-center justify-between gap-4 rounded-md border border-border p-3">
              <span className="text-sm">
                <span className="font-medium">Aplicar automático en segundo plano</span>
                <span className="block text-muted-foreground">
                  Solo en Greenhouse, Lever y Ashby. LinkedIn nunca es automático.
                </span>
              </span>
              <input
                type="checkbox"
                name="autoApplyEnabled"
                defaultChecked={autonomy.autoApplyEnabled}
                className="h-4 w-4 accent-primary"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="threshold">Umbral auto-apply</Label>
                <Input id="threshold" name="threshold" type="number" min={55} max={100} defaultValue={autonomy.autoApplyThreshold} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reviewFloor">Piso de revisión</Label>
                <Input id="reviewFloor" name="reviewFloor" type="number" min={30} max={90} defaultValue={autonomy.reviewFloor} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="maxPerDay">Máx. por día</Label>
                <Input id="maxPerDay" name="maxPerDay" type="number" min={1} max={50} defaultValue={autonomy.maxAutoAppliesPerDay} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Arriba del umbral aplica solo. Entre el piso y el umbral, queda en tu cola. Debajo del
              piso, se descarta.
            </p>

            <Button type="submit">Guardar cambios</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{settings.email ?? session.email ?? "-"}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última corrida del motor</span>
            <span>
              {settings.lastRun ? new Date(settings.lastRun.at).toLocaleString("es-AR") : "nunca"}
            </span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
