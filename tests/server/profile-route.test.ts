import { GET, PATCH } from "@/app/api/profile/route";
import { getUserById } from "@/server/user-repository";
import {
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/database";

vi.mock("@/server/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth")>();

  return {
    ...actual,
    getAuthenticatedUser: vi.fn(async () => ({
      id: "profile-user-id",
      name: "Profile User",
      email: "profile@example.com",
      image: null,
    })),
  };
});

describe("profile route", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("returns the authenticated profile", async () => {
    await createTestUser({
      id: "profile-user-id",
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
    const { password } = await createTestUser({
      id: "profile-user-id",
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
          currentPassword: password,
          newPassword: "newsecurepass123",
        }),
      })
    );

    expect(response.status).toBe(200);

    const updatedUser = await getUserById("profile-user-id");

    expect(updatedUser?.name).toBe("Updated User");
    expect(updatedUser?.email).toBe("updated@example.com");
    expect(updatedUser?.image).toBe("data:image/png;base64,abc123");
  });

  it("rejects an incorrect current password", async () => {
    await createTestUser({
      id: "profile-user-id",
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
          currentPassword: "wrong-password",
          newPassword: "newsecurepass123",
        }),
      })
    );

    expect(response.status).toBe(400);
  });
});
