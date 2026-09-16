"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require";
import { upsertUser, setPassword, setTotp, getUser } from "@/lib/rights/store";
import { hashPassword } from "@/lib/auth/password";
import { newSecret } from "@/lib/auth/totp";
import { TIERS, type Tier } from "@/lib/rights/types";

export async function saveUser(form: FormData): Promise<void> {
  const admin = await requireAdmin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const tier = String(form.get("tier") ?? "user") as Tier;
  if (!email || !TIERS.includes(tier)) return;
  const allStores = form.get("all_stores") === "on";
  const stores = String(form.get("stores") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const features = ["sales", "service", "finance"].filter((f) => form.get(`f_${f}`) === "on");
  await upsertUser(admin.email, { email, tier, features, stores, allStores, homeStore: String(form.get("home_store") ?? "").trim().toUpperCase() || null });
  const pw = String(form.get("password") ?? "");
  if (pw) await setPassword(email, hashPassword(pw));
  const u = await getUser(email);
  if (u && !u.totpSecret && form.get("demo_2fa") === "on") await setTotp(email, { totpSecret: newSecret() });
  revalidatePath("/admin/users");
}
