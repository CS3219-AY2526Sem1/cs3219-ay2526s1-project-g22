/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements and modofied behvaiour of a couple fo test cases for clarity
*/
import { render, screen } from "@testing-library/react";
import CodeEditorHeader from "../CodeEditorHeader";

// Mock the EndSessionBtn component
jest.mock("../EndSessionBtn", () => {
  return function MockEndSessionButton() {
    return <button>End Session</button>;
  };
});

describe("CodeEditorHeader", () => {
  const defaultProps = {
    sessionId: "test-session-123",
    ownUsername: "user-456",
    peerUsername: "peer-123",
    isBlocked: false,
  };

  it("renders session ID correctly", () => {
    render(<CodeEditorHeader {...defaultProps} />);

    expect(screen.getByText("Room:")).toBeInTheDocument();
    expect(screen.getByText("test-session-123")).toBeInTheDocument();
  });

  it("renders user ID correctly", () => {
    render(<CodeEditorHeader {...defaultProps} />);

    expect(screen.getByText(/Online:/)).toBeInTheDocument();
    expect(screen.getByText("user-456 (You)")).toBeInTheDocument();
    expect(screen.getByText("peer-123")).toBeInTheDocument();
  });

  it("displays collaborative status when not blocked", () => {
    render(<CodeEditorHeader {...defaultProps} />);

    expect(screen.getByText("Collaborative")).toBeInTheDocument();
  });

  it("displays read-only status when blocked", () => {
    render(<CodeEditorHeader {...defaultProps} isBlocked={true} />);

    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });

  it("applies emerald color classes when not blocked", () => {
    const { container } = render(<CodeEditorHeader {...defaultProps} />);

    const statusIndicator = container.querySelector(".bg-emerald-500");
    expect(statusIndicator).toBeInTheDocument();

    const statusText = screen.getByText("Collaborative");
    expect(statusText).toHaveClass("text-emerald-400");
  });

  it("applies amber color classes when blocked", () => {
    const { container } = render(
      <CodeEditorHeader {...defaultProps} isBlocked={true} />
    );

    const statusIndicator = container.querySelector(".bg-amber-500");
    expect(statusIndicator).toBeInTheDocument();

    const statusText = screen.getByText("Read-only");
    expect(statusText).toHaveClass("text-amber-400");
  });

  it("renders EndSessionButton component", () => {
    render(<CodeEditorHeader {...defaultProps} />);

    expect(screen.getByText("End Session")).toBeInTheDocument();
  });

  it("displays session ID with correct styling", () => {
    render(<CodeEditorHeader {...defaultProps} />);

    const sessionIdElement = screen.getByText("test-session-123");
    expect(sessionIdElement).toHaveClass("font-medium", "text-blue-400");
  });

  it("displays user ID with correct styling", () => {
    render(<CodeEditorHeader {...defaultProps} />);

    const userIdElement = screen.getByText("user-456 (You)");
    expect(userIdElement).toHaveClass("font-medium", "text-emerald-400");
  });

  it("renders status indicator as a circular element", () => {
    const { container } = render(<CodeEditorHeader {...defaultProps} />);

    const statusIndicator = container.querySelector(".w-2.h-2.rounded-full");
    expect(statusIndicator).toBeInTheDocument();
  });

  it("handles different session IDs", () => {
    render(<CodeEditorHeader {...defaultProps} sessionId="another-session" />);

    expect(screen.getByText("another-session")).toBeInTheDocument();
  });

  it("handles different user IDs", () => {
    render(
      <CodeEditorHeader {...defaultProps} ownUsername="different-user" />
    );

    expect(screen.getByText("different-user (You)")).toBeInTheDocument();
  });
});
