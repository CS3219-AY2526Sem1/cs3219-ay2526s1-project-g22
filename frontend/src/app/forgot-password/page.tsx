"use client";
import { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import { createClient } from "../../lib/supabase/supabase-client";
import { getURL } from "../../utils/url-helper";
/*
AI Assistance Disclosure:
Tool: Claude Sonnet 4.5, date: 2025-09-18
Scope: Reviewed the code, found potential small bugs, and suggested small fixes to avoid runtime issues.
Author review: I verified correctness of the modifications by AI against requirements. I fixed minor problems and tested the UI interactions to ensure they behave correctly.
*/

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    const callbackURL = getURL("/api/auth/reset-password");
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: callbackURL,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage("Password reset email sent! Please check your inbox.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-24 p-8 border rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {status === "loading" ? "Sending..." : "Send Reset Link"}
        </Button>
        {message && (
          <div
            className={`text-sm mt-2 ${
              status === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
