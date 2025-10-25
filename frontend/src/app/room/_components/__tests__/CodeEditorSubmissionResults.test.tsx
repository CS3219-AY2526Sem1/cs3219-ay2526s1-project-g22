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
        results: [{ pass: true }, { pass: false }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Execution Results")).toBeInTheDocument();
  });

  it("displays submission language", () => {
    const mockHistory = [
      {
        language: "Python",
        results: [{ pass: true }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("displays submission number", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: true }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("displays passed count correctly", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: true }, { pass: true }, { pass: false }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Passed: 2")).toBeInTheDocument();
  });

  it("displays failed count correctly", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: true }, { pass: false }, { pass: false }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Failed: 2")).toBeInTheDocument();
  });

  it("displays multiple submissions", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: true }],
      },
      {
        language: "Python",
        results: [{ pass: false }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("JavaScript")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
  });

  it("displays only last 5 submissions in reverse order", () => {
    const mockHistory = Array.from({ length: 7 }, (_, i) => ({
      language: `Lang${i + 1}`,
      results: [{ pass: true }],
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

  it("handles submission with no results", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: undefined,
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Passed: 0")).toBeInTheDocument();
    expect(screen.getByText("Failed: 0")).toBeInTheDocument();
  });

  it("handles submission with empty results array", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Passed: 0")).toBeInTheDocument();
    expect(screen.getByText("Failed: 0")).toBeInTheDocument();
  });

  it("handles submission with all passing tests", () => {
    const mockHistory = [
      {
        language: "Python",
        results: [{ pass: true }, { pass: true }, { pass: true }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Passed: 3")).toBeInTheDocument();
    expect(screen.getByText("Failed: 0")).toBeInTheDocument();
  });

  it("handles submission with all failing tests", () => {
    const mockHistory = [
      {
        language: "Python",
        results: [{ pass: false }, { pass: false }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    expect(screen.getByText("Passed: 0")).toBeInTheDocument();
    expect(screen.getByText("Failed: 2")).toBeInTheDocument();
  });

  it("applies correct styling to passed count", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: true }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    const passedText = screen.getByText("Passed: 1");
    expect(passedText).toHaveClass("text-green-400");
  });

  it("applies correct styling to failed count", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: false }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    const failedText = screen.getByText("Failed: 1");
    expect(failedText).toHaveClass("text-red-400");
  });

  it("renders checkmark icon in title", () => {
    const mockHistory = [
      {
        language: "JavaScript",
        results: [{ pass: true }],
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
        results: [{ pass: true }],
      },
      {
        language: "Lang2",
        results: [{ pass: true }],
      },
      {
        language: "Lang3",
        results: [{ pass: true }],
      },
    ];

    render(<CodeEditorSubmissionResults submissionHistory={mockHistory} />);

    // Should show #3, #2, #1 (in reverse order)
    expect(screen.getByText("#3")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });
});
