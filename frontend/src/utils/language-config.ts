/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-18
Scope: Reviewed utility code, caught small issues, and suggested tidy-ups.
Author review: I verified correctness of the modifications by AI against requirements.
*/
import { indentUnit } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
export const languageConfigs = {
  python: {
    pistonLang: "python",
    version: "3.10.0",
    files: (code: string) => [{ name: "solution.py", content: code }],
  },

  javascript: {
    pistonLang: "javascript",
    version: "18.15.0",
    files: (code: string) => [{ name: "solution.js", content: code }],
  },
  python3: {
    pistonLang: "python",
    version: "3.10.0",
    files: (code: string) => [{ name: "solution.py", content: code }],
  },
} as const;

export const languageMap = {
  Python: {
    apiLang: "python" as const,
    extension: [python(), indentUnit.of("    ")], // Python uses 4 spaces for indentation
  },
  JavaScript: {
    apiLang: "javascript" as const,
    extension: [javascript(), indentUnit.of("  ")], // JavaScript uses 2 spaces for indentation
  },
  Python3: {
    apiLang: "python" as const,
    extension: [python(), indentUnit.of("    ")],
  },
} as const;
