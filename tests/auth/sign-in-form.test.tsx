import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SignInForm } from "@/features/auth/components/sign-in-form";

const { push, signIn } = vi.hoisted(() => ({
  push: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

vi.mock("next-auth/react", () => ({
  signIn,
}));

describe("sign-in form", () => {
  beforeEach(() => {
    push.mockReset();
    signIn.mockReset();
  });

  it("shows an inline error when credentials are invalid", async () => {
    signIn.mockResolvedValue({
      error: "CredentialsSignin",
      ok: false,
      status: 401,
      url: null,
    });

    const user = userEvent.setup();

    render(<SignInForm callbackUrl="/" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        /email or password is incorrect/i
      )
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects after a successful login", async () => {
    signIn.mockResolvedValue({
      error: undefined,
      ok: true,
      status: 200,
      url: "/",
    });

    const user = userEvent.setup();

    render(<SignInForm callbackUrl="/" />);

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.type(screen.getByLabelText(/password/i), "correctpass");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
  });
});
