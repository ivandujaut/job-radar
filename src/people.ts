import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { profile } from "./config.ts";
import type { RawHit } from "./adapters/people-search.ts";

export interface Person {
  name: string;
  role: string;
  company: string;
  url: string;
  relevance: "hiring" | "product" | "leadership";
  hook: string;
}

const triageSchema = z.object({
  people: z.array(
    z.object({
      name: z.string(),
      role: z.string().describe("Cargo tal como aparece en el titulo/snippet, sin inventar"),
      url: z.string(),
      relevance: z
        .enum(["hiring", "product", "leadership", "irrelevant"])
        .describe("hiring: RRHH/talento/recruiting. product: rol de producto. leadership: founder/C-level. irrelevant: descartar"),
      hook: z
        .string()
        .describe("Punto de contacto genuino entre el perfil del candidato y esta persona/empresa, basado solo en evidencia disponible"),
    })
  ),
});

export async function triagePeople(company: string, why: string, hits: RawHit[]): Promise<Person[]> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: triageSchema,
    prompt: [
      `Estos son resultados de buscador sobre perfiles de LinkedIn relacionados con la empresa "${company}".`,
      `Contexto de por que interesa la empresa: ${why}`,
      "Identifica personas REALES que trabajen ahi hoy y clasificalas. Reglas:",
      "- Solo incluir si el titulo/snippet da evidencia de que trabaja en la empresa (no ex-empleados, no homonimos).",
      "- relevance=irrelevant para cualquiera sin señal clara de hiring, producto o liderazgo.",
      "- El hook debe salir de evidencia real del perfil del candidato (abajo) y del rol de la persona. Nada inventado.",
      "",
      "## Perfil del candidato",
      profile(),
      "",
      "## Resultados",
      ...hits.map((h, i) => `${i + 1}. ${h.title}\n   ${h.url}\n   ${h.snippet}`),
    ].join("\n"),
  });
  return object.people
    .filter((p) => p.relevance !== "irrelevant")
    .map((p) => ({ ...p, relevance: p.relevance as Person["relevance"], company }));
}

const noteSchema = z.object({
  note: z.string().describe("Nota de conexion de LinkedIn. MAXIMO 280 caracteres. Espanol rioplatense neutro."),
});

export async function draftNote(person: Person): Promise<string> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-5"),
    schema: noteSchema,
    prompt: [
      "Redacta una nota de conexion de LinkedIn del candidato hacia esta persona.",
      "Reglas duras:",
      "- MAXIMO 280 caracteres (el limite de LinkedIn es 300; dejamos margen).",
      "- Sin inflar: nada que el perfil del candidato no acredite.",
      "- Sin em-dashes. Sin adulacion vacia. Una idea concreta, no tres.",
      "- Mencionar el hook de forma natural. No pedir trabajo directamente; abrir conversacion.",
      "- Tono: directo, concreto, primera persona.",
      "",
      "## Perfil del candidato",
      profile(),
      "",
      "## Persona",
      `${person.name}, ${person.role} en ${person.company} (${person.relevance})`,
      `Hook: ${person.hook}`,
    ].join("\n"),
  });
  let note = object.note.trim();
  if (note.length > 300) note = note.slice(0, 297) + "...";
  return note;
}
