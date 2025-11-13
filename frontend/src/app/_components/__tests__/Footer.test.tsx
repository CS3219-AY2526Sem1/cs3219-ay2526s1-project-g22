/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-22
Scope: Suggested tests based on edge cases identified by the user.
Author review: I verified correctness of the modifications by AI against requirements — I validated the test scenarios and confirmed they exercise the component correctly.
*/
import { render, screen } from "@testing-library/react";
import Footer from "../Footer";

// Mock Next.js Link
/* eslint-disable react/display-name */
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Code2: () => <svg data-testid="code2-icon" />,
}));

describe("Footer", () => {
  describe("Rendering", () => {
    it("renders footer element", () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector("footer");
      expect(footer).toBeInTheDocument();
    });

    it("renders CodeCollab branding", () => {
      render(<Footer />);

      expect(screen.getByText("CodeCollab")).toBeInTheDocument();
      expect(screen.getByTestId("code2-icon")).toBeInTheDocument();
    });

    it("renders copyright text", () => {
      render(<Footer />);

      expect(
        screen.getByText("© 2025 CodeCollab. All rights reserved.")
      ).toBeInTheDocument();
    });
  });

  describe("Navigation links", () => {
    it("renders Privacy link", () => {
      render(<Footer />);

      const privacyLink = screen.getByText("Privacy");
      expect(privacyLink).toBeInTheDocument();
      expect(privacyLink.closest("a")).toHaveAttribute("href", "/privacy");
    });

    it("renders Terms link", () => {
      render(<Footer />);

      const termsLink = screen.getByText("Terms");
      expect(termsLink).toBeInTheDocument();
      expect(termsLink.closest("a")).toHaveAttribute("href", "/terms");
    });

    it("renders Support link", () => {
      render(<Footer />);

      const supportLink = screen.getByText("Support");
      expect(supportLink).toBeInTheDocument();
      expect(supportLink.closest("a")).toHaveAttribute("href", "/support");
    });

    it("renders all three navigation links", () => {
      render(<Footer />);

      expect(screen.getByText("Privacy")).toBeInTheDocument();
      expect(screen.getByText("Terms")).toBeInTheDocument();
      expect(screen.getByText("Support")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies footer styling classes", () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector("footer");
      expect(footer).toHaveClass(
        "border-t",
        "border-blue-800/30",
        "bg-slate-900/50",
        "backdrop-blur-sm",
        "w-full"
      );
    });
  });

  describe("Layout", () => {
    it("renders content in max-width container", () => {
      const { container } = render(<Footer />);

      const maxWidthDiv = container.querySelector(".max-w-7xl");
      expect(maxWidthDiv).toBeInTheDocument();
    });

    it("renders branding and links in flex container", () => {
      const { container } = render(<Footer />);

      const flexContainer = container.querySelector(
        ".flex.flex-col.items-center.justify-between"
      );
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("footer has semantic HTML element", () => {
      const { container } = render(<Footer />);

      expect(container.querySelector("footer")).toBeInTheDocument();
    });

    it("links are accessible", () => {
      render(<Footer />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBeGreaterThanOrEqual(3);
    });
  });
});
