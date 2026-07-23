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
 * Submit an application to an ATS job. Sending a real application to a real
 * company is an irreversible outward-facing action, so this defaults to dryRun:
 * it validates everything and reports what WOULD be sent, without POSTing.
 *
 * Real submission (dryRun=false) is intentionally unimplemented for every
 * provider until a human confirms the first live submission and the per-board
 * question mapping is built. It is never run automatically.
 */
export async function submitApplication(
  job: Job,
  applicant: Applicant,
  opts: { dryRun?: boolean } = {}
): Promise<ApplyResult> {
  const dryRun = opts.dryRun ?? true;

  if (!["greenhouse", "lever", "ashby"].includes(job.source) || !job.boardToken || !job.externalId) {
    return { ok: false, dryRun, detail: `fuente no aplicable o sin boardToken/externalId: ${job.source}` };
  }
  const resumeAbs = applicant.resumePath ? join(process.cwd(), applicant.resumePath) : undefined;
  if (!resumeAbs || !existsSync(resumeAbs)) {
    return { ok: false, dryRun, detail: `CV no encontrado en ${resumeAbs ?? "(sin path)"}` };
  }

  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      detail: `[dry-run] aplicaria a "${job.title}" @ ${job.source}:${job.boardToken} (#${job.externalId}) como ${applicant.firstName} ${applicant.lastName} <${applicant.email}> con CV ${applicant.resumePath}`,
    };
  }

  // Real submission per provider. Each ATS has a different multipart endpoint
  // and per-job question schema; wiring that requires a human to confirm the
  // first live submission, so it is deliberately not implemented here.
  throw new Error(
    `envio real (${job.source}) no implementado: requiere confirmacion humana y mapeo de preguntas del board`
  );
}
