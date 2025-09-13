"use server";
import { signUp } from "../../../lib/auth";
import { redirect } from "next/navigation";

export async function signUpAction(
  email: string,
  password: string,
  name: string
) {
  const res = await signUp(email, password, name);
  if (!res.success) {
    redirect("/landing");
  }

  redirect("/");
}
