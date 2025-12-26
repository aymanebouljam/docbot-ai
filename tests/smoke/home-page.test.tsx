import { render, screen } from "@testing-library/react";

import Home from "@/app/page";

describe("home page", () => {
  it("renders the slice 1 chat shell", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /medical-only chat assistant/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /new medical conversation/i })
    ).toBeInTheDocument();
  });
});
