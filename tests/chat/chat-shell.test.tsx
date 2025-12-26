import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ChatShell } from "@/features/chat/components/chat-shell";

describe("chat shell", () => {
  it("renders the chat input", () => {
    render(<ChatShell />);

    expect(
      screen.getByLabelText(/your medical question/i)
    ).toBeInTheDocument();
  });

  it("disables the send button when the textarea is empty", () => {
    render(<ChatShell />);

    expect(screen.getByRole("button", { name: /send/i })).toBeDisabled();
  });

  it("shows the user message immediately after submit", async () => {
    const user = userEvent.setup();

    render(<ChatShell />);

    await user.type(
      screen.getByLabelText(/your medical question/i),
      "What causes low iron?"
    );
    await user.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByText("What causes low iron?")).toBeInTheDocument();
  });

  it("shows a loading indicator while awaiting an assistant reply", async () => {
    vi.useFakeTimers();

    render(<ChatShell />);

    fireEvent.change(screen.getByLabelText(/your medical question/i), {
      target: { value: "Can dehydration cause dizziness?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("status")).toHaveTextContent(
      /drafting a medical response/i
    );

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(
      screen.getByText(/medical answer generation will be connected/i)
    ).toBeInTheDocument();

    vi.useRealTimers();
  });
});
