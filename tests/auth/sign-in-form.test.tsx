import { render, screen } from "@testing-library/react";

import { SignInForm } from "@/features/auth/components/sign-in-form";

describe("sign-in form", () => {
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

  it("renders a native login form with the callback field", async () => {
    render(<SignInForm callbackUrl="/profile" />);

    const submitButton = await screen.findByRole("button", { name: /log in/i });
    expect(submitButton).toBeEnabled();

    const callbackInput = document.querySelector(
      'input[name="callbackUrl"]'
    ) as HTMLInputElement | null;
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement | null;
    const nativeForm = callbackInput?.form;

    expect(nativeForm?.getAttribute("action")).toBe("/api/login");
    expect(nativeForm?.getAttribute("method")).toBe("POST");
    expect(callbackInput?.value).toBe("/profile");
    expect(emailInput).toBeInTheDocument();
    expect(nativeForm).toBeTruthy();
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
      /your account is ready\. log in to continue\./i
    );
    expect(screen.getByDisplayValue("user@example.com")).toBeInTheDocument();
  });
});
