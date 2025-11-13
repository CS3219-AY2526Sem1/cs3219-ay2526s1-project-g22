/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 16 Sep 2025
Scope: Generated boilerplate for this file from the team's requirements and guidance. Also refactored some messy parts and added clarifying comments. Suggested tests for edge-cases based on user-specified scenarios.
Author review: I validated correctness against the team's requirements, ran tests, then improved clarity and debugged interactions with other components.
*/
import * as z from "zod";

const postUserValidator = z.object({
  id: z.string().uuid("Invalid user ID format"),
  email: z.string().email("Invalid email format"),
  name: z.string().min(1, "Name is required"),
});

type TPostUserValidator = z.infer<typeof postUserValidator>;

export function validatePostUser(data: unknown): TPostUserValidator {
  try {
    const parsed = postUserValidator.parse(data);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error; // rethrow unexpected errors
  }
}

const getUserValidator = z.object({
  id: z.string().uuid("Invalid user ID format"),
});
type TGetUserValidator = z.infer<typeof getUserValidator>;

export function validateGetUser(data: unknown): TGetUserValidator {
  try {
    const parsed = getUserValidator.parse(data);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error; // rethrow unexpected errors
  }
}

const updateUserValidator = z.object({
  id: z.string().uuid("Invalid user ID format"),
  name: z.string().min(1, "Name is required"),
  avatar_url: z.string().url("Invalid URL format").optional(),
});
type TUpdateUserValidator = z.infer<typeof updateUserValidator>;

export function validateUpdateUser(data: unknown): TUpdateUserValidator {
  try {
    const parsed = updateUserValidator.parse(data);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation error: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error; // rethrow unexpected errors
  }
}
