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
  beforeEach(() => {
    push.mockReset();
  });

  it("routes to sign in with the entered email", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/full name/i), "Aymane");
    await user.type(screen.getByLabelText(/^email$/i), "aymane@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(push).toHaveBeenCalledWith(
      "/sign-in?registered=1&email=aymane%40example.com"
    );
  });
});
