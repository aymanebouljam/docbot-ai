import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SignInForm } from "@/features/auth/components/sign-in-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("sign-in form", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    push.mockReset();
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify({}), { status: 200 })
    );
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("shows an inline error from the provided props", async () => {
    render(
      <SignInForm
        callbackUrl="/"
        initialErrorMessage="The email or password is incorrect."
      />
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /email or password is incorrect/i
    );
  });

  it("routes to the callback destination on submit", async () => {
    render(<SignInForm callbackUrl="/profile" />);

    const submitButton = await screen.findByRole("button", { name: /log in/i });
    expect(submitButton).toBeEnabled();

    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "",
        password: "",
      }),
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/profile"));
  });

  it("shows the registration success message when redirected from sign-up", async () => {
    render(
      <SignInForm callbackUrl="/" registered initialEmail="user@example.com" />
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /you're all set\. continue to docbot\./i
    );
    expect(screen.getByDisplayValue("user@example.com")).toBeInTheDocument();
  });

  it("renders a server error when login fails", async () => {
    global.fetch = vi.fn(
      async () => new Response(JSON.stringify({}), { status: 401 })
    );
    render(<SignInForm callbackUrl="/profile" />);

    fireEvent.submit(
      screen
        .getByRole("button", { name: /log in/i })
        .closest("form") as HTMLFormElement
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /email or password is incorrect/i
    );
    expect(push).not.toHaveBeenCalled();
  });
});
