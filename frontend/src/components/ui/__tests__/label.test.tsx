import { render, screen } from "@testing-library/react";
import { Label } from "../label";

// Mock Radix UI Label
jest.mock("@radix-ui/react-label", () => ({
  Root: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <label data-testid="label-root" className={className} {...props}>
      {children}
    </label>
  ),
}));

describe("Label", () => {
  describe("Rendering", () => {
    it("renders label element", () => {
      render(<Label>Label text</Label>);

      expect(screen.getByText("Label text")).toBeInTheDocument();
    });

    it("renders with htmlFor attribute", () => {
      render(<Label htmlFor="input-id">Username</Label>);

      const label = screen.getByTestId("label-root");
      expect(label).toHaveAttribute("for", "input-id");
    });

    it("has data-slot attribute", () => {
      const { container } = render(<Label>Test</Label>);

      const label = container.querySelector('[data-slot="label"]');
      expect(label).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies default styling classes", () => {
      render(<Label>Label</Label>);

      const label = screen.getByTestId("label-root");
      expect(label).toHaveClass(
        "flex",
        "items-center",
        "gap-2",
        "text-sm",
        "font-medium",
        "leading-none",
        "select-none",
        "peer-disabled:cursor-not-allowed",
        "peer-disabled:opacity-50"
      );
    });

    it("applies custom className", () => {
      render(<Label className="custom-label">Label</Label>);

      const label = screen.getByTestId("label-root");
      expect(label).toHaveClass("custom-label");
    });
  });

  describe("Disabled state", () => {
    it("applies peer-disabled classes", () => {
      render(<Label>Disabled Label</Label>);

      const label = screen.getByTestId("label-root");
      expect(label).toHaveClass(
        "peer-disabled:cursor-not-allowed",
        "peer-disabled:opacity-50"
      );
    });

    it("applies group disabled classes", () => {
      render(<Label>Group Disabled</Label>);

      const label = screen.getByTestId("label-root");
      expect(label).toHaveClass(
        "group-data-[disabled=true]:pointer-events-none",
        "group-data-[disabled=true]:opacity-50"
      );
    });
  });

  describe("Form integration", () => {
    it("renders with input", () => {
      render(
        <div>
          <Label htmlFor="email">Email</Label>
          <input id="email" type="email" />
        </div>
      );

      const label = screen.getByTestId("label-root");
      const input = document.querySelector("#email");
      expect(label).toHaveAttribute("for", "email");
      expect(input).toBeInTheDocument();
    });

    it("renders multiple labels", () => {
      render(
        <div>
          <Label htmlFor="first">First Name</Label>
          <Label htmlFor="last">Last Name</Label>
        </div>
      );

      expect(screen.getByText("First Name")).toBeInTheDocument();
      expect(screen.getByText("Last Name")).toBeInTheDocument();
    });
  });

  describe("Children rendering", () => {
    it("renders text children", () => {
      render(<Label>Simple Text</Label>);

      expect(screen.getByText("Simple Text")).toBeInTheDocument();
    });

    it("renders JSX children", () => {
      render(
        <Label>
          <span>Required</span>
          <span className="text-red-500">*</span>
        </Label>
      );

      expect(screen.getByText("Required")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("associates label with input via htmlFor", () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" />
        </div>
      );

      const label = screen.getByTestId("label-root");
      const input = container.querySelector("#test-input");
      expect(label).toHaveAttribute("for", "test-input");
      expect(input).toHaveAttribute("id", "test-input");
    });
  });

  describe("Edge cases", () => {
    it("renders with empty children", () => {
      const { container } = render(<Label />);

      const label = container.querySelector('[data-slot="label"]');
      expect(label).toBeInTheDocument();
    });

    it("handles multiple className values", () => {
      render(<Label className="class1 class2">Label</Label>);

      const label = screen.getByTestId("label-root");
      expect(label).toHaveClass("class1", "class2");
    });
  });
});
