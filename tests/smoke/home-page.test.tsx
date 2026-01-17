import { render, screen, waitFor } from "@testing-library/react";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

describe("home page", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          chats: [],
        }),
        { status: 200 }
      );
    });
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("renders the chat shell", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /medical workspace/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /new medical conversation/i })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(
        screen.getByText(/no saved chats yet\. start with a medical question/i)
      ).toBeInTheDocument()
    );
  });
});
