/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash
Date: 2025-09-16
Scope: Suggested tests based on a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements
*/
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignInWithGoogleButton from "../SignInWithGoogle";
import { createClient } from "@/lib/supabase/supabase-client";
import "@testing-library/jest-dom";

// Mock Supabase client
jest.mock("@/lib/supabase/supabase-client");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockSignInWithOAuth = jest.fn();

describe("SignInWithGoogleButton Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockReturnValue({
      auth: {
        signInWithOAuth: mockSignInWithOAuth,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

  describe("Rendering", () => {
    it("renders the button with correct text", () => {
      render(<SignInWithGoogleButton />);
      expect(screen.getByText("Continue with Google")).toBeInTheDocument();
    });

    it("renders the Google logo SVG", () => {
      const { container } = render(<SignInWithGoogleButton />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("w-5 h-5");
    });

    it('renders the "Or" divider', () => {
      render(<SignInWithGoogleButton />);
      expect(screen.getByText("Or")).toBeInTheDocument();
    });

    it("has correct button styling", () => {
      render(<SignInWithGoogleButton />);
      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });

      expect(button).toHaveClass("w-full");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("bg-white");
    });

    it("button has outline variant", () => {
      render(<SignInWithGoogleButton />);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });
  });

  describe("Google Sign-In Functionality", () => {
    it("calls signInWithOAuth when button is clicked", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
      const user = userEvent.setup();
      render(<SignInWithGoogleButton />);

      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledTimes(1);
      });
    });

    it("calls signInWithOAuth with correct provider", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
      const user = userEvent.setup();
      render(<SignInWithGoogleButton />);

      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: {
            redirectTo: expect.stringContaining("/auth/callback"),
          },
        });
      });
    });

    it("uses correct redirect URL with environment variable", async () => {
      const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
      process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";

      mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
      const user = userEvent.setup();
      render(<SignInWithGoogleButton />);

      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });
      await user.click(button);

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledWith({
          provider: "google",
          options: {
            redirectTo: "https://example.com/auth/callback",
          },
        });
      });

      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    });

    it("handles multiple clicks correctly", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
      const user = userEvent.setup();
      render(<SignInWithGoogleButton />);

      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });
      await user.click(button);
      await user.click(button);

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Visual Components", () => {
    it("renders all Google logo SVG paths", () => {
      const { container } = render(<SignInWithGoogleButton />);
      const paths = container.querySelectorAll("svg path");

      expect(paths).toHaveLength(4); // Google logo has 4 colored paths
    });

    it("renders divider with correct styling", () => {
      const { container } = render(<SignInWithGoogleButton />);
      const divider = container.querySelector(".border-t");

      expect(divider).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("button has proper role", () => {
      render(<SignInWithGoogleButton />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("button is keyboard accessible", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
      const user = userEvent.setup();
      render(<SignInWithGoogleButton />);

      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });
      button.focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(mockSignInWithOAuth).toHaveBeenCalled();
      });
    });

    it("has visible text label", () => {
      render(<SignInWithGoogleButton />);
      expect(screen.getByText("Continue with Google")).toBeVisible();
    });
  });

  describe("Integration with Supabase", () => {
    it("creates Supabase client on button click", async () => {
      mockSignInWithOAuth.mockResolvedValue({ data: null, error: null });
      const user = userEvent.setup();
      render(<SignInWithGoogleButton />);

      const button = screen.getByRole("button", {
        name: /continue with google/i,
      });
      await user.click(button);

      expect(mockCreateClient).toHaveBeenCalled();
    });
  });
});
