"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { str } from "@/lib/text";

export async function updateAccount(formData: FormData) {
  const user = await requireUser("/account");
  const name = str(formData, "name", 80);
  if (!name || name.length < 2) redirect("/account?notice=invalid");
  await prisma.user.update({
    where: { id: user.id },
    data: { name, phone: str(formData, "phone", 30) },
  });
  redirect("/account?notice=saved");
}
