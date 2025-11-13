/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-18
Scope: Reviewed utility code, caught small issues, and suggested tidy-ups.
Author review: I verified correctness of the modifications by AI against requirements. I cleaned up a few utilities and validated they still behave as expected.
*/
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
