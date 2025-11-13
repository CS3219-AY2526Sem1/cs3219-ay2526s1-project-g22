/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/display-name */
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "../select";

// Mock Radix UI Select components
jest.mock("@radix-ui/react-select", () => ({
  Root: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-root">{children}</div>
  ),
  Group: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-group">{children}</div>
  ),
  Value: ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder}</span>
  ),
  Trigger: React.forwardRef((props: any, ref: any) => (
    <button ref={ref} data-testid="select-trigger" {...props} />
  )),
  Icon: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="select-icon">{children}</span>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select-portal">{children}</div>
  ),
  Content: React.forwardRef((props: any, ref: any) => (
    <div ref={ref} data-testid="select-content" {...props} />
  )),
  Viewport: ({
    className,
    children,
  }: {
    className?: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="select-viewport" className={className}>
      {children}
    </div>
  ),
  ScrollUpButton: React.forwardRef((props: any, ref: any) => (
    <div ref={ref} data-testid="select-scroll-up-button" {...props}>
      Up
    </div>
  )),
  ScrollDownButton: React.forwardRef((props: any, ref: any) => (
    <div ref={ref} data-testid="select-scroll-down-button" {...props}>
      Down
    </div>
  )),
  Label: React.forwardRef((props: any, ref: any) => (
    <div ref={ref} data-testid="select-label" {...props} />
  )),
  Item: React.forwardRef((props: any, ref: any) => (
    <div ref={ref} data-testid="select-item" {...props} />
  )),
  ItemText: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="select-item-text">{children}</span>
  ),
  ItemIndicator: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="select-item-indicator">{children}</span>
  ),
  Separator: React.forwardRef((props: any, ref: any) => (
    <div ref={ref} data-testid="select-separator" {...props} />
  )),
}));

jest.mock("lucide-react", () => ({
  Check: () => <svg data-testid="check-icon" />,
  ChevronDown: () => <svg data-testid="chevron-down-icon" />,
  ChevronUp: () => <svg data-testid="chevron-up-icon" />,
}));

describe("Select", () => {
  describe("Select component", () => {
    it("renders select root", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByTestId("select-root")).toBeInTheDocument();
    });
  });

  describe("SelectTrigger component", () => {
    it("renders trigger button", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select option" />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId("select-trigger");
      expect(trigger).toHaveClass(
        "flex",
        "h-10",
        "w-full",
        "items-center",
        "justify-between",
        "rounded-md",
        "border",
        "bg-background"
      );
    });

    it("renders chevron down icon", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      render(
        <Select>
          <SelectTrigger className="custom-trigger">
            <SelectValue />
          </SelectTrigger>
        </Select>
      );

      const trigger = screen.getByTestId("select-trigger");
      expect(trigger).toHaveClass("custom-trigger");
    });
  });

  describe("SelectValue component", () => {
    it("renders with placeholder", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
        </Select>
      );

      expect(screen.getByText("Choose an option")).toBeInTheDocument();
    });
  });

  describe("SelectContent component", () => {
    it("renders content", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId("select-content")).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const content = screen.getByTestId("select-content");
      expect(content).toHaveClass("relative", "z-50", "rounded-md", "border");
    });

    it("renders with popper position by default", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectContent>
        </Select>
      );

      const content = screen.getByTestId("select-content");
      expect(content).toHaveAttribute("position", "popper");
    });

    it("renders scroll buttons", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="1">Item 1</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId("select-scroll-up-button")).toBeInTheDocument();
      expect(
        screen.getByTestId("select-scroll-down-button")
      ).toBeInTheDocument();
    });
  });

  describe("SelectLabel component", () => {
    it("renders label", () => {
      render(
        <Select>
          <SelectContent>
            <SelectLabel>Fruits</SelectLabel>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Fruits")).toBeInTheDocument();
    });

    it("applies styling classes", () => {
      render(
        <Select>
          <SelectContent>
            <SelectLabel>Label</SelectLabel>
          </SelectContent>
        </Select>
      );

      const label = screen.getByTestId("select-label");
      expect(label).toHaveClass(
        "py-1.5",
        "pl-8",
        "pr-2",
        "text-sm",
        "font-semibold"
      );
    });
  });

  describe("SelectItem component", () => {
    it("renders item", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Apple")).toBeInTheDocument();
    });

    it("applies styling classes", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="item">Item</SelectItem>
          </SelectContent>
        </Select>
      );

      const item = screen.getByTestId("select-item");
      expect(item).toHaveClass(
        "relative",
        "flex",
        "w-full",
        "cursor-default",
        "select-none",
        "items-center",
        "rounded-sm",
        "py-1.5"
      );
    });

    it("renders check icon indicator", () => {
      render(
        <Select>
          <SelectContent>
            <SelectItem value="checked">Checked Item</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId("check-icon")).toBeInTheDocument();
    });
  });

  describe("SelectSeparator component", () => {
    it("renders separator", () => {
      render(
        <Select>
          <SelectContent>
            <SelectSeparator />
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId("select-separator")).toBeInTheDocument();
    });

    it("applies styling classes", () => {
      render(
        <Select>
          <SelectContent>
            <SelectSeparator />
          </SelectContent>
        </Select>
      );

      const separator = screen.getByTestId("select-separator");
      expect(separator).toHaveClass("-mx-1", "my-1", "h-px", "bg-muted");
    });
  });

  describe("SelectGroup component", () => {
    it("renders group", () => {
      render(
        <Select>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Group Label</SelectLabel>
              <SelectItem value="1">Item 1</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId("select-group")).toBeInTheDocument();
    });
  });

  describe("Complete Select structure", () => {
    it("renders complete select with groups and separators", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Fruits</SelectLabel>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>Vegetables</SelectLabel>
              <SelectItem value="carrot">Carrot</SelectItem>
              <SelectItem value="potato">Potato</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Select a fruit")).toBeInTheDocument();
      expect(screen.getByText("Fruits")).toBeInTheDocument();
      expect(screen.getByText("Apple")).toBeInTheDocument();
      expect(screen.getByText("Banana")).toBeInTheDocument();
      expect(screen.getByText("Vegetables")).toBeInTheDocument();
      expect(screen.getByText("Carrot")).toBeInTheDocument();
      expect(screen.getByText("Potato")).toBeInTheDocument();
    });
  });
});
