import {
  completeAutonomyStep,
  completeProfileStep,
  completeRulesStep,
  skipConnectStep,
} from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AutonomySettings } from "@/src/settings.ts";

export function ProfileStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Tu perfil</CardTitle>
        <p className="text-sm text-muted-foreground">
          Los agentes rankean cada vacante contra tu CV. Confirmá que tu perfil está cargado; se
          usa tal cual, sin inflar.
        </p>
      </CardHeader>
      <CardContent>
        <form action={completeProfileStep}>
          <p className="mb-4 text-sm text-muted-foreground">
            Perfil actual: Product Engineer, 4+ años, bioingeniero (ITBA). Inglés A2.
          </p>
          <Button type="submit">Confirmar y seguir</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function RulesStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>2. Qué buscás</CardTitle>
        <p className="text-sm text-muted-foreground">
          Roles, ubicación y filtros. Definen qué vacantes entran al radar.
        </p>
      </CardHeader>
      <CardContent>
        <form action={completeRulesStep} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Reglas actuales: Product Manager / Product Engineer, Argentina + LATAM remoto, sin roles
            director/VP/head.
          </p>
          <Button type="submit">Confirmar y seguir</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ConnectStep() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>3. Conectar LinkedIn</CardTitle>
        <p className="text-sm text-muted-foreground">
          Para las notas de conexión y las vacantes de Easy Apply.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p className="mb-2 font-medium text-foreground">Cómo funciona, sin letra chica</p>
          <p>
            LinkedIn no ofrece un permiso oficial para buscar o aplicar por vos. Por eso esto va con
            una extensión de browser que actúa desde tu propia sesión, y llega en la próxima fase.
          </p>
          <p className="mt-2">
            Mientras tanto, el auto-apply en segundo plano funciona en Greenhouse, Lever y Ashby, que
            sí permiten aplicar sin tocar tu cuenta de LinkedIn.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled>
            Instalar extensión (pronto)
          </Button>
          <form action={skipConnectStep}>
            <Button type="submit" variant="ghost">
              Seguir sin conectar
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

export function AutonomyStep({ autonomy }: { autonomy: AutonomySettings }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>4. Nivel de autonomía</CardTitle>
        <p className="text-sm text-muted-foreground">
          Cuánto dejás que los agentes hagan solos. Las notas de conexión siempre pasan por vos.
        </p>
      </CardHeader>
      <CardContent>
        <form action={completeAutonomyStep} className="space-y-5">
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

          <div className="space-y-1.5">
            <Label htmlFor="threshold">Umbral de match para aplicar solo (55-100)</Label>
            <Input
              id="threshold"
              name="threshold"
              type="number"
              min={55}
              max={100}
              defaultValue={autonomy.autoApplyThreshold}
            />
            <p className="text-xs text-muted-foreground">
              Arriba de este puntaje aplica solo. Entre {autonomy.reviewFloor} y el umbral, queda en
              tu cola de revisión.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="maxPerDay">Máximo de aplicaciones automáticas por día</Label>
            <Input
              id="maxPerDay"
              name="maxPerDay"
              type="number"
              min={1}
              max={50}
              defaultValue={autonomy.maxAutoAppliesPerDay}
            />
          </div>

          <Button type="submit">Empezar a buscar</Button>
        </form>
      </CardContent>
    </Card>
  );
}
