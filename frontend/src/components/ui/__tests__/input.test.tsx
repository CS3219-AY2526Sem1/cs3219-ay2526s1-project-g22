import { render, screen } from "@testing-library/react";
import { Input } from "../input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders input element", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter text" />);

      expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
    });

    it("renders with value", () => {
      render(<Input value="test value" readOnly />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("test value");
    });
  });

  describe("Input types", () => {
    it("renders as text input by default", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("renders as email input", () => {
      render(<Input type="email" />);

      const input = document.querySelector('input[type="email"]');
      expect(input).toBeInTheDocument();
    });

    it("renders as password input", () => {
      render(<Input type="password" />);

      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it("renders as number input", () => {
      render(<Input type="number" />);

      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies default styling classes", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass(
        "border-input",
        "flex",
        "w-full",
        "rounded-md",
        "border",
        "px-3"
      );
    });

    it("applies custom className", () => {
      render(<Input className="custom-input" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-input");
    });

    it("applies focus-visible classes", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass(
        "focus-visible:border-ring",
        "focus-visible:ring-ring/50"
      );
    });

    it("applies disabled opacity class", () => {
      render(<Input />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass(
        "disabled:cursor-not-allowed",
        "disabled:opacity-50"
      );
    });

    it("applies file input classes", () => {
      render(<Input type="file" />);

      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveClass(
        "file:border-0",
        "file:bg-transparent",
        "file:text-sm",
        "file:font-medium"
      );
    });
  });

  describe("States", () => {
    it("renders disabled input", () => {
      render(<Input disabled />);

      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("renders readonly input", () => {
      render(<Input readOnly />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("readonly");
    });

    it("applies invalid state class", () => {
      render(<Input aria-invalid="true" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("aria-invalid:border-destructive");
    });
  });

  describe("Attributes", () => {
    it("accepts name attribute", () => {
      render(<Input name="username" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "username");
    });

    it("accepts id attribute", () => {
      render(<Input id="email-input" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id", "email-input");
    });

    it("accepts aria-label attribute", () => {
      render(<Input aria-label="Search field" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label", "Search field");
    });

    it("accepts maxLength attribute", () => {
      render(<Input maxLength={100} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("maxLength", "100");
    });

    it("accepts pattern attribute", () => {
      render(<Input pattern="[0-9]*" />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("pattern", "[0-9]*");
    });

    it("accepts required attribute", () => {
      render(<Input required />);

      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });
  });

  describe("Edge cases", () => {
    it("renders with empty string value", () => {
      render(<Input value="" readOnly />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("handles very long className", () => {
      const longClassName = "class1 class2 class3 class4 class5";
      render(<Input className={longClassName} />);

      const input = screen.getByRole("textbox");
      expect(input).toHaveClass(
        "class1",
        "class2",
        "class3",
        "class4",
        "class5"
      );
    });
  });
});
