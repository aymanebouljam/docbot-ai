import { createChatSession } from "@/server/chat-service";

type CreateChatRequestBody = {
  title?: unknown;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CreateChatRequestBody;

  const chat = await createChatSession(
    typeof body.title === "string" ? body.title.trim() : undefined
  );

  return Response.json({ chat }, { status: 201 });
}
