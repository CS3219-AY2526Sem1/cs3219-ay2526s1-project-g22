/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    expect(global.confirm).toHaveBeenCalledWith("End session for all users?");
  });

  it("does not end session when confirmation is cancelled", () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    expect(mockAxiosPatch).not.toHaveBeenCalled();
    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("ends session successfully when confirmed", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockResolvedValue({ status: 200 });

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

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
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 200 }), 100)
        )
    );

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Ending...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("End Session")).toBeInTheDocument();
    });
  });

  it("disables button while loading", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: 200 }), 100)
        )
    );

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", {
      name: "End Session",
    }) as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.disabled).toBe(true);
    });

    await waitFor(() => {
      expect(button.disabled).toBe(false);
    });
  });

  it("handles API error gracefully", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockRejectedValue(new Error("Network error"));

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        "Failed to end session. Please try again."
      );
    });

    expect(mockEndSession).not.toHaveBeenCalled();
  });

  it("re-enables button after error", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockRejectedValue(new Error("Network error"));

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", {
      name: "End Session",
    }) as HTMLButtonElement;
    fireEvent.click(button);

    await waitFor(() => {
      expect(button.disabled).toBe(false);
    });
  });

  it("uses correct session ID in API call", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockResolvedValue({ status: 200 });

    render(<EndSessionButton sessionId="different-session-id" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAxiosPatch).toHaveBeenCalledWith(
        "/api/collaboration-service/sessions/different-session-id/complete"
      );
    });
  });

  it("broadcasts end session after successful API call", async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockAxiosPatch.mockResolvedValue({ status: 200 });

    render(<EndSessionButton sessionId="test-session-123" />);

    const button = screen.getByRole("button", { name: "End Session" });
    fireEvent.click(button);

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
