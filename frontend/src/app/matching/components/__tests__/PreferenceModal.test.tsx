/*
AI Assistance Disclosure:
Tool: Github Copilot, date: 2025-09-25
Scope: Suggested tests covering a few edge cases specified by the user.
Author review: I verified correctness of the modifications by AI against requirements. I resolved small issues, debugged UI interactions, and verified changes locally.
*/
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PreferenceModal } from "../PreferenceModal";

describe("PreferenceModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSaved = jest.fn();
  const mockUserId = "test-user-123";

  const mockTopics = ["Arrays", "Strings", "Dynamic Programming", "Graphs"];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(
      <PreferenceModal
        userId={mockUserId}
        open={false}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders modal when open is true", async () => {
    // Mock topics fetch
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      // preferences fetch - 404 for new user
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(screen.getByText("Match Preferences")).toBeInTheDocument();
    expect(
      screen.getByText("Choose topics and difficulty to improve your matches.")
    ).toBeInTheDocument();
  });

  it("loads and displays available topics", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/questions/topics")
      );
    });

    await waitFor(() => {
      mockTopics.forEach((topic) => {
        expect(screen.getByText(topic)).toBeInTheDocument();
      });
    });
  });

  it("loads existing preferences when modal opens", async () => {
    const mockPreferences = {
      userId: mockUserId,
      topics: ["Arrays", "Strings"],
      difficulty: "hard" as const,
    };

    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      if (url.includes("/preferences/")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockPreferences,
        });
      }
      return Promise.resolve({ status: 404, ok: false });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/preferences/${mockUserId}`)
      );
    });

    await waitFor(() => {
      const arraysButton = screen.getByRole("button", { name: "Arrays" });
      expect(arraysButton).toHaveAttribute("aria-pressed", "true");

      const stringsButton = screen.getByRole("button", { name: "Strings" });
      expect(stringsButton).toHaveAttribute("aria-pressed", "true");
    });

    const hardButton = screen.getByRole("button", { name: "Hard" });
    expect(hardButton).toHaveAttribute("aria-pressed", "true");
  });

  it("handles 404 response by setting default values", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      const mediumButton = screen.getByRole("button", { name: "Medium" });
      expect(mediumButton).toHaveAttribute("aria-pressed", "true");
    });

    // All topic buttons should be unselected
    await waitFor(() => {
      mockTopics.forEach((topic) => {
        const button = screen.getByRole("button", { name: topic });
        expect(button).toHaveAttribute("aria-pressed", "false");
      });
    });
  });

  it("displays error when loading preferences fails", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.reject(new Error("Network error"));
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("displays error when loading topics fails", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 404,
          ok: false,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load topics list (404)")
      ).toBeInTheDocument();
    });
  });

  it("displays loading state while fetching preferences", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              status: 404,
              ok: false,
            }),
          100
        )
      );
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    expect(screen.getByText("Loading preferences…")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.queryByText("Loading preferences…")
      ).not.toBeInTheDocument();
    });
  });

  it("toggles topic selection when topic button is clicked", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    const arraysButton = screen.getByRole("button", { name: "Arrays" });

    // Initially not selected
    expect(arraysButton).toHaveAttribute("aria-pressed", "false");

    // Click to select
    fireEvent.click(arraysButton);
    expect(arraysButton).toHaveAttribute("aria-pressed", "true");

    // Click again to deselect
    fireEvent.click(arraysButton);
    expect(arraysButton).toHaveAttribute("aria-pressed", "false");
  });

  it("changes difficulty when difficulty button is clicked", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Easy" })).toBeInTheDocument();
    });

    const easyButton = screen.getByRole("button", { name: "Easy" });
    const mediumButton = screen.getByRole("button", { name: "Medium" });
    const hardButton = screen.getByRole("button", { name: "Hard" });

    // Medium is default
    expect(mediumButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(easyButton);
    expect(easyButton).toHaveAttribute("aria-pressed", "true");
    expect(mediumButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(hardButton);
    expect(hardButton).toHaveAttribute("aria-pressed", "true");
    expect(easyButton).toHaveAttribute("aria-pressed", "false");
  });

  it("closes modal when Cancel button is clicked", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("closes modal when Escape key is pressed", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "Escape" });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("disables Save button when no topics are selected", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Save Preferences" })
      ).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    }) as HTMLButtonElement;

    expect(saveButton.disabled).toBe(true);
  });

  it("enables Save button when at least one topic is selected", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    const arraysButton = screen.getByRole("button", { name: "Arrays" });
    fireEvent.click(arraysButton);

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    }) as HTMLButtonElement;

    expect(saveButton.disabled).toBe(false);
  });

  it("saves preferences successfully", async () => {
    const savedPreferences = {
      userId: mockUserId,
      topics: ["Arrays", "Strings"],
      difficulty: "medium" as const,
    };

    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      if (url.includes("/preferences/") && options?.method === "POST") {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => savedPreferences,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    // Select topics
    fireEvent.click(screen.getByRole("button", { name: "Arrays" }));
    fireEvent.click(screen.getByRole("button", { name: "Strings" }));

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(`/preferences/${mockUserId}`),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topics: ["Arrays", "Strings"],
            difficulty: "medium",
          }),
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalledWith(savedPreferences);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("displays error when save fails", async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      if (options?.method === "POST") {
        return Promise.reject(new Error("Save failed"));
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Arrays" }));

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Save failed")).toBeInTheDocument();
    });

    expect(mockOnSaved).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it("displays validation error from server", async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      if (options?.method === "POST") {
        return Promise.resolve({
          status: 400,
          ok: false,
          text: async () => "Invalid topics",
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Arrays" }));

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid topics")).toBeInTheDocument();
    });
  });

  it("shows Saving... text while saving", async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      if (options?.method === "POST") {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 200,
                ok: true,
                json: async () => ({
                  userId: mockUserId,
                  topics: ["Arrays"],
                  difficulty: "medium",
                }),
              }),
            100
          )
        );
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Arrays" }));

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText("Saving...")).not.toBeInTheDocument();
    });
  });

  it("disables buttons while saving", async () => {
    (global.fetch as jest.Mock).mockImplementation((url, options) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      if (options?.method === "POST") {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 200,
                ok: true,
                json: async () => ({
                  userId: mockUserId,
                  topics: ["Arrays"],
                  difficulty: "medium",
                }),
              }),
            100
          )
        );
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Arrays" })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Arrays" }));

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        (screen.getByRole("button", { name: "Saving..." }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
      expect((cancelButton as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("has correct accessibility attributes", async () => {
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes("/topics")) {
        return Promise.resolve({
          status: 200,
          ok: true,
          json: async () => mockTopics,
        });
      }
      return Promise.resolve({
        status: 404,
        ok: false,
      });
    });

    render(
      <PreferenceModal
        userId={mockUserId}
        open={true}
        onClose={mockOnClose}
        onSaved={mockOnSaved}
      />
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "pref-title");
    expect(dialog).toHaveAttribute("aria-describedby", "pref-desc");
  });
});
