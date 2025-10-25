import { render, screen } from "@testing-library/react";
import RecentSessionsTable from "../RecentSessionsTable";
import { Match } from "../../page";

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
  const mockMatches: Match[] = [
    {
      id: "1",
      interviewee: "Alice Smith",
      question: "Two Sum",
      difficulty: "Easy",
    },
    {
      id: "2",
      interviewee: "Bob Johnson",
      question: "Longest Substring Without Repeating Characters",
      difficulty: "Medium",
    },
    {
      id: "3",
      interviewee: "Charlie Brown",
      question: "Median of Two Sorted Arrays",
      difficulty: "Hard",
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

      expect(screen.getByText("Partner")).toBeInTheDocument();
      expect(screen.getByText("Question")).toBeInTheDocument();
      expect(screen.getByText("Difficulty")).toBeInTheDocument();
    });

    it("renders all match rows", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });

    it("renders empty table when no matches provided", () => {
      render(<RecentSessionsTable matches={[]} />);

      expect(screen.getByTestId("card")).toBeInTheDocument();
      expect(screen.getByText("Recent Coding Sessions")).toBeInTheDocument();
    });
  });

  describe("Partner column", () => {
    it("renders partner names", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
      expect(screen.getByText("Charlie Brown")).toBeInTheDocument();
    });

    it("renders partner initials in avatar", () => {
      render(<RecentSessionsTable matches={mockMatches} />);

      expect(screen.getByText("AS")).toBeInTheDocument();
      expect(screen.getByText("BJ")).toBeInTheDocument();
      expect(screen.getByText("CB")).toBeInTheDocument();
    });

    it("handles single-name partners", () => {
      const singleNameMatches: Match[] = [
        {
          id: "1",
          interviewee: "Alice",
          question: "Test",
          difficulty: "Easy",
        },
      ];

      render(<RecentSessionsTable matches={singleNameMatches} />);

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("A")).toBeInTheDocument();
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
      const longQuestionMatches: Match[] = [
        {
          id: "1",
          interviewee: "Test User",
          question:
            "This is a very long question title that might wrap to multiple lines",
          difficulty: "Medium",
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
      const sameMatches: Match[] = [
        {
          id: "1",
          interviewee: "User 1",
          question: "Question 1",
          difficulty: "Easy",
        },
        {
          id: "2",
          interviewee: "User 2",
          question: "Question 2",
          difficulty: "Easy",
        },
      ];

      render(<RecentSessionsTable matches={sameMatches} />);

      const badges = screen.getAllByTestId("badge");
      expect(badges).toHaveLength(2);
      badges.forEach((badge) => {
        expect(badge).toHaveTextContent("Easy");
      });
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
      expect(headers).toHaveLength(3);

      const cells = container.querySelectorAll("tbody td");
      expect(cells.length).toBeGreaterThan(0);
    });
  });
});
