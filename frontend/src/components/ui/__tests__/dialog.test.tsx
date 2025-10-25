import { render, screen } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../dialog";

// Mock Radix UI Dialog components
jest.mock("@radix-ui/react-dialog", () => ({
  Root: ({
    children,
    open,
  }: {
    children: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <div data-testid="dialog-root" data-open={open}>
      {children}
    </div>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-portal">{children}</div>
  ),
  Overlay: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid="dialog-overlay" className={className} {...props}>
      {children}
    </div>
  ),
  Content: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="dialog-content" className={className} {...props}>
      {children}
    </div>
  ),
  Close: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => (
    <button data-testid="dialog-close" className={className} {...props}>
      {children}
    </button>
  ),
  Trigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button data-testid="dialog-trigger" {...props}>
      {children}
    </button>
  ),
  Title: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <h2 data-testid="dialog-title" className={className} {...props}>
      {children}
    </h2>
  ),
  Description: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <p data-testid="dialog-description" className={className} {...props}>
      {children}
    </p>
  ),
}));

describe("Dialog", () => {
  describe("Dialog component", () => {
    it("renders dialog root", () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-root")).toBeInTheDocument();
    });

    it("handles open state", () => {
      render(
        <Dialog open={true}>
          <DialogTrigger>Open</DialogTrigger>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-root")).toHaveAttribute(
        "data-open",
        "true"
      );
    });
  });

  describe("DialogTrigger component", () => {
    it("renders dialog trigger button", () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-trigger")).toBeInTheDocument();
      expect(screen.getByText("Open Dialog")).toBeInTheDocument();
    });
  });

  describe("DialogContent component", () => {
    it("renders dialog content", () => {
      render(
        <Dialog>
          <DialogContent>Content here</DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      render(
        <Dialog>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId("dialog-content");
      expect(content).toHaveClass(
        "bg-background",
        "data-[state=open]:animate-in",
        "grid",
        "w-full",
        "border",
        "p-6",
        "shadow-lg"
      );
    });

    it("applies custom className", () => {
      render(
        <Dialog>
          <DialogContent className="custom-content">Content</DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-content")).toHaveClass(
        "custom-content"
      );
    });

    it("renders close button", () => {
      render(
        <Dialog>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      expect(screen.getByTestId("dialog-close")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Dialog>
          <DialogContent>Content</DialogContent>
        </Dialog>
      );

      const content = screen.getByTestId("dialog-content");
      expect(content).toHaveAttribute("data-slot", "dialog-content");
    });
  });

  describe("DialogHeader component", () => {
    it("renders dialog header", () => {
      const { container } = render(
        <Dialog>
          <DialogContent>
            <DialogHeader>Header content</DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = container.querySelector('[data-slot="dialog-header"]');
      expect(header).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(
        <Dialog>
          <DialogContent>
            <DialogHeader>Header</DialogHeader>
          </DialogContent>
        </Dialog>
      );

      const header = container.querySelector('[data-slot="dialog-header"]');
      expect(header).toHaveClass("flex", "flex-col", "text-center");
    });
  });

  describe("DialogFooter component", () => {
    it("renders dialog footer", () => {
      const { container } = render(
        <Dialog>
          <DialogContent>
            <DialogFooter>Footer content</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = container.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(
        <Dialog>
          <DialogContent>
            <DialogFooter>Footer</DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const footer = container.querySelector('[data-slot="dialog-footer"]');
      expect(footer).toHaveClass("flex", "flex-col-reverse");
    });
  });

  describe("DialogTitle component", () => {
    it("renders dialog title", () => {
      render(
        <Dialog>
          <DialogContent>
            <DialogTitle>Dialog Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText("Dialog Title")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Dialog>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByTestId("dialog-title");
      expect(title).toHaveAttribute("data-slot", "dialog-title");
    });

    it("applies default styling classes", () => {
      render(
        <Dialog>
          <DialogContent>
            <DialogTitle>Title</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const title = screen.getByTestId("dialog-title");
      expect(title).toHaveClass("text-lg", "leading-none", "font-semibold");
    });
  });

  describe("DialogDescription component", () => {
    it("renders dialog description", () => {
      render(
        <Dialog>
          <DialogContent>
            <DialogDescription>Dialog description text</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText("Dialog description text")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      render(
        <Dialog>
          <DialogContent>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByTestId("dialog-description");
      expect(description).toHaveAttribute("data-slot", "dialog-description");
    });

    it("applies default styling classes", () => {
      render(
        <Dialog>
          <DialogContent>
            <DialogDescription>Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const description = screen.getByTestId("dialog-description");
      expect(description).toHaveClass("text-muted-foreground", "text-sm");
    });
  });

  describe("Complete Dialog structure", () => {
    it("renders complete dialog with all components", () => {
      render(
        <Dialog>
          <DialogTrigger>Open</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button>Cancel</button>
              <button>Continue</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("Are you sure?")).toBeInTheDocument();
      expect(
        screen.getByText("This action cannot be undone.")
      ).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Continue")).toBeInTheDocument();
    });
  });
});
