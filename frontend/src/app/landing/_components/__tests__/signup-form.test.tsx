/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash
Date: 2025-09-16
Scope: Suggested tests based on a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements 
*/
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignUpForm } from "../signup-form";
import { signUpAction } from "../../actions/signup";
import { showToast } from "@/utils/toast-helper";
import { createClient } from "@/lib/supabase/supabase-client";
import {
  validatePassword,
  validatePasswordRequirements,
} from "@/utils/password-helper";
import "@testing-library/jest-dom";

// Mock dependencies
jest.mock("../../actions/signup");
jest.mock("@/utils/toast-helper");
jest.mock("@/lib/supabase/supabase-client");
jest.mock("@/utils/password-helper");
jest.mock("../SignInWithGoogle", () => {
  return function MockSignInWithGoogle() {
    return <div data-testid="google-signin-button">Sign in with Google</div>;
  };
});

const mockSignUpAction = signUpAction as jest.MockedFunction<
  typeof signUpAction
>;
const mockShowToast = showToast as jest.MockedFunction<typeof showToast>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockValidatePassword = validatePassword as jest.MockedFunction<
  typeof validatePassword
>;
const mockValidatePasswordRequirements =
  validatePasswordRequirements as jest.MockedFunction<
    typeof validatePasswordRequirements
  >;

describe("SignUpForm Component", () => {
  const mockSupabaseClient = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
    mockValidatePasswordRequirements.mockReturnValue({
      length: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });
  });

  describe("Rendering", () => {
    it("renders all form elements", () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it("renders name input with correct attributes", () => {
      render(<SignUpForm />);
      const nameInput = screen.getByLabelText(/^name$/i);

      expect(nameInput).toHaveAttribute("type", "name");
      expect(nameInput).toHaveAttribute("name", "name");
      expect(nameInput).toHaveAttribute("placeholder", "Enter your name");
      expect(nameInput).toBeRequired();
    });

    it("renders email input with correct attributes", () => {
      render(<SignUpForm />);
      const emailInput = screen.getByLabelText(/email/i);

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("name", "email");
      expect(emailInput).toBeRequired();
    });

    it("renders password input with correct attributes", () => {
      render(<SignUpForm />);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("name", "password");
      expect(passwordInput).toBeRequired();
    });

    it("renders Google sign-in button", () => {
      render(<SignUpForm />);
      expect(screen.getByTestId("google-signin-button")).toBeInTheDocument();
    });
  });

  describe("Password Visibility Toggle", () => {
    it("toggles password visibility when eye icon is clicked", async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      const toggleButton = screen.getByRole("button", { name: "" });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");
    });
  });

  describe("Password Requirements Display", () => {
    it("does not show password requirements when password is empty", () => {
      render(<SignUpForm />);
      expect(
        screen.queryByText(/at least 15 characters/i)
      ).not.toBeInTheDocument();
    });

    it("shows password requirements when user starts typing", async () => {
      mockValidatePasswordRequirements.mockReturnValue({
        length: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false,
      });
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "a");

      expect(screen.getByText(/at least 15 characters/i)).toBeInTheDocument();
      expect(
        screen.getByText(/at least one uppercase letter/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/at least one lowercase letter/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
      expect(
        screen.getByText(/at least one special character/i)
      ).toBeInTheDocument();
    });

    it("updates password requirements as user types", async () => {
      mockValidatePasswordRequirements.mockReturnValueOnce({
        length: false,
        hasUppercase: false,
        hasLowercase: true,
        hasNumber: false,
        hasSpecialChar: false,
      });
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "a");

      expect(mockValidatePasswordRequirements).toHaveBeenCalledWith("a");
    });

    it("shows green checkmarks for met requirements", async () => {
      mockValidatePasswordRequirements.mockReturnValue({
        length: true,
        hasUppercase: true,
        hasLowercase: true,
        hasNumber: true,
        hasSpecialChar: true,
      });
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "ValidPassword123!");

      const requirements = screen.getAllByText(/✔/);
      expect(requirements).toHaveLength(5);
    });
  });

  describe("Form Input Handling", () => {
    it("updates name input value on change", async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const nameInput = screen.getByLabelText(/^name$/i) as HTMLInputElement;
      await user.type(nameInput, "John Doe");

      expect(nameInput.value).toBe("John Doe");
    });

    it("updates email input value on change", async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, "john@example.com");

      expect(emailInput.value).toBe("john@example.com");
    });

    it("updates password input value on change", async () => {
      const user = userEvent.setup();
      render(<SignUpForm />);

      const passwordInput = screen.getByLabelText(
        /password/i
      ) as HTMLInputElement;
      await user.type(passwordInput, "SecurePass123!");

      expect(passwordInput.value).toBe("SecurePass123!");
    });
  });

  describe("Form Submission - Duplicate Email Check", () => {
    it("checks for duplicate email before signup", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      mockValidatePassword.mockReturnValue(null);

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("users");
      });
    });

    it("shows error toast when email already exists", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { email: "existing@example.com" },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "existing@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith("Email already exists", {
          success: false,
        });
      });
    });

    it("does not proceed with signup when email exists", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: { email: "existing@example.com" },
        error: null,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "existing@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignUpAction).not.toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission - Password Validation", () => {
    it("validates password before submission", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockValidatePassword.mockReturnValue("Password is too weak");

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "weak");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockValidatePassword).toHaveBeenCalledWith("weak");
      });
    });

    it("shows error toast for invalid password", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockValidatePassword.mockReturnValue(
        "Password must be at least 15 characters"
      );

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "short");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Password must be at least 15 characters",
          {
            success: false,
          }
        );
      });
    });
  });

  describe("Form Submission - Success Flow", () => {
    it("shows success toast before signup action", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockValidatePassword.mockReturnValue(null);
      mockSignUpAction.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          "Sign up successful! Please check your email to confirm your account",
          { success: true }
        );
      });
    });

    it("calls signUpAction with correct parameters", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockValidatePassword.mockReturnValue(null);
      mockSignUpAction.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      await waitFor(() => {
        expect(mockSignUpAction).toHaveBeenCalledWith(
          "john@example.com",
          "SecurePassword123!",
          "John Doe"
        );
      });
    });
  });

  describe("Loading State", () => {
    it("shows loading text during submission", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockValidatePassword.mockReturnValue(null);
      mockSignUpAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });

    it("disables all inputs during submission", async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest
        .fn()
        .mockResolvedValue({ data: null, error: null });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      mockValidatePassword.mockReturnValue(null);
      mockSignUpAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<SignUpForm />);

      await user.type(screen.getByLabelText(/^name$/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/password/i), "SecurePassword123!");

      await user.click(screen.getByRole("button", { name: /sign in/i }));

      expect(screen.getByLabelText(/^name$/i)).toBeDisabled();
      expect(screen.getByLabelText(/email/i)).toBeDisabled();
      expect(screen.getByLabelText(/password/i)).toBeDisabled();
    });
  });

  describe("Accessibility", () => {
    it("has proper labels for all inputs", () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("all inputs have required attribute", () => {
      render(<SignUpForm />);

      expect(screen.getByLabelText(/^name$/i)).toBeRequired();
      expect(screen.getByLabelText(/email/i)).toBeRequired();
      expect(screen.getByLabelText(/password/i)).toBeRequired();
    });
  });
});
