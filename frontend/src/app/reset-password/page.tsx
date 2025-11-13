/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 2025-09-17
Scope: Refactored parts to reduce clutter and added clarifying comments.
Author review: I verified correctness of the modifications by AI against requirements. I cleaned up small messy implementations and ran quick checks to validate behavior.
*/
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { createClient } from "../../lib/supabase/supabase-client";
import {
  validatePassword,
  validatePasswordRequirements,
} from "@/utils/password-helper";
import { showToast } from "@/utils/toast-helper";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordRequirements(validatePasswordRequirements(e.target.value));
  };
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    // validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      showToast(passwordError, { success: false });
      setStatus("error");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      showToast("Error updating password: " + error.message, {
        success: false,
      });
    } else {
      setStatus("success");
      showToast("Password updated successfully!", { success: true });
      router.push("/");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-8 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your new password"
            value={password}
            onChange={handleChange}
            required
            disabled={status === "loading"}
            className="mt-2"
          />
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Updating..." : "Update Password"}
        </Button>
        {password && (
          <ul className="mt-2 text-sm">
            <li
              className={`${
                passwordRequirements.length ? "text-green-500" : "text-red-500"
              }`}
            >
              {passwordRequirements.length ? "✔" : "✘"} At least 15 characters
            </li>
            <li
              className={`${
                passwordRequirements.hasUppercase
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {passwordRequirements.hasUppercase ? "✔" : "✘"} At least one
              uppercase letter
            </li>
            <li
              className={`${
                passwordRequirements.hasLowercase
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {passwordRequirements.hasLowercase ? "✔" : "✘"} At least one
              lowercase letter
            </li>
            <li
              className={`${
                passwordRequirements.hasNumber
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {passwordRequirements.hasNumber ? "✔" : "✘"} At least one number
            </li>
            <li
              className={`${
                passwordRequirements.hasSpecialChar
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {passwordRequirements.hasSpecialChar ? "✔" : "✘"} At least one
              special character
            </li>
          </ul>
        )}
      </form>
    </div>
  );
}
