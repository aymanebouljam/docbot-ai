import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RegisterForm } from "@/features/auth/components/register-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("register form", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    push.mockReset();
    global.fetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 201 }));
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("routes to sign in with the entered email", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Aymane");
    await user.type(screen.getByLabelText(/^email$/i), "aymane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Aymane",
        email: "aymane@example.com",
        password: "short",
      }),
    });
    expect(push).toHaveBeenCalledWith(
      "/sign-in?registered=1&email=aymane%40example.com"
    );
  });

  it("shows a useful message when the account already exists", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: "An account with this email already exists." }), {
          status: 409,
        })
    );
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Aymane");
    await user.type(screen.getByLabelText(/^email$/i), "aymane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /account with this email already exists/i
    );
    expect(push).not.toHaveBeenCalled();
  });
});
