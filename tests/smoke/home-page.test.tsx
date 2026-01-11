import { render, screen } from "@testing-library/react";

import Home from "@/app/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

describe("home page", () => {
  it("renders the slice 7 chat shell", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: /medical-only chat assistant/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /new medical conversation/i })
    ).toBeInTheDocument();
  });
});
