import { fireEvent, render, screen } from "@testing-library/react";

import { SignInForm } from "@/features/auth/components/sign-in-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push,
  }),
}));

describe("sign-in form", () => {
  beforeEach(() => {
    push.mockReset();
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

    expect(push).toHaveBeenCalledWith("/profile");
  });

  it("shows the registration success message when redirected from sign-up", async () => {
    render(
      <SignInForm
        callbackUrl="/"
        registered
        initialEmail="user@example.com"
      />
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      /you're all set\. continue to docbot\./i
    );
    expect(screen.getByDisplayValue("user@example.com")).toBeInTheDocument();
  });
});
