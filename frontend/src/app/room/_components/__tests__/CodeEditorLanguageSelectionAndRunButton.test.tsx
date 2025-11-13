/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements and modofied behvaiour of a couple fo test cases for clarity
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import CodeEditorLanguageSelectionAndRunButton from "../CodeEditorLanguageSelectionAndRunButton";
import { languageMap } from "@/utils/language-config";

// Mock the Select components
jest.mock("@/components/ui/select", () => ({
  Select: ({
    children,
    value,
    onValueChange,
  }: {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) => (
    <div data-testid="select" data-value={value}>
      <div onClick={() => onValueChange("Python")}>{children}</div>
    </div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: () => <div>Select Value</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-value={value}>{children}</div>,
}));

describe("CodeEditorLanguageSelectionAndRunButton", () => {
  const mockSetSelectedLanguage = jest.fn();
  const mockSetCode = jest.fn();
  const mockExecuteCode = jest.fn();

  const defaultProps = {
    selectedLanguage: "JavaScript",
    setSelectedLanguage: mockSetSelectedLanguage,
    setCode: mockSetCode,
    availableLanguages: ["JavaScript", "Python", "C++"],
    executeCode: mockExecuteCode,
    isBlocked: false,
    languageMap,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders language selector with correct label", () => {
    render(<CodeEditorLanguageSelectionAndRunButton {...defaultProps} />);

    expect(screen.getByText("Language:")).toBeInTheDocument();
  });

  it("renders Run Code button", () => {
    render(<CodeEditorLanguageSelectionAndRunButton {...defaultProps} />);

    expect(
      screen.getByRole("button", { name: "Run Code" })
    ).toBeInTheDocument();
  });

  it("calls executeCode when Run Code button is clicked", () => {
    render(<CodeEditorLanguageSelectionAndRunButton {...defaultProps} />);

    const runButton = screen.getByRole("button", { name: "Run Code" });
    fireEvent.click(runButton);

    expect(mockExecuteCode).toHaveBeenCalledTimes(1);
  });

  it("disables Run Code button when isBlocked is true", () => {
    render(
      <CodeEditorLanguageSelectionAndRunButton
        {...defaultProps}
        isBlocked={true}
      />
    );

    const runButton = screen.getByRole("button", {
      name: "Run Code",
    }) as HTMLButtonElement;
    expect(runButton.disabled).toBe(true);
  });

  it("disables Run Code button when language is not supported", () => {
    render(
      <CodeEditorLanguageSelectionAndRunButton
        {...defaultProps}
        selectedLanguage="UnsupportedLang"
      />
    );

    const runButton = screen.getByRole("button", {
      name: "Run Code",
    }) as HTMLButtonElement;
    expect(runButton.disabled).toBe(true);
  });

  it("shows warning message when language is not supported", () => {
    render(
      <CodeEditorLanguageSelectionAndRunButton
        {...defaultProps}
        selectedLanguage="UnsupportedLang"
      />
    );

    expect(
      screen.getByText("Execution not supported for UnsupportedLang")
    ).toBeInTheDocument();
  });

  it("does not show warning message when language is supported", () => {
    render(<CodeEditorLanguageSelectionAndRunButton {...defaultProps} />);

    expect(
      screen.queryByText(/Execution not supported/)
    ).not.toBeInTheDocument();
  });

  it("enables Run Code button for supported languages", () => {
    render(
      <CodeEditorLanguageSelectionAndRunButton
        {...defaultProps}
        selectedLanguage="Python"
      />
    );

    const runButton = screen.getByRole("button", {
      name: "Run Code",
    }) as HTMLButtonElement;
    expect(runButton.disabled).toBe(false);
  });

  it("applies correct styling to Run Code button", () => {
    render(<CodeEditorLanguageSelectionAndRunButton {...defaultProps} />);

    const runButton = screen.getByRole("button", { name: "Run Code" });
    expect(runButton).toHaveClass(
      "bg-gradient-to-r",
      "from-blue-600",
      "to-blue-700"
    );
  });

  it("displays selected language in select component", () => {
    const { container } = render(
      <CodeEditorLanguageSelectionAndRunButton {...defaultProps} />
    );

    const select = container.querySelector('[data-testid="select"]');
    expect(select).toHaveAttribute("data-value", "JavaScript");
  });

  it("renders all available languages", () => {
    render(<CodeEditorLanguageSelectionAndRunButton {...defaultProps} />);

    defaultProps.availableLanguages.forEach((lang) => {
      expect(screen.getByText(lang)).toBeInTheDocument();
    });
  });

  it("handles empty available languages array", () => {
    render(
      <CodeEditorLanguageSelectionAndRunButton
        {...defaultProps}
        availableLanguages={[]}
      />
    );

    expect(screen.getByText("Language:")).toBeInTheDocument();
  });

  it("applies disabled styling when button is disabled", () => {
    render(
      <CodeEditorLanguageSelectionAndRunButton
        {...defaultProps}
        isBlocked={true}
      />
    );

    const runButton = screen.getByRole("button", { name: "Run Code" });
    expect(runButton).toHaveClass(
      "disabled:from-slate-600",
      "disabled:to-slate-700"
    );
  });
});
