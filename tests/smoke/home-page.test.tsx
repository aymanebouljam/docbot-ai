import { render, screen } from "@testing-library/react";

import Home from "@/app/page";

describe("home page", () => {
  it("renders the DocBot AI smoke screen", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /medical-only chat assistant/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/does not diagnose or replace professional medical care/i)
    ).toBeInTheDocument();
  });
});
