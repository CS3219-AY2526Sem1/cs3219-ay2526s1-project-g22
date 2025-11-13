/*
AI Assistance Disclosure:
Tool: Deepseek R1
Date: 2025-09-22
Scope: Suggested tests based on edge cases identified by the user.
Author review: I verified correctness of the modifications by AI against requirements — I validated the test scenarios and confirmed they exercise the component correctly.
*/
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Header from "../Header";
import { signOut } from "@/lib/auth";

// Mock dependencies
jest.mock("next/link", () => {
  // eslint-disable-next-line react/display-name
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("lucide-react", () => ({
  __esModule: true,
  Code2: () => <svg data-testid="code2-icon" />,
  User: () => <svg data-testid="user-icon" />,
  LogOut: () => <svg data-testid="logout-icon" />,
  History: () => <svg data-testid="history-icon" />,
}));

jest.mock("@/contexts/user-context", () => ({
  useUser: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  signOut: jest.fn(),
}));

jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: ({
    children,
    className,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("@/components/ui/avatar", () => ({
  __esModule: true,
  Avatar: ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="avatar-image" />
  ),
  AvatarFallback: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="avatar-fallback">{children}</div>
  ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
  __esModule: true,
  DropdownMenu: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-menu-content">{children}</div>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr data-testid="dropdown-separator" />,
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div onClick={onClick} data-testid="dropdown-item">
      {children}
    </div>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useUser } = require("@/contexts/user-context");

describe("Header", () => {
  const mockUser = {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
    avatar_url: "https://example.com/avatar.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useUser.mockReturnValue({ user: mockUser });
  });

  describe("Rendering", () => {
    it("renders header element", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("renders CodeCollab branding", () => {
      render(<Header />);

      expect(screen.getByText("CodeCollab")).toBeInTheDocument();
      expect(screen.getByTestId("code2-icon")).toBeInTheDocument();
    });

    it("renders home link", () => {
      render(<Header />);

      const homeLink = screen.getByText("CodeCollab").closest("a");
      expect(homeLink).toHaveAttribute("href", "/");
    });

    it("renders history button", () => {
      render(<Header />);

      expect(screen.getByText("History")).toBeInTheDocument();
    });

    it("history link points to /history", () => {
      render(<Header />);

      const historyLink = screen.getByText("History").closest("a");
      expect(historyLink).toHaveAttribute("href", "/history");
    });
  });

  describe("User avatar and dropdown", () => {
    it("renders user avatar with image", () => {
      render(<Header />);

      const avatarImage = screen.getByTestId("avatar-image");
      expect(avatarImage).toBeInTheDocument();
      expect(avatarImage).toHaveAttribute("src", mockUser.avatar_url);
      expect(avatarImage).toHaveAttribute("alt", mockUser.name);
    });

    it("renders avatar fallback with user initial", () => {
      render(<Header />);

      const fallback = screen.getByTestId("avatar-fallback");
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent("J");
    });

    it("renders user name and email in dropdown", () => {
      render(<Header />);

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it("uses dicebear avatar when avatar_url is missing", () => {
      useUser.mockReturnValue({
        user: { ...mockUser, avatar_url: null },
      });

      render(<Header />);

      const avatarImage = screen.getByTestId("avatar-image");
      expect(avatarImage).toHaveAttribute(
        "src",
        expect.stringContaining("dicebear.com")
      );
    });

    it("renders email initial when name is missing", () => {
      useUser.mockReturnValue({
        user: { ...mockUser, name: null },
      });

      render(<Header />);

      const fallback = screen.getByTestId("avatar-fallback");
      expect(fallback).toHaveTextContent("J");
    });
  });

  describe("Dropdown menu items", () => {
    it("renders Profile menu item", () => {
      render(<Header />);

      expect(screen.getByText("Profile")).toBeInTheDocument();
      expect(screen.getByTestId("user-icon")).toBeInTheDocument();
    });

    it("renders Match History menu item", () => {
      render(<Header />);

      expect(screen.getByText("Match History")).toBeInTheDocument();
      const historyIcons = screen.getAllByTestId("history-icon");
      expect(historyIcons.length).toBeGreaterThan(0);
    });

    it("renders Log out menu item", () => {
      render(<Header />);

      expect(screen.getByText("Log out")).toBeInTheDocument();
      expect(screen.getByTestId("logout-icon")).toBeInTheDocument();
    });

    it("Profile link points to /profile", () => {
      render(<Header />);

      const profileLink = screen.getByText("Profile").closest("a");
      expect(profileLink).toHaveAttribute("href", "/profile");
    });

    it("Match History link points to /matchhistory", () => {
      render(<Header />);

      const historyLink = screen.getByText("Match History").closest("a");
      expect(historyLink).toHaveAttribute("href", "/matchhistory");
    });

    it("renders dropdown separators", () => {
      render(<Header />);

      const separators = screen.getAllByTestId("dropdown-separator");
      expect(separators).toHaveLength(2);
    });
  });

  describe("Logout functionality", () => {
    it("calls signOut when logout is clicked", async () => {
      render(<Header />);

      const logoutItems = screen.getAllByTestId("dropdown-item");
      const logoutItem = logoutItems.find((item) =>
        item.textContent?.includes("Log out")
      );

      fireEvent.click(logoutItem!);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Styling", () => {
    it("applies header styling classes", () => {
      const { container } = render(<Header />);

      const header = container.querySelector("header");
      expect(header).toHaveClass(
        "sticky",
        "top-0",
        "z-50",
        "w-full",
        "border-b",
        "border-blue-800/30",
        "bg-slate-900/50",
        "backdrop-blur-sm"
      );
    });

    it("renders content in max-width container", () => {
      const { container } = render(<Header />);

      const maxWidthDiv = container.querySelector(".max-w-7xl");
      expect(maxWidthDiv).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles user with no name or email", () => {
      useUser.mockReturnValue({
        user: { id: "123", name: null, email: null, avatar_url: null },
      });

      render(<Header />);

      const fallback = screen.getByTestId("avatar-fallback");
      expect(fallback).toHaveTextContent("U");
    });

    it("renders User label when name is missing", () => {
      useUser.mockReturnValue({
        user: { ...mockUser, name: null },
      });

      render(<Header />);

      expect(screen.getByText("User")).toBeInTheDocument();
    });
  });
});
