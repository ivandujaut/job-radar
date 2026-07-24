"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { discoverContactsForCompany } from "@/src/contacts.ts";
import { getSession } from "@/src/auth.ts";
import { loadSettings } from "@/src/settings.ts";
import { findById, log, upsert } from "@/src/store.ts";

/** Whether the current user keeps the contact finder active for searches. */
async function contactSearchEnabled(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const settings = await loadSettings(session.userId);
  return !settings.disabledSources.includes("contacts");
}

async function requireItem(id: string) {
  const item = await findById(id);
  if (!item) throw new Error(`item no encontrado: ${id}`);
  return item;
}

export async function approveItem(id: string, formData?: FormData) {
  const item = await requireItem(id);
  const draft = formData?.get("draft");
  if (typeof draft === "string" && draft.trim()) {
    item.draft = draft.trim();
  }
  item.status = "approved";
  await upsert(log(item, "approved via dashboard"));

  // Approving an application warms it: kick off contact discovery for that
  // company. after() runs post-response, so approval stays instant and a
  // search failure never surfaces to the user. Skipped if the user paused the
  // contact finder on the Integrations screen.
  if (item.kind === "application" && item.job && (await contactSearchEnabled())) {
    const company = item.job.company;
    const why = `Aprobaste tu aplicación a ${item.job.title} en ${company}`;
    after(async () => {
      try {
        await discoverContactsForCompany(company, why);
      } catch (e) {
        console.error(`discoverContactsForCompany(${company}):`, (e as Error).message);
      }
    });
  }

  revalidatePath("/", "layout");
}

export async function rejectItem(id: string) {
  const item = await requireItem(id);
  item.status = "rejected";
  await upsert(log(item, "rejected via dashboard"));
  revalidatePath("/", "layout");
}

export async function saveDraft(id: string, formData: FormData) {
  const item = await requireItem(id);
  const draft = formData.get("draft");
  if (typeof draft !== "string") return;
  item.draft = draft.trim();
  await upsert(log(item, "draft edited via dashboard"));
  revalidatePath("/", "layout");
}
