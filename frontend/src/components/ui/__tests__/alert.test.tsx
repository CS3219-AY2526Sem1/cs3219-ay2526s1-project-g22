/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 2025-09-20
Scope: Suggested tests covering a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements  and resolved minor test failures.
*/
import { render, screen } from "@testing-library/react";
import { Alert, AlertTitle, AlertDescription } from "../alert";

describe("Alert", () => {
  describe("Alert component", () => {
    it("renders alert with default variant", () => {
      render(<Alert>Test alert</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveAttribute("data-slot", "alert");
    });

    it("renders alert with default variant styling", () => {
      render(<Alert>Default alert</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("bg-card", "text-card-foreground");
    });

    it("renders alert with destructive variant", () => {
      render(<Alert variant="destructive">Destructive alert</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("text-destructive", "bg-card");
    });

    it("applies custom className", () => {
      render(<Alert className="custom-class">Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("custom-class");
    });

    it("renders with children", () => {
      render(<Alert>Alert content</Alert>);

      expect(screen.getByText("Alert content")).toBeInTheDocument();
    });

    it("applies base styling classes", () => {
      render(<Alert>Test</Alert>);

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass(
        "relative",
        "w-full",
        "rounded-lg",
        "border",
        "px-4",
        "py-3",
        "text-sm"
      );
    });
  });

  describe("AlertTitle component", () => {
    it("renders alert title", () => {
      render(<AlertTitle>Alert Title</AlertTitle>);

      expect(screen.getByText("Alert Title")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>);

      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<AlertTitle>Title</AlertTitle>);

      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toHaveClass("col-start-2", "font-medium", "tracking-tight");
    });

    it("applies custom className", () => {
      const { container } = render(
        <AlertTitle className="custom-title">Title</AlertTitle>
      );

      const title = container.querySelector('[data-slot="alert-title"]');
      expect(title).toHaveClass("custom-title");
    });
  });

  describe("AlertDescription component", () => {
    it("renders alert description", () => {
      render(<AlertDescription>Alert description text</AlertDescription>);

      expect(screen.getByText("Alert description text")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(
        <AlertDescription>Description</AlertDescription>
      );

      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );
      expect(description).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(
        <AlertDescription>Description</AlertDescription>
      );

      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );
      expect(description).toHaveClass(
        "text-muted-foreground",
        "col-start-2",
        "text-sm"
      );
    });

    it("applies custom className", () => {
      const { container } = render(
        <AlertDescription className="custom-desc">Description</AlertDescription>
      );

      const description = container.querySelector(
        '[data-slot="alert-description"]'
      );
      expect(description).toHaveClass("custom-desc");
    });
  });

  describe("Complete Alert structure", () => {
    it("renders complete alert with title and description", () => {
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This is a warning message</AlertDescription>
        </Alert>
      );

      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("This is a warning message")).toBeInTheDocument();
    });

    it("renders destructive alert with all components", () => {
      render(
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>An error occurred</AlertDescription>
        </Alert>
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveClass("text-destructive");
      expect(screen.getByText("Error")).toBeInTheDocument();
      expect(screen.getByText("An error occurred")).toBeInTheDocument();
    });

    it("renders alert with icon", () => {
      render(
        <Alert>
          <svg data-testid="alert-icon" />
          <AlertTitle>Title</AlertTitle>
          <AlertDescription>Description</AlertDescription>
        </Alert>
      );

      expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });
  });
});
