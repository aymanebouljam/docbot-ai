import { render, screen } from "@testing-library/react";

import SignInPage from "@/app/sign-in/page";

vi.mock("@/server/auth", () => ({
  getServerAuthSession: vi.fn(async () => null),
}));

describe("sign-in page", () => {
  it("renders the custom sign-in form", async () => {
    render(await SignInPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /secure medical workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
