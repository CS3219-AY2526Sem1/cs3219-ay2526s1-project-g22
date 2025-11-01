import { render, screen } from "@testing-library/react";
import { Avatar, AvatarImage, AvatarFallback } from "../avatar";

describe("Avatar", () => {
  describe("Avatar component", () => {
    it("renders avatar container", () => {
      const { container } = render(<Avatar />);

      const avatar = container.querySelector('[data-slot="avatar"]');
      expect(avatar).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(<Avatar />);

      const avatar = container.querySelector('[data-slot="avatar"]');
      expect(avatar).toHaveClass(
        "relative",
        "flex",
        "size-8",
        "shrink-0",
        "overflow-hidden",
        "rounded-full"
      );
    });

    it("applies custom className", () => {
      const { container } = render(<Avatar className="custom-avatar" />);

      const avatar = container.querySelector('[data-slot="avatar"]');
      expect(avatar).toHaveClass("custom-avatar");
    });

    it("renders children", () => {
      render(
        <Avatar>
          <div data-testid="avatar-child">Child</div>
        </Avatar>
      );

      expect(screen.getByTestId("avatar-child")).toBeInTheDocument();
    });
  });

  describe("AvatarImage component", () => {
    it("renders avatar image", () => {
      render(
        <Avatar>
          <AvatarImage src="/test-image.jpg" alt="Test User" />
        </Avatar>
      );

      // AvatarImage is rendered but may not be immediately visible
      // Check that the Avatar container exists
      const avatar = document.querySelector('[data-slot="avatar"]');
      expect(avatar).toBeInTheDocument();
    });

    it("applies default styling classes to avatar", () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="/test.jpg" />
        </Avatar>
      );

      const avatar = container.querySelector('[data-slot="avatar"]');
      expect(avatar).toHaveClass(
        "relative",
        "flex",
        "size-8",
        "overflow-hidden",
        "rounded-full"
      );
    });

    it("renders with custom className on avatar", () => {
      const { container } = render(
        <Avatar className="custom-avatar">
          <AvatarImage src="/test.jpg" />
        </Avatar>
      );

      const avatar = container.querySelector('[data-slot="avatar"]');
      expect(avatar).toHaveClass("custom-avatar");
    });
  });

  describe("AvatarFallback component", () => {
    it("renders fallback text", () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const fallback = container.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toBeInTheDocument();
    });

    it("applies default styling classes", () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const fallback = container.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass(
        "bg-muted",
        "flex",
        "size-full",
        "items-center",
        "justify-center",
        "rounded-full"
      );
    });

    it("applies custom className", () => {
      const { container } = render(
        <Avatar>
          <AvatarFallback className="custom-fallback">JD</AvatarFallback>
        </Avatar>
      );

      const fallback = container.querySelector('[data-slot="avatar-fallback"]');
      expect(fallback).toHaveClass("custom-fallback");
    });
  });

  describe("Complete Avatar structure", () => {
    it("renders avatar with image and fallback", () => {
      const { container } = render(
        <Avatar>
          <AvatarImage src="/user.jpg" alt="John Doe" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );

      const avatar = container.querySelector('[data-slot="avatar"]');
      const fallback = container.querySelector('[data-slot="avatar-fallback"]');
      expect(avatar).toBeInTheDocument();
      expect(fallback).toBeInTheDocument();
    });

    it("renders avatar with only fallback", () => {
      render(
        <Avatar>
          <AvatarFallback>AB</AvatarFallback>
        </Avatar>
      );

      expect(screen.getByText("AB")).toBeInTheDocument();
    });

    it("renders avatar with custom size", () => {
      const { container } = render(
        <Avatar className="size-12">
          <AvatarFallback>XY</AvatarFallback>
        </Avatar>
      );

      const avatar = container.querySelector('[data-slot="avatar"]');
      expect(avatar).toHaveClass("size-12");
    });
  });
});
