/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 2025-09-20
Scope: Suggested tests covering a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements and resolved minor test failures.
*/
import { render, screen } from "@testing-library/react";
import { Badge } from "../badge";

describe("Badge", () => {
  describe("Rendering", () => {
    it("renders badge with text", () => {
      render(<Badge>Test Badge</Badge>);

      expect(screen.getByText("Test Badge")).toBeInTheDocument();
    });

    it("renders as span element by default", () => {
      const { container } = render(<Badge>Test</Badge>);

      const badge = container.querySelector("span");
      expect(badge).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      const { container } = render(<Badge>Test</Badge>);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("renders default variant by default", () => {
      const { container } = render(<Badge>Default</Badge>);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("bg-primary", "text-primary-foreground");
    });

    it("renders secondary variant", () => {
      const { container } = render(
        <Badge variant="secondary">Secondary</Badge>
      );

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("bg-secondary", "text-secondary-foreground");
    });

    it("renders destructive variant", () => {
      const { container } = render(
        <Badge variant="destructive">Destructive</Badge>
      );

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("bg-destructive", "text-white");
    });

    it("renders outline variant", () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("text-foreground");
    });
  });

  describe("Base styling", () => {
    it("applies base badge classes", () => {
      const { container } = render(<Badge>Test</Badge>);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass(
        "inline-flex",
        "items-center",
        "justify-center",
        "rounded-md",
        "border",
        "px-2",
        "py-0.5",
        "text-xs",
        "font-medium"
      );
    });

    it("applies custom className", () => {
      const { container } = render(
        <Badge className="custom-class">Test</Badge>
      );

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("custom-class");
    });
  });

  describe("Children rendering", () => {
    it("renders text children", () => {
      render(<Badge>Simple Text</Badge>);

      expect(screen.getByText("Simple Text")).toBeInTheDocument();
    });

    it("renders JSX children", () => {
      render(
        <Badge>
          <svg data-testid="badge-icon" />
          <span>With Icon</span>
        </Badge>
      );

      expect(screen.getByTestId("badge-icon")).toBeInTheDocument();
      expect(screen.getByText("With Icon")).toBeInTheDocument();
    });
  });

  describe("HTML attributes", () => {
    it("accepts aria attributes", () => {
      const { container } = render(
        <Badge aria-label="Status badge">New</Badge>
      );

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveAttribute("aria-label", "Status badge");
    });

    it("accepts data attributes", () => {
      render(<Badge data-testid="my-badge">Test</Badge>);

      expect(screen.getByTestId("my-badge")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("renders with no children", () => {
      const { container } = render(<Badge />);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it("handles multiple className values", () => {
      const { container } = render(
        <Badge className="class1 class2 class3">Test</Badge>
      );

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("class1", "class2", "class3");
    });
  });

  describe("Accessibility", () => {
    it("applies aria-invalid styling", () => {
      const { container } = render(<Badge aria-invalid="true">Invalid</Badge>);

      const badge = container.querySelector('[data-slot="badge"]');
      expect(badge).toHaveClass("aria-invalid:border-destructive");
    });
  });
});
