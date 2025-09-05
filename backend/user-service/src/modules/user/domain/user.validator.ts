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
