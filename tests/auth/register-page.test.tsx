import { render, screen } from "@testing-library/react";

import RegisterPage from "@/app/register/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  redirect: vi.fn(),
}));

vi.mock("@/server/auth-user", () => ({
  getAuthenticatedUser: vi.fn(async () => null),
}));

describe("register page", () => {
  it("renders the register form", async () => {
    render(await RegisterPage());

    expect(
      screen.getByRole("heading", { name: /create your account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
  });
});
