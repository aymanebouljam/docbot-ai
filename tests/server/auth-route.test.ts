import { POST as LOGIN } from "@/app/api/auth/login/route";
import { POST as LOGOUT } from "@/app/api/auth/logout/route";
import { POST as REGISTER } from "@/app/api/auth/register/route";
import { GET as SESSION } from "@/app/api/auth/session/route";
import { getUserByEmail } from "@/server/user-repository";
import {
  createAuthCookieForUser,
  createTestUser,
  disconnectDatabase,
  resetDatabase,
} from "../support/database";

describe("auth routes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("registers a new user", async () => {
    const response = await REGISTER(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Aymane",
          email: "aymane@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(await getUserByEmail("aymane@example.com")).toBeTruthy();
  });

  it("rejects duplicate registration", async () => {
    await createTestUser({
      email: "aymane@example.com",
    });

    const response = await REGISTER(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Aymane",
          email: "aymane@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(409);
  });

  it("logs in a user with valid credentials", async () => {
    await createTestUser({
      email: "aymane@example.com",
      password: "password123",
    });

    const response = await LOGIN(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "aymane@example.com",
          password: "password123",
        }),
      })
    );

    expect(response.status).toBe(200);
  });

  it("rejects login with invalid credentials", async () => {
    await createTestUser({
      email: "aymane@example.com",
      password: "password123",
    });

    const response = await LOGIN(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "aymane@example.com",
          password: "wrong-password",
        }),
      })
    );

    expect(response.status).toBe(401);
  });

  it("returns authenticated session details for signed-in user", async () => {
    const { user } = await createTestUser({
      email: "aymane@example.com",
    });
    const cookie = createAuthCookieForUser(user.id);

    const response = await SESSION(
      new Request("http://localhost/api/auth/session", {
        headers: {
          Cookie: cookie,
        },
      })
    );
    const body = (await response.json()) as {
      authenticated: boolean;
      user?: { id: string; email: string };
    };

    expect(response.status).toBe(200);
    expect(body.authenticated).toBe(true);
    expect(body.user?.id).toBe(user.id);
  });

  it("logs out without error", async () => {
    const response = await LOGOUT();
    expect(response.status).toBe(200);
  });
});
