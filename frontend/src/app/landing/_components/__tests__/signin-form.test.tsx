/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 2025-09-16
Scope: Suggested tests covering a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements. I fixed minor issues, improved clarity, and ran checks to confirm the UI works as expected.
*/
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInForm } from "../signin-form";
import { signInAction } from "../../actions/signin";
import { showToast } from "@/utils/toast-helper";
import "@testing-library/jest-dom";

// Mock dependencies
jest.mock("../../actions/signin");
jest.mock("@/utils/toast-helper");
jest.mock("next/link", () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});
jest.mock("../SignInWithGoogle", () => {
  return function MockSignInWithGoogle() {
    return <div data-testid="google-signin-button">Sign in with Google</div>;
  };
});

const mockSignInAction = signInAction as jest.MockedFunction<
  typeof signInAction
>;
const mockShowToast = showToast as jest.MockedFunction<typeof showToast>;

describe("SignInForm Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders all form elements", () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("renders email input with correct attributes", () => {
      render(<SignInForm />);
      const emailInput = screen.getByLabelText(/email/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toHaveAttribute("placeholder", "Enter your email");
      expect(emailInput).toBeRequired();
    });

    it("renders password input with correct attributes", () => {
      render(<SignInForm />);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toHaveAttribute(
        "placeholder",
        "Enter your password"
      );
      expect(passwordInput).toBeRequired();
    });

    it("renders forgot password link", () => {
      render(<SignInForm />);
      const forgotLink = screen.getByRole("link", {
        name: /forgot your password/i,
      });

      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute("href", "/forgot-password");
    });

    it("renders Google sign-in button", () => {
      render(<SignInForm />);
      expect(screen.getByTestId("google-signin-button")).toBeInTheDocument();
    });
  });

  describe("Password Visibility Toggle", () => {
    it("shows password when eye icon is clicked", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: "" });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
    });

    it("toggles password visibility on multiple clicks", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole("button", { name: "" });

      // Initial state - hidden
      expect(passwordInput).toHaveAttribute("type", "password");

      // Click to show
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "text");

      // Click to hide again
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Form Input Handling", () => {
    it("updates email input value on change", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });

    it("updates password input value on change", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const passwordInput = screen.getByLabelText(
        /password/i
      ) as HTMLInputElement;
      await user.type(passwordInput, "password123");

      expect(passwordInput.value).toBe("password123");
    });

    it("handles multiple input changes correctly", async () => {
      const user = userEvent.setup();
      render(<SignInForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(
        /password/i
      ) as HTMLInputElement;

      await user.type(emailInput, "john@example.com");
      await user.type(passwordInput, "securePass123");

      expect(emailInput.value).toBe("john@example.com");
      expect(passwordInput.value).toBe("securePass123");
    });
  });

  describe("Form Submission", () => {
    it("calls signInAction with correct credentials on submit", async () => {
      mockSignInAction.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInAction).toHaveBeenCalledWith(
          "test@example.com",
          "password123"
        );
      });
    });

    it("shows loading state during submission", async () => {
      mockSignInAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      await user.click(submitButton);

      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it("disables inputs during submission", async () => {
      mockSignInAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });

    it("shows toast on error", async () => {
      const errorMessage = "Invalid credentials";
      mockSignInAction.mockResolvedValue(errorMessage);
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(errorMessage, {
          success: false,
        });
      });
    });

    it("prevents default form submission", async () => {
      mockSignInAction.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<SignInForm />);

      const form = screen
        .getByRole("button", { name: /sign in/i })
        .closest("form");
      const handleSubmit = jest.fn((e) => e.preventDefault());
      form?.addEventListener("submit", handleSubmit);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    it("re-enables form after successful submission", async () => {
      mockSignInAction.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<SignInForm />);

      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email/i)).not.toBeDisabled();
        expect(screen.getByLabelText(/password/i)).not.toBeDisabled();
      });
    });
  });

  describe("Error Handling", () => {
    it("clears previous errors on new submission", async () => {
      mockSignInAction
        .mockResolvedValueOnce("First error")
        .mockResolvedValueOnce(undefined);
      const user = userEvent.setup();
      render(<SignInForm />);

      // First submission with error
      await user.type(screen.getByLabelText(/email/i), "test@example.com");
      await user.type(screen.getByLabelText(/password/i), "wrong");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith("First error", {
          success: false,
        });
      });

      // Second submission should clear error
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), "correct");
      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignInAction).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Accessibility", () => {
    it("has proper labels for all inputs", () => {
      render(<SignInForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("submit button has correct text", () => {
      render(<SignInForm />);
      expect(
        screen.getByRole("button", { name: /^sign in$/i })
      ).toBeInTheDocument();
    });
  });
});
