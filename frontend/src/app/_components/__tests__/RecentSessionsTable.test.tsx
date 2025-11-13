/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-22
Scope: Suggested tests based on edge cases identified by the user.
Author review: I verified correctness of the modifications by AI against requirements — I validated the test scenarios and confirmed they exercise the component correctly.
*/
import { render, screen } from "@testing-library/react";
import RecentSessionsTable from "../RecentSessionsTable";
import { HistoryData } from "@/app/history/types/HistoryData";

// Mock lucide-react
jest.mock("lucide-react", () => ({
  Clock: () => <svg data-testid="clock-icon" />,
}));

// Mock UI components
jest.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <span className={className} data-testid="badge">
      {children}
    </span>
  ),
}));

jest.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardHeader: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
}));

describe("RecentSessionsTable", () => {
  const mockMatches: HistoryData[] = [
    {
      id: "1",
      created_at: "2024-01-01T10:00:00Z",
      current_code: "console.log('Hello');",
      interviewer: { name: "Alice Smith" },
      interviewee: { name: "Bob Johnson" },
      question: {
        _id: "q1-mongo-id",
        questionId: "q1",
        title: "Two Sum",
        difficulty: "Easy",
        tags: ["Array", "Hash Table"],
      },
    },
    {
      id: "2",
      created_at: "2024-01-02T10:00:00Z",
      current_code: null,
      interviewer: { name: "Charlie Brown" },
      interviewee: { name: "Diana Prince" },
      question: {
        _id: "q2-mongo-id",
        questionId: "q2",
        title: "Longest Substring Without Repeating Characters",
        difficulty: "Medium",
        tags: ["String", "Sliding Window"],
      },
    },
    {
      id: "3",
      created_at: "2024-01-03T10:00:00Z",
      current_code: "function median() {}",
      interviewer: { name: "Eve Adams" },
      interviewee: { name: "Frank Miller" },
      question: {
        _id: "q3-mongo-id",
        questionId: "q3",
        title: "Median of Two Sorted Arrays",
        difficulty: "Hard",
        tags: ["Array", "Binary Search", "Divide and Conquer"],
      },
    },
  ];

  describe("Rendering", () => {
    it("renders the table component", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByTestId("card")).toBeInTheDocument();
    });

    it("renders table title", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Recent Coding Sessions")).toBeInTheDocument();
      expect(screen.getByTestId("clock-icon")).toBeInTheDocument();
    });

    it("renders table headers", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Interviewer")).toBeInTheDocument();
      expect(screen.getByText("Interviewee")).toBeInTheDocument();
      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("Difficulty")).toBeInTheDocument();
    });

    it("renders all match rows", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
      expect(screen.getByText("Diana Prince")).toBeInTheDocument();
      expect(screen.getByText("Eve Adams")).toBeInTheDocument();
      expect(screen.getByText("Frank Miller")).toBeInTheDocument();
    });

    it("renders empty table when no matches provided", () => {
      render(<RecentSessionsTable matches={[]} />);

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByText("Recent Coding Sessions")).toBeInTheDocument();
    });
  });

  describe("Interviewer column", () => {
    it("renders interviewer names", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
      expect(screen.getByText("Eve Adams")).toBeInTheDocument();
    });

    it("renders interviewer initials in avatar", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("A")).toBeInTheDocument();
      expect(screen.getByText("C")).toBeInTheDocument();
      expect(screen.getByText("E")).toBeInTheDocument();
    });

    it("handles null interviewer", () => {
      const noInterviewerMatches: HistoryData[] = [
        {
          id: "1",
          created_at: "2024-01-01T10:00:00Z",
          current_code: null,
          interviewer: null,
          interviewee: { name: "Bob Johnson" },
          question: {
            _id: "q1-mongo-id",
            questionId: "q1",
            title: "Test Question",
            difficulty: "Easy",
            tags: ["Test"],
          },
        },
      ];

      const { container } = render(
        <RecentSessionsTable matches={noInterviewerMatches} />
      );
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });
  });

  describe("Interviewee column", () => {
    it("renders interviewee names", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.getByText("Diana Prince")).toBeInTheDocument();
      expect(screen.getByText("Frank Miller")).toBeInTheDocument();
    });

    it("renders interviewee initials in avatar", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("B")).toBeInTheDocument();
      expect(screen.getByText("D")).toBeInTheDocument();
      expect(screen.getByText("F")).toBeInTheDocument();
    });
  });

  describe("Question column", () => {
    it("renders question titles", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Two Sum")).toBeInTheDocument();
      expect(
        screen.getByText("Longest Substring Without Repeating Characters")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Median of Two Sorted Arrays")
      ).toBeInTheDocument();
    });

    it("handles long question titles", () => {
      const longQuestionMatches: HistoryData[] = [
        {
          id: "1",
          created_at: "2024-01-01T10:00:00Z",
          current_code: null,
          interviewer: { name: "Test User" },
          interviewee: { name: "Test User 2" },
          question: {
            _id: "q1-mongo-id",
            questionId: "q1",
            title:
              "This is a very long question title that might wrap to multiple lines",
            difficulty: "Medium",
            tags: ["Test"],
          },
        },
      ];

      render(<RecentSessionsTable matches={longQuestionMatches} />);

      expect(
        screen.getByText(
          "This is a very long question title that might wrap to multiple lines"
        )
      ).toBeInTheDocument();
    });
  });

  describe("Difficulty badges", () => {
    it("renders Easy difficulty badge", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      const badges = screen.getAllByTestId("badge");
      const easyBadge = badges.find((badge) => badge.textContent === "Easy");
      expect(easyBadge).toBeInTheDocument();
      expect(easyBadge).toHaveClass(
        "bg-emerald-500/20",
        "text-emerald-400",
        "border-emerald-500/30"
      );
    });

    it("renders Medium difficulty badge", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      const badges = screen.getAllByTestId("badge");
      const mediumBadge = badges.find(
        (badge) => badge.textContent === "Medium"
      );
      expect(mediumBadge).toBeInTheDocument();
      expect(mediumBadge).toHaveClass(
        "bg-amber-500/20",
        "text-amber-400",
        "border-amber-500/30"
      );
    });

    it("renders Hard difficulty badge", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      const badges = screen.getAllByTestId("badge");
      const hardBadge = badges.find((badge) => badge.textContent === "Hard");
      expect(hardBadge).toBeInTheDocument();
      expect(hardBadge).toHaveClass(
        "bg-red-500/20",
        "text-red-400",
        "border-red-500/30"
      );
    });

    it("renders all difficulty levels correctly", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Easy")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
      expect(screen.getByText("Hard")).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies card styling classes", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(
        "bg-slate-800/60",
        "backdrop-blur-sm",
        "border-slate-600/50",
        "shadow-xl"
      );
    });

    it("applies hover effects to table rows", () => {
      const { container } = render(
        <RecentSessionsTable matches={mockMatches} />
      );

      const rows = container.querySelectorAll("tbody tr");
      rows.forEach((row) => {
        expect(row).toHaveClass("hover:bg-slate-700/30", "transition-colors");
      });
    });
  });

  describe("Data rendering", () => {
    it("renders correct number of rows", () => {
      const { container } = render(
        <RecentSessionsTable matches={mockMatches} />
      );

      const rows = container.querySelectorAll("tbody tr");
      expect(rows).toHaveLength(mockMatches.length);
    });

    it("handles multiple matches with same difficulty", () => {
      const sameMatches: HistoryData[] = [
        {
          id: "1",
          created_at: "2024-01-01T10:00:00Z",
          current_code: null,
          interviewer: { name: "User 1" },
          interviewee: { name: "User 2" },
          question: {
            _id: "q1-mongo-id",
            questionId: "q1",
            title: "Question 1",
            difficulty: "Easy",
            tags: ["Test"],
          },
        },
        {
          id: "2",
          created_at: "2024-01-02T10:00:00Z",
          current_code: null,
          interviewer: { name: "User 3" },
          interviewee: { name: "User 4" },
          question: {
            _id: "q2-mongo-id",
            questionId: "q2",
            title: "Question 2",
            difficulty: "Easy",
            tags: ["Test"],
          },
        },
      ];

      render(<RecentSessionsTable matches={sameMatches} />);

      const badges = screen.getAllByTestId("badge");
      expect(badges).toHaveLength(2);
      badges.forEach((badge) => {
        expect(badge).toHaveTextContent("Easy");
      });
    });

    it("handles null current_code", () => {
      const nullCodeMatches: HistoryData[] = [
        {
          id: "1",
          created_at: "2024-01-01T10:00:00Z",
          current_code: null,
          interviewer: { name: "User 1" },
          interviewee: { name: "User 2" },
          question: {
            _id: "q1-mongo-id",
            questionId: "q1",
            title: "Question 1",
            difficulty: "Easy",
            tags: ["Test"],
          },
        },
      ];

      const { container } = render(
        <RecentSessionsTable matches={nullCodeMatches} />
      );
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("uses semantic table elements", () => {
      const { container } = render(
        <RecentSessionsTable matches={mockMatches} />
      );

      expect(container.querySelector("table")).toBeInTheDocument();
      expect(container.querySelector("thead")).toBeInTheDocument();
      expect(container.querySelector("tbody")).toBeInTheDocument();
    });

    it("has proper table structure", () => {
      const { container } = render(
        <RecentSessionsTable matches={mockMatches} />
      );

      const headers = container.querySelectorAll("thead th");
      expect(headers).toHaveLength(4); // Interviewer, Interviewee, Question, Difficulty

      const cells = container.querySelectorAll("tbody td");
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});
