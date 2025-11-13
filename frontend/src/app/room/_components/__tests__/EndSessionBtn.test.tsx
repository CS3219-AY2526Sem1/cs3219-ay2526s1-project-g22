/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini
Date: 2025-10-21
Scope: Suggested tests covering edge cases highlighted by the user.
Author review: I verified correctness of the modifications by AI against requirements and modofied behvaiour of a couple fo test cases for clarity
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import EndSessionButton from "../EndSessionBtn";
import axiosInstance from "@/lib/axios";
import { useRealtime } from "../../contexts/realtime-context";
import { useRouter } from "next/navigation";

// Mock dependencies
jest.mock("@/lib/axios");
jest.mock("../../contexts/realtime-context");
jest.mock("next/navigation");

// Mock the Button component
jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

describe("EndSessionButton", () => {
  const mockEndSession = jest.fn();
  const mockPush = jest.fn();
  const mockAxiosPatch = axiosInstance.patch as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRealtime as jest.Mock).mockReturnValue({
      endSession: mockEndSession,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    // Component now uses an in-UI modal for confirmation and error display.
    global.confirm = jest.fn();
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the End Session button", () => {
    render(<EndSessionButton sessionId="test-session-123" />);

    expect(
      screen.getByRole("button", { name: "End Session" })
    ).toBeInTheDocument();
  });

  it("shows confirmation dialog when button is clicked", () => {
    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    // Modal should appear with confirmation text
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("End collaboration session?")).toBeInTheDocument();
  });

  it("does not end session when confirmation is cancelled", () => {
    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    // Click Cancel inside the modal
    const cancel = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancel);

    expect(mockAxiosPatch).not.toHaveBeenCalled();
    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("ends session successfully when confirmed", async () => {
    mockAxiosPatch.mockResolvedValue({ status: 200 });

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    // Confirm in modal (scope to the dialog to disambiguate identical button labels)
    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "End Session" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        "/api/collaboration-service/sessions/test-session-123/complete"
      );
    });

    await waitFor(() => {
      expect(mockEndSession).toHaveBeenCalled();
    });
  });

  it("displays loading state while ending session", async () => {
    // Component shows modal; click to open and then confirm
    mockAxiosPatch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 200 }), 100)
        )
    );
    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    // Scope to dialog and check disabled state while pending
    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "End Session" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(confirmBtn.disabled).toBe(true);
    });

    // After the request resolves the dialog should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    mockAxiosPatch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 200 }), 100)
        )
    );

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    const dialog = screen.getByRole("dialog");
    const modalConfirm = within(dialog).getByRole("button", { name: "End Session" }) as HTMLButtonElement;

    fireEvent.click(modalConfirm);

    await waitFor(() => {
      expect(modalConfirm.disabled).toBe(true);
    });

    // After success the dialog should be removed (confirm is no longer in DOM)
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    mockAxiosPatch.mockRejectedValue(new Error("Network error"));
    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);
    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "End Session" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
      expect(screen.getByText("Failed to end session. Please try again.")).toBeInTheDocument();
    });

    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("re-enables button after error", async () => {
    mockAxiosPatch.mockRejectedValue(new Error("Network error"));

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);
    const dialog = screen.getByRole("dialog");
    const confirmBtn = within(dialog).getByRole("button", { name: "End Session" }) as HTMLButtonElement;
    fireEvent.click(confirmBtn);

    // After error, error dialog is shown and the main trigger remains enabled
    await waitFor(() => {
      expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    });

    // The main trigger button (outside dialog) should remain enabled
    const mainTrigger = screen.getAllByRole("button", { name: "End Session" })[0] as HTMLButtonElement;
    expect(mainTrigger.disabled).toBe(false);
  });

  it("uses correct session ID in API call", async () => {
    mockAxiosPatch.mockResolvedValue({ status: 200 });

    render(<EndSessionButton sessionId="different-session-id" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);
    const confirmBtn = screen.getAllByText("End Session")[1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        "/api/collaboration-service/sessions/different-session-id/complete"
      );
    });
  });

  it("broadcasts end session after successful API call", async () => {
    mockAxiosPatch.mockResolvedValue({ status: 200 });

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);
    const confirmBtn = screen.getAllByText("End Session")[1];
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockEndSession).toHaveBeenCalledTimes(1);
    });
  });

  it("accepts additional button props", () => {
    render(
      <EndSessionButton
        sessionId="test-session-123"
        className="custom-class"
        data-testid="custom-test-id"
      />
    );

    const button = screen.getByRole("button", { name: "End Session" });
    expect(button).toHaveClass("custom-class");
    expect(button).toHaveAttribute("data-testid", "custom-test-id");
  });
});
