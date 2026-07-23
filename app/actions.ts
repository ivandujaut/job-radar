"use server";

import { revalidatePath } from "next/cache";
import { findById, log, upsert } from "@/src/store.ts";

function requireItem(id: string) {
  const item = findById(id);
  if (!item) throw new Error(`item no encontrado: ${id}`);
  return item;
}

export async function approveItem(id: string, formData?: FormData) {
  const item = requireItem(id);
  const draft = formData?.get("draft");
  if (typeof draft === "string" && draft.trim()) {
    item.draft = draft.trim();
  }
  item.status = "approved";
  upsert(log(item, "approved via dashboard"));
  revalidatePath("/");
}

export async function rejectItem(id: string) {
  const item = requireItem(id);
  item.status = "rejected";
  upsert(log(item, "rejected via dashboard"));
  revalidatePath("/");
}

export async function saveDraft(id: string, formData: FormData) {
  const item = requireItem(id);
  const draft = formData.get("draft");
  if (typeof draft !== "string") return;
  item.draft = draft.trim();
  upsert(log(item, "draft edited via dashboard"));
  revalidatePath("/");
}
