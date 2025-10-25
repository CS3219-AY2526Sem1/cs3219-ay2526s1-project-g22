import { render, screen } from "@testing-library/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../dropdown-menu";

// Mock Radix UI DropdownMenu components
jest.mock("@radix-ui/react-dropdown-menu", () => ({
  Root: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-root">{children}</div>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-portal">{children}</div>
  ),
  Trigger: ({ children, ...props }: { children: React.ReactNode }) => (
    <button data-testid="dropdown-menu-trigger" {...props}>
      {children}
    </button>
  ),
  Content: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="dropdown-menu-content" className={className} {...props}>
      {children}
    </div>
  ),
  Group: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-group" {...props}>
      {children}
    </div>
  ),
  Item: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="dropdown-menu-item" className={className} {...props}>
      {children}
    </div>
  ),
  CheckboxItem: ({
    className,
    children,
    checked,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
    checked?: boolean;
  }) => (
    <div
      data-testid="dropdown-menu-checkbox-item"
      data-checked={checked}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  ItemIndicator: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="item-indicator">{children}</span>
  ),
  RadioGroup: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-radio-group" {...props}>
      {children}
    </div>
  ),
  RadioItem: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="dropdown-menu-radio-item"
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  Label: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="dropdown-menu-label" className={className} {...props}>
      {children}
    </div>
  ),
  Separator: ({ className, ...props }: { className?: string }) => (
    <div
      data-testid="dropdown-menu-separator"
      className={className}
      {...props}
    />
  ),
  Sub: ({ children, ...props }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-sub" {...props}>
      {children}
    </div>
  ),
  SubTrigger: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="dropdown-menu-sub-trigger"
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  SubContent: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div
      data-testid="dropdown-menu-sub-content"
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
}));

jest.mock("lucide-react", () => ({
  CheckIcon: () => <svg data-testid="check-icon" />,
  ChevronRightIcon: () => <svg data-testid="chevron-right-icon" />,
  CircleIcon: () => <svg data-testid="circle-icon" />,
}));

describe("DropdownMenu", () => {
  describe("DropdownMenu component", () => {
    it("renders dropdown menu root", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );

      expect(screen.getByTestId("dropdown-menu-root")).toBeInTheDocument();
    });
  });

  describe("DropdownMenuTrigger component", () => {
    it("renders trigger button", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        </DropdownMenu>
      );

      expect(screen.getByText("Open Menu")).toBeInTheDocument();
    });

    it("has data-slot attribute", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        </DropdownMenu>
      );

      const trigger = container.querySelector(
        '[data-slot="dropdown-menu-trigger"]'
      );
      expect(trigger).toBeInTheDocument();
    });
  });

  describe("DropdownMenuContent component", () => {
    it("renders content", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId("dropdown-menu-content")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      const content = screen.getByTestId("dropdown-menu-content");
      expect(content).toHaveClass(
        "bg-popover",
        "text-popover-foreground",
        "rounded-md",
        "border",
        "shadow-md"
      );
    });

    it("has data-slot attribute", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuContent>Content</DropdownMenuContent>
        </DropdownMenu>
      );

      const content = container.querySelector(
        '[data-slot="dropdown-menu-content"]'
      );
      expect(content).toBeInTheDocument();
    });
  });

  describe("DropdownMenuItem component", () => {
    it("renders menu item", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuItem>Item 1</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByTestId("dropdown-menu-item");
      expect(item).toHaveClass(
        "focus:bg-accent",
        "rounded-sm",
        "px-2",
        "py-1.5"
      );
    });

    it("renders with destructive variant", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByTestId("dropdown-menu-item");
      expect(item).toHaveAttribute("data-variant", "destructive");
    });

    it("renders with inset", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuItem inset>Inset Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByTestId("dropdown-menu-item");
      expect(item).toHaveAttribute("data-inset", "true");
    });
  });

  describe("DropdownMenuCheckboxItem component", () => {
    it("renders checkbox item", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Show Toolbar</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("Show Toolbar")).toBeInTheDocument();
    });

    it("renders checked state", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked>Enabled</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = screen.getByTestId("dropdown-menu-checkbox-item");
      expect(item).toHaveAttribute("data-checked", "true");
    });

    it("has data-slot attribute", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem>Item</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const item = container.querySelector(
        '[data-slot="dropdown-menu-checkbox-item"]'
      );
      expect(item).toBeInTheDocument();
    });
  });

  describe("DropdownMenuRadioGroup and DropdownMenuRadioItem", () => {
    it("renders radio group with items", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="option1">
                Option 1
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="option2">
                Option 2
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("has data-slot attributes", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup>
              <DropdownMenuRadioItem value="opt">Option</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(
        container.querySelector('[data-slot="dropdown-menu-radio-group"]')
      ).toBeInTheDocument();
      expect(
        container.querySelector('[data-slot="dropdown-menu-radio-item"]')
      ).toBeInTheDocument();
    });
  });

  describe("DropdownMenuLabel component", () => {
    it("renders label", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("My Account")).toBeInTheDocument();
    });

    it("renders with inset", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Inset Label</DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const label = screen.getByTestId("dropdown-menu-label");
      expect(label).toHaveAttribute("data-inset", "true");
    });
  });

  describe("DropdownMenuSeparator component", () => {
    it("renders separator", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId("dropdown-menu-separator")).toBeInTheDocument();
    });

    it("applies styling classes", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const separator = screen.getByTestId("dropdown-menu-separator");
      expect(separator).toHaveClass("bg-border", "h-px");
    });
  });

  describe("DropdownMenuShortcut component", () => {
    it("renders shortcut", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuItem>
              Save
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("⌘S")).toBeInTheDocument();
    });

    it("applies styling classes", () => {
      const { container } = render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      const shortcut = container.querySelector(
        '[data-slot="dropdown-menu-shortcut"]'
      );
      expect(shortcut).toHaveClass(
        "text-muted-foreground",
        "ml-auto",
        "text-xs"
      );
    });
  });

  describe("DropdownMenuSub components", () => {
    it("renders submenu structure", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("More")).toBeInTheDocument();
      expect(screen.getByText("Sub Item")).toBeInTheDocument();
    });

    it("submenu trigger has chevron icon", () => {
      render(
        <DropdownMenu>
          <DropdownMenuContent>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByTestId("chevron-right-icon")).toBeInTheDocument();
    });
  });

  describe("Complete DropdownMenu structure", () => {
    it("renders complete dropdown menu", () => {
      render(
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("My Account")).toBeInTheDocument();
      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByText("Settings")).toBeInTheDocument();
      expect(screen.getByText("Logout")).toBeInTheDocument();
    });
  });
});
