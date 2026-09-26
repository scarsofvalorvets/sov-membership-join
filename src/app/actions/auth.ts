"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut, devLoginEnabled } from "@/auth";

function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : "/record";
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect("/signin?error=InvalidEmail");
  let result: unknown;
  try {
    result = await signIn("email", { email, redirectTo: next, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) redirect(`/signin?error=${err.type}`);
    throw err;
  }
  const url = typeof result === "string" ? new URL(result, "http://localhost") : null;
  const error = url?.searchParams.get("error");
  if (error) redirect(`/signin?error=${encodeURIComponent(error)}`);
  // Known and unknown emails land on the same page (no account enumeration).
  redirect("/signin/check-email");
}

export async function devSignIn(formData: FormData) {
  if (!devLoginEnabled) redirect("/signin");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(formData.get("next"));
  try {
    await signIn("dev-login", { email, redirectTo: next });
  } catch (err) {
    if (err instanceof AuthError) redirect(`/signin?error=DevLogin`);
    throw err;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
