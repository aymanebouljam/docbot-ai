import type { Chat, Message } from "@/generated/prisma/client";
import { MessageRole } from "@/generated/prisma/enums";
import { getPrismaClient } from "@/lib/prisma";

export type ChatWithMessages = Chat & { messages: Message[] };
export type ChatListItem = Pick<Chat, "id" | "title" | "updatedAt" | "createdAt">;

export type CreateChatInput = {
  title?: string;
};

export type SaveMessageInput = {
  chatId: string;
  role: MessageRole;
  content: string;
};

export async function createChat(input: CreateChatInput = {}) {
  const prisma = getPrismaClient();

  return prisma.chat.create({
    data: {
      title: input.title ?? null,
    },
  });
}

export async function saveMessage(input: SaveMessageInput) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const existingChat = await tx.chat.findUnique({
      where: { id: input.chatId },
      select: { id: true },
    });

    if (!existingChat) {
      return null;
    }

    const message = await tx.message.create({
      data: {
        chatId: input.chatId,
        role: input.role,
        content: input.content,
      },
    });

    await tx.chat.update({
      where: { id: input.chatId },
      data: {
        updatedAt: new Date(),
      },
    });

    return message;
  });
}

export async function getChatById(
  chatId: string
): Promise<ChatWithMessages | null> {
  const prisma = getPrismaClient();

  return prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });
}

export async function listChats(): Promise<ChatListItem[]> {
  const prisma = getPrismaClient();

  return prisma.chat.findMany({
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function updateChatTitle(input: { chatId: string; title: string }) {
  const prisma = getPrismaClient();

  return prisma.chat.update({
    where: { id: input.chatId },
    data: {
      title: input.title,
      updatedAt: new Date(),
    },
  });
}

export async function deleteChat(chatId: string) {
  const prisma = getPrismaClient();

  return prisma.chat.delete({
    where: { id: chatId },
  });
}
