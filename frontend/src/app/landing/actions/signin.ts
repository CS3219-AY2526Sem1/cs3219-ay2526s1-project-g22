"use server";
import { signIn } from "../../../lib/auth";
import { redirect } from "next/navigation";

export async function signInAction(email: string, password: string) {
  const res = await signIn(email, password);
  if (!res.success) {
    return res.error;
  }

  redirect("/");
}
