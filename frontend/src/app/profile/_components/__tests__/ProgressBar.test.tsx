/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-19
Scope: Suggested tests based on a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements. I validated the tests and ensured they cover the component behavior correctly.
*/
import { render, screen } from "@testing-library/react";
import ProgressBar from "../ProgressBar";

describe("ProgressBar", () => {
  const mockQuestionStats = {
    easy: 10,
    medium: 15,
    hard: 5,
    total: 50,
  };

  describe("Easy difficulty", () => {
    it("renders easy progress bar with correct label", () => {
      render(<ProgressBar questionsStats={mockQuestionStats} tag="easy" />);

      expect(screen.getByText("Easy")).toBeInTheDocument();
      expect(screen.getByText("10/50")).toBeInTheDocument();
    });

    it("applies correct color classes for easy", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="easy" />
      );

      const label = screen.getByText("Easy");
      expect(label).toHaveClass("text-green-600");

      const progressBar = container.querySelector(".bg-green-500");
      expect(progressBar).toBeInTheDocument();
    });

    it("calculates correct width percentage for easy", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="easy" />
      );

      const progressBar = container.querySelector(
        ".bg-green-500"
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "20%" }); // 10/50 * 100 = 20%
    });
  });

  describe("Medium difficulty", () => {
    it("renders medium progress bar with correct label", () => {
      render(<ProgressBar questionsStats={mockQuestionStats} tag="medium" />);

      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("15/50")).toBeInTheDocument();
    });

    it("applies correct color classes for medium", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="medium" />
      );

      const label = screen.getByText("Medium");
      expect(label).toHaveClass("text-yellow-600");

      const progressBar = container.querySelector(".bg-yellow-500");
      expect(progressBar).toBeInTheDocument();
    });

    it("calculates correct width percentage for medium", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="medium" />
      );

      const progressBar = container.querySelector(
        ".bg-yellow-500"
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "30%" }); // 15/50 * 100 = 30%
    });
  });

  describe("Hard difficulty", () => {
    it("renders hard progress bar with correct label", () => {
      render(<ProgressBar questionsStats={mockQuestionStats} tag="hard" />);

      expect(screen.getByText("Hard")).toBeInTheDocument();
      expect(screen.getByText("5/50")).toBeInTheDocument();
    });

    it("applies correct color classes for hard", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="hard" />
      );

      const label = screen.getByText("Hard");
      expect(label).toHaveClass("text-red-600");

      const progressBar = container.querySelector(".bg-red-500");
      expect(progressBar).toBeInTheDocument();
    });

    it("calculates correct width percentage for hard", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="hard" />
      );

      const progressBar = container.querySelector(".bg-red-500") as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "10%" }); // 5/50 * 100 = 10%
    });
  });

  describe("Edge cases", () => {
    it("handles zero completed questions", () => {
      const stats = { easy: 0, medium: 0, hard: 0, total: 50 };
      const { container } = render(
        <ProgressBar questionsStats={stats} tag="easy" />
      );

      expect(screen.getByText("0/50")).toBeInTheDocument();

      const progressBar = container.querySelector(
        ".bg-green-500"
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "0%" });
    });

    it("handles all questions completed", () => {
      const stats = { easy: 50, medium: 0, hard: 0, total: 50 };
      const { container } = render(
        <ProgressBar questionsStats={stats} tag="easy" />
      );

      expect(screen.getByText("50/50")).toBeInTheDocument();

      const progressBar = container.querySelector(
        ".bg-green-500"
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "100%" });
    });

    it("handles decimal percentages correctly", () => {
      const stats = { easy: 1, medium: 0, hard: 0, total: 3 };
      const { container } = render(
        <ProgressBar questionsStats={stats} tag="easy" />
      );

      const progressBar = container.querySelector(
        ".bg-green-500"
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({
        width: `${(1 / 3) * 100}%`,
      });
    });

    it("handles single question scenario", () => {
      const stats = { easy: 1, medium: 0, hard: 0, total: 1 };
      const { container } = render(
        <ProgressBar questionsStats={stats} tag="easy" />
      );

      expect(screen.getByText("1/1")).toBeInTheDocument();

      const progressBar = container.querySelector(
        ".bg-green-500"
      ) as HTMLElement;
      expect(progressBar).toHaveStyle({ width: "100%" });
    });
  });

  describe("Structure and styling", () => {
    it("renders with correct structure", () => {
      const { container } = render(
        <ProgressBar questionsStats={mockQuestionStats} tag="easy" />
      );

      // Check outer container
      const outerDiv = container.firstChild;
      expect(outerDiv).toHaveClass("space-y-2");

      // Check progress bar background
      const progressBg = container.querySelector(".bg-gray-200");
      expect(progressBg).toBeInTheDocument();
      expect(progressBg).toHaveClass("rounded-full", "h-2");
    });

    it("displays label with correct font styling", () => {
      render(<ProgressBar questionsStats={mockQuestionStats} tag="medium" />);

      const label = screen.getByText("Medium");
      expect(label).toHaveClass("font-medium");
    });

    it("displays stats with correct text color", () => {
      render(<ProgressBar questionsStats={mockQuestionStats} tag="hard" />);

      const stats = screen.getByText("5/50");
      expect(stats).toHaveClass("text-gray-200");
    });
  });
});
