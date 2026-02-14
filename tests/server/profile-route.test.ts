import { GET, PATCH } from "@/app/api/profile/route";
import { getUserById } from "@/server/user-repository";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/database";

describe("profile route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns the local profile", async () => {
    await createTestUser({
      id: "local-docbot-user",
      name: "Profile User",
      email: "profile@example.com",
    });

    const response = await GET();
    const body = (await response.json()) as {
      user: { name: string; email: string; image: string | null };
    };

    expect(response.status).toBe(200);
    expect(body.user.name).toBe("Profile User");
    expect(body.user.email).toBe("profile@example.com");
  });

  it("updates name, email, image, and password", async () => {
    await createTestUser({
      id: "local-docbot-user",
      name: "Profile User",
      email: "profile@example.com",
    });

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated User",
          email: "updated@example.com",
          image: "data:image/png;base64,abc123",
          currentPassword: "password123",
          newPassword: "newsecurepass123",
        }),
      })
    );

    expect(response.status).toBe(200);

    const updatedUser = await getUserById("local-docbot-user");

    expect(updatedUser?.name).toBe("Updated User");
    expect(updatedUser?.email).toBe("updated@example.com");
    expect(updatedUser?.image).toBe("data:image/png;base64,abc123");
  });

  it("rejects an incomplete password update payload", async () => {
    await createTestUser({
      id: "local-docbot-user",
      name: "Profile User",
      email: "profile@example.com",
    });

    const response = await PATCH(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated User",
          email: "profile@example.com",
          newPassword: "newsecurepass123",
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
