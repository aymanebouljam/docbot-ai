import { render, screen, waitFor } from "@testing-library/react";

import Home from "@/app/page";

vi.mock("@/server/auth", () => ({
  getServerAuthSession: vi.fn(async () => ({
    user: {
      id: "test-user-id",
      name: "Test User",
      email: "user@example.com",
    },
  })),
  getAuthenticatedUser: vi.fn(async () => ({
    id: "test-user-id",
    name: "Test User",
    email: "user@example.com",
    image: null,
  })),
}));

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

    expect(screen.getByRole("link", { name: /docbot/i })).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/test user/i)).toBeInTheDocument()
    );
  });
});
