import type { Chat, Message } from "@/generated/prisma/client";
import { MessageRole } from "@/generated/prisma/enums";
import { getPrismaClient } from "@/lib/prisma";

export type ChatWithMessages = Chat & { messages: Message[] };
export type ChatListItem = Pick<
  Chat,
  "id" | "title" | "updatedAt" | "createdAt"
>;

export type CreateChatInput = {
  userId: string;
  title?: string;
};

export type SaveMessageInput = {
  userId: string;
  chatId: string;
  role: MessageRole;
  content: string;
};

export async function createChat(input: CreateChatInput) {
  const prisma = getPrismaClient();

  return prisma.chat.create({
    data: {
      userId: input.userId,
      title: input.title ?? null,
    },
  });
}

export async function saveMessage(input: SaveMessageInput) {
  const prisma = getPrismaClient();

  return prisma.$transaction(async (tx) => {
    const existingChat = await tx.chat.findFirst({
      where: { id: input.chatId, userId: input.userId },
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
  chatId: string,
  userId: string
): Promise<ChatWithMessages | null> {
  const prisma = getPrismaClient();

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });

  return chat?.userId === userId ? chat : null;
}

export async function listChats(userId: string): Promise<ChatListItem[]> {
  const prisma = getPrismaClient();

  return prisma.chat.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true,
    },
  });
}

export async function updateChatTitle(input: {
  chatId: string;
  title: string;
  userId: string;
}) {
  const prisma = getPrismaClient();

  const existingChat = await prisma.chat.findFirst({
    where: { id: input.chatId, userId: input.userId },
    select: { id: true },
  });

  if (!existingChat) {
    return null;
  }

  return prisma.chat.update({
    where: { id: input.chatId },
    data: {
      title: input.title,
      updatedAt: new Date(),
    },
  });
}

export async function deleteChat(chatId: string, userId: string) {
  const prisma = getPrismaClient();

  const existingChat = await prisma.chat.findFirst({
    where: { id: chatId, userId },
    select: { id: true },
  });

  if (!existingChat) {
    return null;
  }

  return prisma.chat.delete({
    where: { id: chatId },
  });
}

export async function deleteAllChats(userId: string) {
  const prisma = getPrismaClient();

  return prisma.chat.deleteMany({
    where: { userId },
  });
}
