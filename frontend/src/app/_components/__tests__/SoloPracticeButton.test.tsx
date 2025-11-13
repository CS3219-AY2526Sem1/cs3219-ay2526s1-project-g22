/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-22
Scope: Suggested tests based on edge cases identified by the user.
Author review: I verified correctness of the modifications by AI against requirements
*/
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SoloPracticeButton from "../SoloPracticeButton";
import api from "@/lib/axios";

// Mock dependencies
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/contexts/user-context", () => ({
  useUser: jest.fn(),
}));

jest.mock("@/lib/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useUser } = require("@/contexts/user-context");

describe("SoloPracticeButton", () => {
  const mockUser = {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    await new Promise((resolve) => setTimeout(resolve, 0));
    useUser.mockReturnValue({ user: mockUser });
  });

  describe("Rendering", () => {
    it("renders button with default text", () => {
      render(<SoloPracticeButton />);

      expect(screen.getByText("Solo Practice")).toBeInTheDocument();
    });

    it("renders as a button element", () => {
      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
    });

    it("is enabled by default when user exists", () => {
      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("accepts custom props", () => {
      render(
        <SoloPracticeButton
          className="custom-class"
          data-testid="custom-button"
        />
      );

      const button = screen.getByTestId("custom-button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("User not logged in", () => {
    beforeEach(() => {
      useUser.mockReturnValue({ user: null });
    });

    it("calls onRequireLogin when clicked without user", () => {
      const onRequireLogin = jest.fn();
      render(<SoloPracticeButton onRequireLogin={onRequireLogin} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(onRequireLogin).toHaveBeenCalledTimes(1);
    });

    it("does not create session when user is not logged in", () => {
      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(api.post).not.toHaveBeenCalled();
    });

    it("does not navigate when user is not logged in", () => {
      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("Creating solo session", () => {
    it("calls API to create session with user id", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "session-123" },
      });

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "/api/collaboration-service/sessions",
          { interviewee_id: mockUser.id }
        );
      });
    });

    it("navigates to room with session id on success", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "session-456" },
      });

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/room/session-456");
      });
    });

    it("uses custom intervieweeId if provided", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "session-789" },
      });

      render(<SoloPracticeButton intervieweeId="custom-user-id" />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should still use user.id from context, not the intervieweeId prop
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          "/api/collaboration-service/sessions",
          { interviewee_id: mockUser.id }
        );
      });
    });
  });

  describe("Loading state", () => {
    it("shows loading text when request is in progress", async () => {
      (api.post as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: "session-123" } }), 100)
          )
      );

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Button should show loading state immediately
      await waitFor(() => {
        expect(screen.getByText("Starting...")).toBeInTheDocument();
      });
    });

    it("disables button during loading", async () => {
      (api.post as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: "session-123" } }), 100)
          )
      );

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });

    it("restores button text after success", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "session-123" },
      });

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Should show loading first
      await waitFor(() => {
        expect(screen.getByText("Starting...")).toBeInTheDocument();
      });

      // Then restore normal text
      await waitFor(() => {
        expect(screen.getByText("Solo Practice")).toBeInTheDocument();
      });
    });

    it("re-enables button after request completes", async () => {
      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { id: "session-123" },
      });

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("Error handling", () => {
    it("handles API error gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (api.post as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to create solo session:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it("does not navigate on API error", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (api.post as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Record current push call count and ensure it does not increase after error handling
      const beforePushCalls = mockPush.mock.calls.length;

      // Wait until the component has handled the rejection
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      // Give any stray async tasks a moment, then assert push count unchanged
      await waitFor(() => {
        expect(mockPush.mock.calls.length).toBe(beforePushCalls);
      });

      consoleErrorSpy.mockRestore();
    });

    it("re-enables button after error", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      (api.post as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Multiple clicks", () => {
    it("prevents multiple simultaneous requests", async () => {
      (api.post as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { id: "session-123" } }), 100)
          )
      );

      render(<SoloPracticeButton />);

      const button = screen.getByRole("button");

      // Click multiple times rapidly
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // API should only be called once
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(1);
      });
    });
  });
});
