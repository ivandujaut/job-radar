import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { profile, rules } from "./config.ts";
import type { Job, Ranking } from "./types.ts";

const rankingSchema = z.object({
  score: z.number().min(0).max(100).describe("Match 0-100 entre el perfil y la vacante"),
  reasons: z.array(z.string()).describe("Razones concretas del puntaje, citando la vacante"),
  warnings: z
    .array(z.string())
    .describe("Alertas: ingles fluido requerido, seniority fuera de rango, señales de vacante fantasma"),
});

export async function rankJob(job: Job): Promise<Ranking> {
  const r = rules();
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: rankingSchema,
    prompt: [
      "Evalua el match entre este perfil de candidato y esta vacante.",
      "Se honesto: un puntaje inflado quema una aplicacion. El candidato tiene ingles A2:",
      "si la vacante exige ingles fluido, bajalo a warning, no descartes solo.",
      `Seniority excluido por reglas: ${r.filters.seniority_exclude.join(", ")}.`,
      "",
      "## Perfil",
      profile(),
      "",
      "## Vacante",
      `Titulo: ${job.title}`,
      `Empresa: ${job.company}`,
      `Ubicacion: ${job.location}`,
      `Descripcion:\n${job.description ?? "(sin descripcion, solo titulo)"}`,
    ].join("\n"),
  });
  return object;
}
