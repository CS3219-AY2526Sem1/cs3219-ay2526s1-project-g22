/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 2025-09-20
Scope: Suggested tests covering a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements. I fixed small untidy implementations, debugged the UI, and resolved minor test failures.
*/
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "../card";

describe("Card", () => {
  describe("Card component", () => {
    it("renders card", () => {
      const { container } = render(<Card>Card content</Card>);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<Card>Test</Card>);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass(
        "bg-card",
        "text-card-foreground",
        "flex",
        "flex-col",
        "gap-6",
        "rounded-xl",
        "border",
        "py-6",
        "shadow-sm"
      );
    });

    it("applies custom className", () => {
      const { container } = render(<Card className="custom-card">Test</Card>);

      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("custom-card");
    });

    it("renders children", () => {
      render(<Card>Card content text</Card>);

      expect(screen.getByText("Card content text")).toBeInTheDocument();
    });
  });

  describe("CardHeader component", () => {
    it("renders card header", () => {
      const { container } = render(<CardHeader>Header content</CardHeader>);

      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<CardHeader>Header</CardHeader>);

      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toHaveClass("grid", "px-6");
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardHeader className="custom-header">Header</CardHeader>
      );

      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toHaveClass("custom-header");
    });
  });

  describe("CardTitle component", () => {
    it("renders card title", () => {
      render(<CardTitle>Card Title</CardTitle>);

      expect(screen.getByText("Card Title")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardTitle>Title</CardTitle>);

      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<CardTitle>Title</CardTitle>);

      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toHaveClass("leading-none", "font-semibold");
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardTitle className="custom-title">Title</CardTitle>
      );

      const title = container.querySelector('[data-slot="card-title"]');
      expect(title).toHaveClass("custom-title");
    });
  });

  describe("CardDescription component", () => {
    it("renders card description", () => {
      render(<CardDescription>Description text</CardDescription>);

      expect(screen.getByText("Description text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(
        <CardDescription>Description</CardDescription>
      );

      const description = container.querySelector(
        '[data-slot="card-description"]'
      );
      expect(description).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(
        <CardDescription>Description</CardDescription>
      );

      const description = container.querySelector(
        '[data-slot="card-description"]'
      );
      expect(description).toHaveClass("text-muted-foreground", "text-sm");
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardDescription className="custom-desc">Description</CardDescription>
      );

      const description = container.querySelector(
        '[data-slot="card-description"]'
      );
      expect(description).toHaveClass("custom-desc");
    });
  });

  describe("CardAction component", () => {
    it("renders card action", () => {
      const { container } = render(
        <CardAction>
          <button>Action</button>
        </CardAction>
      );

      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<CardAction>Action</CardAction>);

      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toHaveClass("col-start-2", "row-span-2", "row-start-1");
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardAction className="custom-action">Action</CardAction>
      );

      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toHaveClass("custom-action");
    });
  });

  describe("CardContent component", () => {
    it("renders card content", () => {
      render(<CardContent>Main content</CardContent>);

      expect(screen.getByText("Main content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardContent>Content</CardContent>);

      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<CardContent>Content</CardContent>);

      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toHaveClass("px-6");
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardContent className="custom-content">Content</CardContent>
      );

      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toHaveClass("custom-content");
    });
  });

  describe("CardFooter component", () => {
    it("renders card footer", () => {
      render(<CardFooter>Footer content</CardFooter>);

      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);

      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);

      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toHaveClass("flex", "items-center", "px-6");
    });

    it("applies custom className", () => {
      const { container } = render(
        <CardFooter className="custom-footer">Footer</CardFooter>
      );

      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toHaveClass("custom-footer");
    });
  });

  describe("Complete Card structure", () => {
    it("renders complete card with all components", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description</CardDescription>
            <CardAction>
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent>Content</CardContent>
          <CardFooter>Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("renders card with only title and content", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Simple content</CardContent>
        </Card>
      );

      expect(screen.getByText("Simple Card")).toBeInTheDocument();
      expect(screen.getByText("Simple content")).toBeInTheDocument();
    });

    it("renders card with custom styling on all components", () => {
      const { container } = render(
        <Card className="custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">Title</CardTitle>
          </CardHeader>
          <CardContent className="custom-content">Content</CardContent>
        </Card>
      );

      expect(container.querySelector(".custom-card")).toBeInTheDocument();
      expect(container.querySelector(".custom-header")).toBeInTheDocument();
      expect(container.querySelector(".custom-title")).toBeInTheDocument();
      expect(container.querySelector(".custom-content")).toBeInTheDocument();
    });
  });
});
