import { render } from "@testing-library/react";
import { Separator } from "../separator";

// Mock Radix UI Separator
jest.mock("@radix-ui/react-separator", () => ({
  Root: ({
    className,
    orientation = "horizontal",
    decorative = true,
    ...props
  }: {
    className?: string;
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
  }) => (
    <div
      data-testid="separator-root"
      data-orientation={orientation}
      role={decorative ? "none" : "separator"}
      aria-orientation={!decorative ? orientation : undefined}
      className={className}
      {...props}
    />
  ),
}));

describe("Separator", () => {
  describe("Rendering", () => {
    it("renders separator", () => {
      const { container } = render(<Separator />);

      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toBeInTheDocument();
    });

    it("renders as decorative by default", () => {
      const { getByTestId } = render(<Separator />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("role", "none");
    });
  });

  describe("Orientations", () => {
    it("renders horizontal separator by default", () => {
      const { getByTestId } = render(<Separator />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders horizontal separator with classes", () => {
      const { getByTestId } = render(<Separator orientation="horizontal" />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveClass(
        "data-[orientation=horizontal]:h-px",
        "data-[orientation=horizontal]:w-full"
      );
    });

    it("renders vertical separator", () => {
      const { getByTestId } = render(<Separator orientation="vertical" />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
    });

    it("renders vertical separator with classes", () => {
      const { getByTestId } = render(<Separator orientation="vertical" />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveClass(
        "data-[orientation=vertical]:h-full",
        "data-[orientation=vertical]:w-px"
      );
    });
  });

  describe("Styling", () => {
    it("applies base styling classes", () => {
      const { getByTestId } = render(<Separator />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveClass("bg-border", "shrink-0");
    });

    it("applies custom className", () => {
      const { getByTestId } = render(
        <Separator className="custom-separator" />
      );

      const separator = getByTestId("separator-root");
      expect(separator).toHaveClass("custom-separator");
    });

    it("has data-slot attribute", () => {
      const { container } = render(<Separator />);

      const separator = container.querySelector('[data-slot="separator"]');
      expect(separator).toBeInTheDocument();
    });
  });

  describe("Decorative prop", () => {
    it("renders as decorative when decorative is true", () => {
      const { getByTestId } = render(<Separator decorative={true} />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("role", "none");
    });

    it("renders with semantic role when decorative is false", () => {
      const { getByTestId } = render(<Separator decorative={false} />);

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("role", "separator");
      expect(separator).toHaveAttribute("aria-orientation", "horizontal");
    });
  });

  describe("Edge cases", () => {
    it("combines custom className with default classes", () => {
      const { getByTestId } = render(
        <Separator className="my-custom-class another-class" />
      );

      const separator = getByTestId("separator-root");
      expect(separator).toHaveClass(
        "my-custom-class",
        "another-class",
        "bg-border"
      );
    });

    it("handles vertical orientation with custom className", () => {
      const { getByTestId } = render(
        <Separator orientation="vertical" className="custom-vertical" />
      );

      const separator = getByTestId("separator-root");
      expect(separator).toHaveClass("custom-vertical");
    });
  });

  describe("Usage in layouts", () => {
    it("renders horizontal separator in flex container", () => {
      const { getByTestId } = render(
        <div className="flex flex-col">
          <div>Content Above</div>
          <Separator />
          <div>Content Below</div>
        </div>
      );

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders vertical separator in horizontal layout", () => {
      const { getByTestId } = render(
        <div className="flex flex-row">
          <div>Left Content</div>
          <Separator orientation="vertical" />
          <div>Right Content</div>
        </div>
      );

      const separator = getByTestId("separator-root");
      expect(separator).toHaveAttribute("data-orientation", "vertical");
    });
  });
});
