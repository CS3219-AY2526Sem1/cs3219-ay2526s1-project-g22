/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-19
Scope: Suggested tests based on a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements. I validated the tests and ensured they cover the component behavior correctly.
*/
import { render, screen } from "@testing-library/react";
import QuestionStats from "../QuestionStats";

// Mock the Badge component
jest.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className: string;
  }) => <div className={className}>{children}</div>,
}));

describe("QuestionStats", () => {
  describe("Easy difficulty (E)", () => {
    it("renders easy stats with correct number", () => {
      render(<QuestionStats stats={10} tag="E" />);

      expect(screen.getByText("E")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("Easy")).toBeInTheDocument();
    });

    it("applies correct color classes for easy", () => {
      const { container } = render(<QuestionStats stats={10} tag="E" />);

      const circleBackground = container.querySelector(".bg-green-100");
      expect(circleBackground).toBeInTheDocument();

      const statsNumber = screen.getByText("10");
      expect(statsNumber).toHaveClass("text-green-600");
    });

    it("renders badge with E inside circle", () => {
      render(<QuestionStats stats={10} tag="E" />);

      const badge = screen.getByText("E");
      expect(badge).toHaveClass("bg-transparent", "text-lg", "text-black");
    });
  });

  describe("Medium difficulty (M)", () => {
    it("renders medium stats with correct number", () => {
      render(<QuestionStats stats={25} tag="M" />);

      expect(screen.getByText("M")).toBeInTheDocument();
      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });

    it("applies correct color classes for medium", () => {
      const { container } = render(<QuestionStats stats={25} tag="M" />);

      const circleBackground = container.querySelector(".bg-yellow-100");
      expect(circleBackground).toBeInTheDocument();

      const statsNumber = screen.getByText("25");
      expect(statsNumber).toHaveClass("text-yellow-600");
    });

    it("renders badge with M inside circle", () => {
      render(<QuestionStats stats={25} tag="M" />);

      const badge = screen.getByText("M");
      expect(badge).toHaveClass("bg-transparent", "text-lg", "text-black");
    });
  });

  describe("Hard difficulty (H)", () => {
    it("renders hard stats with correct number", () => {
      render(<QuestionStats stats={5} tag="H" />);

      expect(screen.getByText("H")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Hard")).toBeInTheDocument();
    });

    it("applies correct color classes for hard", () => {
      const { container } = render(<QuestionStats stats={5} tag="H" />);

      const circleBackground = container.querySelector(".bg-red-100");
      expect(circleBackground).toBeInTheDocument();

      const statsNumber = screen.getByText("5");
      expect(statsNumber).toHaveClass("text-red-600");
    });

    it("renders badge with H inside circle", () => {
      render(<QuestionStats stats={5} tag="H" />);

      const badge = screen.getByText("H");
      expect(badge).toHaveClass("bg-transparent", "text-lg", "text-black");
    });
  });

  describe("Edge cases", () => {
    it("handles zero stats", () => {
      render(<QuestionStats stats={0} tag="E" />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles large numbers", () => {
      render(<QuestionStats stats={999} tag="M" />);

      expect(screen.getByText("999")).toBeInTheDocument();
    });

    it("handles single digit stats", () => {
      render(<QuestionStats stats={1} tag="H" />);

      expect(screen.getByText("1")).toBeInTheDocument();
    });

    it("handles double digit stats", () => {
      render(<QuestionStats stats={42} tag="E" />);

      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("handles triple digit stats", () => {
      render(<QuestionStats stats={123} tag="M" />);

      expect(screen.getByText("123")).toBeInTheDocument();
    });
  });

  describe("Structure and styling", () => {
    it("renders with correct outer structure", () => {
      const { container } = render(<QuestionStats stats={10} tag="E" />);

      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass("text-center", "space-y-2");
    });

    it("renders circle with correct dimensions", () => {
      const { container } = render(<QuestionStats stats={10} tag="E" />);

      const circle = container.querySelector(".h-16.w-16");
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveClass(
        "rounded-full",
        "flex",
        "items-center",
        "justify-center"
      );
    });

    it("displays stats number with correct font styling", () => {
      render(<QuestionStats stats={10} tag="M" />);

      const statsNumber = screen.getByText("10");
      expect(statsNumber).toHaveClass("text-3xl", "font-bold");
    });

    it("displays difficulty label with correct styling", () => {
      render(<QuestionStats stats={10} tag="H" />);

      const label = screen.getByText("Hard");
      expect(label).toHaveClass("text-sm", "text-gray-200");
    });

    it("centers content correctly", () => {
      const { container } = render(<QuestionStats stats={10} tag="E" />);

      const flexContainer = container.querySelector(".flex.justify-center");
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe("Color classes mapping", () => {
    it("uses green color scheme for Easy", () => {
      const { container } = render(<QuestionStats stats={10} tag="E" />);

      expect(container.querySelector(".bg-green-100")).toBeInTheDocument();
      expect(screen.getByText("10")).toHaveClass("text-green-600");
    });

    it("uses yellow color scheme for Medium", () => {
      const { container } = render(<QuestionStats stats={10} tag="M" />);

      expect(container.querySelector(".bg-yellow-100")).toBeInTheDocument();
      expect(screen.getByText("10")).toHaveClass("text-yellow-600");
    });

    it("uses red color scheme for Hard", () => {
      const { container } = render(<QuestionStats stats={10} tag="H" />);

      expect(container.querySelector(".bg-red-100")).toBeInTheDocument();
      expect(screen.getByText("10")).toHaveClass("text-red-600");
    });
  });

  describe("Badge component", () => {
    it("renders badge with correct size classes", () => {
      render(<QuestionStats stats={10} tag="E" />);

      const badge = screen.getByText("E");
      expect(badge).toHaveClass("text-lg", "px-3", "py-1");
    });

    it("renders badge with transparent background", () => {
      render(<QuestionStats stats={10} tag="M" />);

      const badge = screen.getByText("M");
      expect(badge).toHaveClass("bg-transparent");
    });

    it("renders badge with black text", () => {
      render(<QuestionStats stats={10} tag="H" />);

      const badge = screen.getByText("H");
      expect(badge).toHaveClass("text-black");
    });
  });
});
