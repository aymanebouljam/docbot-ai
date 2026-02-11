import { render, screen } from "@testing-library/react";

import ProfilePage from "@/app/profile/page";

vi.mock("@/server/auth", () => ({
  getAuthenticatedUser: vi.fn(async () => ({
    id: "profile-user-id",
    name: "Profile User",
    email: "profile@example.com",
    image: null,
  })),
}));

describe("profile page", () => {
  it("renders the editable profile form", async () => {
    render(await ProfilePage());

    expect(
      screen.getByRole("heading", { name: /profile/i })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Profile User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("profile@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save changes/i })
    ).toBeInTheDocument();
  });
});
