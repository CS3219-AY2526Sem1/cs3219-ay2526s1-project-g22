/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements and modified several test cases slightly
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import CodeEditorSubmissionResults from "../CodeEditorSubmissionResults";

// Mock the Card components
jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
}));

describe("CodeEditorSubmissionResults", () => {
  it("renders nothing when submission history is empty", () => {
    const { container } = render(
      <CodeEditorSubmissionResults submissionHistory={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders execution results title when submissions exist", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Test output",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Execution Results")).toBeInTheDocument();
  });

  it("displays submission language", () => {
    const mockHistory = [
      {
        language: "Python",
        output: "Test output",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("displays submission number", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Test output",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("displays submission output", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Test output message",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Test output message")).toBeInTheDocument();
  });

  it("displays multiple submissions", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Output 1",
      },
      {
        language: "Python",
        output: "Output 2",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("displays only last 5 submissions in reverse order", () => {
    const mockHistory = Array.from({ length: 7 }, (_, i) => ({
      language: `Lang${i + 1}`,
      output: `Output ${i + 1}`,
    }));

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    // Should show submissions 7, 6, 5, 4, 3 (in that order)
    expect(screen.getByText("Lang7")).toBeInTheDocument();
    expect(screen.getByText("Lang6")).toBeInTheDocument();
    expect(screen.getByText("Lang5")).toBeInTheDocument();
    expect(screen.getByText("Lang4")).toBeInTheDocument();
    expect(screen.getByText("Lang3")).toBeInTheDocument();

    // Should not show submissions 1 and 2
    expect(screen.queryByText("Lang1")).not.toBeInTheDocument();
    expect(screen.queryByText("Lang2")).not.toBeInTheDocument();
  });

  it("handles submission with undefined output", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: undefined,
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("handles submission with empty string output", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
  });

  it("renders checkmark icon in title", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Test",
      },
    ];

    const { container } = render(
      <CodeEditorSubmissionResults submissionHistory={mockHistory} />
    );

    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveClass("text-emerald-400");
  });

  it("displays submission numbers correctly for multiple submissions", () => {
    const mockHistory = [
      {
        language: "Lang1",
        output: "Output 1",
      },
      {
        language: "Lang2",
        output: "Output 2",
      },
      {
        language: "Lang3",
        output: "Output 3",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    // Should show #3, #2, #1 (in reverse order)
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("renders submission card with correct styling classes", () => {
    const mockHistory = [
      {
        language: "Python",
        output: "Output",
      },
    ];

    const { container } = render(
      <CodeEditorSubmissionResults submissionHistory={mockHistory} />
    );

    const submissionCard = container.querySelector(".bg-slate-800\\/60");
    expect(submissionCard).toBeInTheDocument();
  });

  it("renders output container with correct styling", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Test",
      },
    ];

    const { container } = render(
      <CodeEditorSubmissionResults submissionHistory={mockHistory} />
    );

    const outputContainer = container.querySelector(".bg-slate-900\\/60");
    expect(outputContainer).toBeInTheDocument();
  });

  it("renders submissions in horizontal flex layout", () => {
    const mockHistory = [
      {
        language: "Lang1",
        output: "Output 1",
      },
      {
        language: "Lang2",
        output: "Output 2",
      },
    ];

    const { container } = render(
      <CodeEditorSubmissionResults submissionHistory={mockHistory} />
    );

    const flexContainer = container.querySelector(".flex.flex-row.gap-4");
    expect(flexContainer).toBeInTheDocument();
    expect(flexContainer?.children).toHaveLength(2);
  });

  it("displays multiple outputs correctly", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        output: "Success",
      },
      {
        language: "Python",
        output: "Error occurred",
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Success")).toBeInTheDocument();
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
  });
});
