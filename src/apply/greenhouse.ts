import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Job } from "../types.ts";

export interface Applicant {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumePath?: string;
}

export interface ApplyResult {
  ok: boolean;
  dryRun: boolean;
  detail: string;
}

/**
 * Submit a Greenhouse application. Sending a real application to a real company
 * is an irreversible outward-facing action, so this defaults to dryRun: it
 * validates everything and reports what WOULD be sent, without POSTing.
 *
 * Real submission (dryRun=false) requires a per-board question mapping and is
 * gated behind an explicit opt-in in the engine. It is never run automatically
 * during development or testing.
 */
export async function submitGreenhouseApplication(
  job: Job,
  applicant: Applicant,
  opts: { dryRun?: boolean } = {}
): Promise<ApplyResult> {
  const dryRun = opts.dryRun ?? true;

  if (job.source !== "greenhouse" || !job.boardToken || !job.externalId) {
    return { ok: false, dryRun, detail: "job no es de greenhouse o le falta boardToken/externalId" };
  }
  const resumeAbs = applicant.resumePath
    ? join(process.cwd(), applicant.resumePath)
    : undefined;
  if (!resumeAbs || !existsSync(resumeAbs)) {
    return { ok: false, dryRun, detail: `CV no encontrado en ${resumeAbs ?? "(sin path)"}` };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      detail: `[dry-run] aplicaria a "${job.title}" @ ${job.boardToken} (#${job.externalId}) como ${applicant.firstName} ${applicant.lastName} <${applicant.email}> con CV ${applicant.resumePath}`,
    };
  }

  // Real path — intentionally left unimplemented until a human confirms the
  // first live submission and the per-board question mapping is built.
  // The Greenhouse endpoint is POST boards-api.greenhouse.io/v1/boards/<token>/jobs/<id>
  // with multipart form-data (first_name, last_name, email, resume, plus
  // job-specific question ids). Requires an auth token for most boards.
  throw new Error("envio real de greenhouse no implementado: requiere confirmacion humana y mapeo de preguntas del board");
}
