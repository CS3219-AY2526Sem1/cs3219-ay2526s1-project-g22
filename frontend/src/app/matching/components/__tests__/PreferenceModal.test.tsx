import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PreferenceModal } from "../PreferenceModal";

describe("PreferenceModal", () => {
  const mockOnClose = jest.fn();
  const mockOnSaved = jest.fn();
  const mockUserId = "test-user-123";

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
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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

  it("loads existing preferences when modal opens", async () => {
    const mockPreferences = {
      userId: mockUserId,
      topics: ["React", "TypeScript"],
      difficulty: "hard" as const,
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => mockPreferences,
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
        `http://localhost:8000/api/matching-service/preferences/${mockUserId}`
      );
    });

    await waitFor(() => {
      const input = screen.getByPlaceholderText(
        "e.g., React, TypeScript, Algorithms"
      ) as HTMLInputElement;
      expect(input.value).toBe("React, TypeScript");
    });

    const hardButton = screen.getByRole("button", { name: "Hard" });
    expect(hardButton).toHaveAttribute("aria-pressed", "true");
  });

  it("handles 404 response by setting default values", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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
      const input = screen.getByPlaceholderText(
        "e.g., React, TypeScript, Algorithms"
      ) as HTMLInputElement;
      expect(input.value).toBe("");
    });

    const mediumButton = screen.getByRole("button", { name: "Medium" });
    expect(mediumButton).toHaveAttribute("aria-pressed", "true");
  });

  it("displays error when loading preferences fails", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

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

  it("displays loading state while fetching preferences", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 404,
                ok: false,
              }),
            100
          )
        )
    );

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

  it("updates topics input when user types", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "React, Node.js" } });

    expect(input.value).toBe("React, Node.js");
  });

  it("changes difficulty when difficulty button is clicked", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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

  it("disables Save button when topics are empty", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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

  it("enables Save button when topics are provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, { target: { value: "React" } });

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    }) as HTMLButtonElement;

    expect(saveButton.disabled).toBe(false);
  });

  it("saves preferences successfully", async () => {
    const savedPreferences = {
      userId: mockUserId,
      topics: ["React", "TypeScript"],
      difficulty: "medium" as const,
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => savedPreferences,
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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, { target: { value: "React, TypeScript" } });

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/matching-service/preferences/${mockUserId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topics: ["React", "TypeScript"],
            difficulty: "medium",
          }),
        }
      );
    });

    await waitFor(() => {
      expect(mockOnSaved).toHaveBeenCalledWith(savedPreferences);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("displays error when save fails", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
      })
      .mockRejectedValueOnce(new Error("Save failed"));

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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, { target: { value: "React" } });

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
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
      })
      .mockResolvedValueOnce({
        status: 400,
        ok: false,
        text: async () => "Invalid topics",
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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, { target: { value: "React" } });

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid topics")).toBeInTheDocument();
    });
  });

  it("shows Saving... text while saving", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 200,
                  ok: true,
                  json: async () => ({
                    userId: mockUserId,
                    topics: ["React"],
                    difficulty: "medium",
                  }),
                }),
              100
            )
          )
      );

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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, { target: { value: "React" } });

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
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  status: 200,
                  ok: true,
                  json: async () => ({
                    userId: mockUserId,
                    topics: ["React"],
                    difficulty: "medium",
                  }),
                }),
              100
            )
          )
      );

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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, { target: { value: "React" } });

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

  it("trims and filters topics correctly", async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        status: 404,
        ok: false,
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: async () => ({
          userId: mockUserId,
          topics: ["React", "TypeScript"],
          difficulty: "medium",
        }),
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
        screen.getByPlaceholderText("e.g., React, TypeScript, Algorithms")
      ).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(
      "e.g., React, TypeScript, Algorithms"
    );
    fireEvent.change(input, {
      target: { value: " React , , TypeScript , " },
    });

    const saveButton = screen.getByRole("button", {
      name: "Save Preferences",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            topics: ["React", "TypeScript"],
            difficulty: "medium",
          }),
        })
      );
    });
  });

  it("has correct accessibility attributes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      status: 404,
      ok: false,
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
