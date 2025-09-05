"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { signUpAction } from "../actions/signup";
import { showToast } from "@/utils/toast-helper";
import SignInWithGoogleButton from "./SignInWithGoogle";

interface IFormData {
  email: string;
  password: string;
  name: string;
}
export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<IFormData>({
    email: "",
    password: "",
    name: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // need to show toast first
      showToast(
        "Sign up successful! Please check your email to confirm your account",
        {
          success: true,
        }
      );
      await signUpAction(formData.email, formData.password, formData.name);

      // This will only run if signUpAction doesn't redirect
    } catch (err) {
      // Check if this is a Next.js redirect (which is normal behavior)
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        typeof err.digest === "string" &&
        err.digest.includes("NEXT_REDIRECT")
      ) {
        return; // Don't treat this as an error
      }

      // Handle actual errors from the signup action
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";

      showToast(errorMessage, {
        success: false,
      });
    } finally {
      // Always set loading to false, regardless of success or failure
      setIsLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="name"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-4 w-4 text-gray-400" />
            ) : (
              <EyeIcon className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full cursor-pointer"
        disabled={isLoading}
      >
        {isLoading ? "Creating Account..." : "Sign in"}
      </Button>
      <SignInWithGoogleButton />
    </form>
  );
}
