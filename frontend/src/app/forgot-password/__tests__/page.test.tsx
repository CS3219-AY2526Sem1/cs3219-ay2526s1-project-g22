import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForgotPasswordPage from "../page";
import { createClient } from "@/lib/supabase/supabase-client";
import { getURL } from "@/utils/url-helper";

// Mock the modules
jest.mock("@/lib/supabase/supabase-client");
jest.mock("@/utils/url-helper");

describe("ForgotPasswordPage", () => {
  const mockResetPasswordForEmail = jest.fn();
  const mockSupabase = {
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (getURL as jest.Mock).mockReturnValue(
      "http://localhost:3000/api/auth/reset-password"
    );
  });

  it("renders the forgot password form", () => {
    render(<ForgotPasswordPage />);

    expect(screen.getByText("Forgot Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send Reset Link" })
    ).toBeInTheDocument();
  });

  it("updates email input when user types", () => {
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(
      "Email Address"
    ) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("displays loading state when submitting form", async () => {
    mockResetPasswordForEmail.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    );

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    expect(screen.getByText("Sending...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Send Reset Link")).toBeInTheDocument();
    });
  });

  it("displays success message when password reset email is sent successfully", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Password reset email sent! Please check your inbox.")
      ).toBeInTheDocument();
    });

    const successMessage = screen.getByText(
      "Password reset email sent! Please check your inbox."
    );
    expect(successMessage).toHaveClass("text-green-600");
  });

  it("displays error message when password reset fails", async () => {
    const errorMessage = "Invalid email address";
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: errorMessage },
    });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, { target: { value: "invalid@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    const errorDiv = screen.getByText(errorMessage);
    expect(errorDiv).toHaveClass("text-red-500");
  });

  it("calls resetPasswordForEmail with correct parameters", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
        "test@example.com",
        {
          redirectTo: "http://localhost:3000/api/auth/reset-password",
        }
      );
    });
  });

  it("prevents form submission when email is empty", () => {
    render(<ForgotPasswordPage />);

    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.click(submitButton);

    // The HTML5 required attribute should prevent submission
    expect(mockResetPasswordForEmail).not.toHaveBeenCalled();
  });

  it("clears previous messages when submitting again", async () => {
    mockResetPasswordForEmail
      .mockResolvedValueOnce({ error: { message: "First error" } })
      .mockResolvedValueOnce({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    // First submission with error
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("First error")).toBeInTheDocument();
    });

    // Second submission with success
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
      expect(
        screen.getByText("Password reset email sent! Please check your inbox.")
      ).toBeInTheDocument();
    });
  });

  it("calls getURL to generate callback URL", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText("Email Address");
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(getURL).toHaveBeenCalledWith("/api/auth/reset-password");
    });
  });

  it("re-enables form fields after successful submission", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(
      "Email Address"
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: "Send Reset Link",
    }) as HTMLButtonElement;

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    // During loading
    await waitFor(() => {
      expect(screen.getByText("Sending...")).toBeInTheDocument();
    });

    // After completion
    await waitFor(() => {
      expect(emailInput.disabled).toBe(false);
      expect(submitButton.disabled).toBe(false);
    });
  });
});
