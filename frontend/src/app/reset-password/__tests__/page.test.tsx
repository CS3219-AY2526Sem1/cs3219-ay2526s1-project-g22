import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ResetPasswordPage from "../page";
import { createClient } from "@/lib/supabase/supabase-client";
import {
  validatePassword,
  validatePasswordRequirements,
} from "@/utils/password-helper";
import { showToast } from "@/utils/toast-helper";
import { useRouter } from "next/navigation";

// Mock the modules
jest.mock("@/lib/supabase/supabase-client");
jest.mock("@/utils/password-helper");
jest.mock("@/utils/toast-helper");
jest.mock("next/navigation");

describe("ResetPasswordPage", () => {
  const mockUpdateUser = jest.fn();
  const mockSupabase = {
    auth: {
      updateUser: mockUpdateUser,
    },
  };
  const mockPush = jest.fn();
  const mockRouter = {
    push: mockPush,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (showToast as jest.Mock).mockImplementation(() => {});
    (validatePasswordRequirements as jest.Mock).mockReturnValue({
      length: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });
  });

  it("renders the reset password form", () => {
    render(<ResetPasswordPage />);

    expect(screen.getByText("Reset Password")).toBeInTheDocument();
    expect(screen.getByLabelText("New Password")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter your new password")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update Password" })
    ).toBeInTheDocument();
  });

  it("updates password input when user types", () => {
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(
      "New Password"
    ) as HTMLInputElement;
    fireEvent.change(passwordInput, { target: { value: "NewPassword123!" } });

    expect(passwordInput.value).toBe("NewPassword123!");
  });

  it("calls validatePasswordRequirements when password changes", () => {
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    fireEvent.change(passwordInput, { target: { value: "Test123!" } });

    expect(validatePasswordRequirements).toHaveBeenCalledWith("Test123!");
  });

  it("displays password requirements when password is entered", () => {
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");

    // Initially, requirements should not be visible
    expect(
      screen.queryByText(/At least 15 characters/)
    ).not.toBeInTheDocument();

    // Type password to show requirements
    fireEvent.change(passwordInput, { target: { value: "test" } });

    expect(screen.getByText(/At least 15 characters/)).toBeInTheDocument();
    expect(
      screen.getByText(/At least one uppercase letter/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/At least one lowercase letter/)
    ).toBeInTheDocument();
    expect(screen.getByText(/At least one number/)).toBeInTheDocument();
    expect(
      screen.getByText(/At least one special character/)
    ).toBeInTheDocument();
  });

  it("shows green checkmarks for met password requirements", () => {
    (validatePasswordRequirements as jest.Mock).mockReturnValue({
      length: true,
      hasUppercase: true,
      hasLowercase: true,
      hasNumber: true,
      hasSpecialChar: true,
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    fireEvent.change(passwordInput, {
      target: { value: "ValidPassword123!" },
    });

    const requirements = [
      screen.getByText(/✔ At least 15 characters/),
      screen.getByText(/✔ At least one uppercase letter/),
      screen.getByText(/✔ At least one lowercase letter/),
      screen.getByText(/✔ At least one number/),
      screen.getByText(/✔ At least one special character/),
    ];

    expect(requirements).toHaveLength(5);

    requirements.forEach((req) => {
      expect(req).toHaveClass("text-green-500");
    });
  });

  it("shows red crosses for unmet password requirements", () => {
    (validatePasswordRequirements as jest.Mock).mockReturnValue({
      length: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    fireEvent.change(passwordInput, { target: { value: "weak" } });

    const requirements = [
      screen.getByText(/✘ At least 15 characters/),
      screen.getByText(/✘ At least one uppercase letter/),
      screen.getByText(/✘ At least one lowercase letter/),
      screen.getByText(/✘ At least one number/),
      screen.getByText(/✘ At least one special character/),
    ];

    expect(requirements).toHaveLength(5);

    requirements.forEach((req) => {
      expect(req).toHaveClass("text-red-500");
    });
  });

  it("shows partially met requirements", () => {
    (validatePasswordRequirements as jest.Mock).mockReturnValue({
      length: true,
      hasUppercase: true,
      hasLowercase: false,
      hasNumber: false,
      hasSpecialChar: false,
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    fireEvent.change(passwordInput, { target: { value: "TESTPASSWORD" } });

    // Check met requirements (green checkmarks)
    expect(screen.getByText(/✔ At least 15 characters/)).toHaveClass(
      "text-green-500"
    );
    expect(screen.getByText(/✔ At least one uppercase letter/)).toHaveClass(
      "text-green-500"
    );

    // Check unmet requirements (red crosses)
    expect(screen.getByText(/✘ At least one lowercase letter/)).toHaveClass(
      "text-red-500"
    );
    expect(screen.getByText(/✘ At least one number/)).toHaveClass(
      "text-red-500"
    );
    expect(screen.getByText(/✘ At least one special character/)).toHaveClass(
      "text-red-500"
    );
  });

  it("displays loading state when submitting form", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    mockUpdateUser.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    );

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    fireEvent.change(passwordInput, {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(submitButton);

    expect(screen.getByText("Updating...")).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Update Password")).toBeInTheDocument();
    });
  });

  it("validates password before submitting", async () => {
    const errorMessage = "Password is too weak";
    (validatePassword as jest.Mock).mockReturnValue(errorMessage);

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    fireEvent.change(passwordInput, { target: { value: "weak" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(validatePassword).toHaveBeenCalledWith("weak");
      expect(showToast).toHaveBeenCalledWith(errorMessage, { success: false });
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("updates password successfully", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    fireEvent.change(passwordInput, {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "ValidPassword123!",
      });
    });

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith("Password updated successfully!", {
        success: true,
      });
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("displays error when password update fails", async () => {
    const errorMessage = "Failed to update password";
    (validatePassword as jest.Mock).mockReturnValue(null);
    mockUpdateUser.mockResolvedValue({ error: { message: errorMessage } });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    fireEvent.change(passwordInput, {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(
        "Error updating password: " + errorMessage,
        { success: false }
      );
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("prevents form submission when password is empty", () => {
    render(<ResetPasswordPage />);

    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    fireEvent.click(submitButton);

    // The HTML5 required attribute should prevent submission
    expect(mockUpdateUser).not.toHaveBeenCalled();
  });

  it("re-enables form fields after successful submission", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(
      "New Password"
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    }) as HTMLButtonElement;

    fireEvent.change(passwordInput, {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(submitButton);

    // During loading
    await waitFor(() => {
      expect(screen.getByText("Updating...")).toBeInTheDocument();
    });

    // After completion
    await waitFor(() => {
      expect(passwordInput.disabled).toBe(false);
      expect(submitButton.disabled).toBe(false);
    });
  });

  it("re-enables form fields after failed submission", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    mockUpdateUser.mockResolvedValue({ error: { message: "Error" } });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(
      "New Password"
    ) as HTMLInputElement;
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    }) as HTMLButtonElement;

    fireEvent.change(passwordInput, {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(submitButton);

    // During loading
    await waitFor(() => {
      expect(screen.getByText("Updating...")).toBeInTheDocument();
    });

    // After completion
    await waitFor(() => {
      expect(passwordInput.disabled).toBe(false);
      expect(submitButton.disabled).toBe(false);
    });
  });

  it("calls Supabase updateUser with correct password", async () => {
    (validatePassword as jest.Mock).mockReturnValue(null);
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    const testPassword = "MySecurePassword123!@#";
    fireEvent.change(passwordInput, { target: { value: testPassword } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: testPassword });
    });
  });

  it("handles validation error and continues after entering valid password", async () => {
    const errorMessage = "Password too weak";
    (validatePassword as jest.Mock)
      .mockReturnValueOnce(errorMessage)
      .mockReturnValueOnce(null);
    mockUpdateUser.mockResolvedValue({ error: null });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText("New Password");
    const submitButton = screen.getByRole("button", {
      name: "Update Password",
    });

    // First submission with weak password
    fireEvent.change(passwordInput, { target: { value: "weak" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(showToast).toHaveBeenCalledWith(errorMessage, { success: false });
    });

    // Second submission with strong password
    fireEvent.change(passwordInput, {
      target: { value: "StrongPassword123!" },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: "StrongPassword123!",
      });
      expect(showToast).toHaveBeenCalledWith("Password updated successfully!", {
        success: true,
      });
    });
  });

  it("does not show requirements list when password is empty", () => {
    render(<ResetPasswordPage />);

    expect(
      screen.queryByText(/At least 15 characters/)
    ).not.toBeInTheDocument();
  });
});
