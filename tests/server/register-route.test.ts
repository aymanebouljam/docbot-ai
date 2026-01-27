import { POST } from "@/app/api/register/route";
import { disconnectDatabase, resetDatabase } from "../support/database";

describe("register route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creates a user account", async () => {
    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Aymane Test",
          email: "aymane@example.com",
          password: "securepass123",
        }),
      })
    );

    const body = (await response.json()) as {
      user: { id: string; email: string; name: string };
    };

    expect(response.status).toBe(201);
    expect(body.user.email).toBe("aymane@example.com");
    expect(body.user.name).toBe("Aymane Test");
  });

  it("rejects duplicate emails", async () => {
    await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Aymane Test",
          email: "aymane@example.com",
          password: "securepass123",
        }),
      })
    );

    const response = await POST(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Another User",
          email: "aymane@example.com",
          password: "securepass123",
        }),
      })
    );

    expect(response.status).toBe(409);
  });
});
