/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-18
Scope: Reviewed utility code, caught small issues, and suggested tidy-ups.
Author review: I verified correctness of the modifications by AI against requirements.
*/
export const validatePassword = (password: string): string | null => {
  // NIST guidelines recommend at least 15 characters
  if (password.length < 15) {
    return "Password must be at least 15 characters long.";
  }

  // Optional: Enforce complexity (e.g., uppercase, lowercase, number, special character)
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return "Password must include uppercase, lowercase, a number, and a special character.";
  }

  // Optional: Check against a blacklist of common passwords (e.g., "password123")
  const commonPasswords = [
    "password",
    "123456",
    "qwerty",
    "letmein",
    "12345678",
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    return "Password is too common. Please choose a stronger password.";
  }

  return null; // Password is valid
};

export const validatePasswordRequirements = (password: string) => {
  return {
    length: password.length >= 15,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};
