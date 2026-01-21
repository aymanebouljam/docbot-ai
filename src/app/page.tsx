import { ChatShell } from "@/features/chat/components/chat-shell";
import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";

type HomePageProps = {
  searchParams: Promise<{ chatId?: string | string[] | undefined }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/sign-in");
  }

  const resolvedSearchParams = await searchParams;
  const initialChatId = Array.isArray(resolvedSearchParams.chatId)
    ? resolvedSearchParams.chatId[0]
    : resolvedSearchParams.chatId;

  return (
    <ChatShell
      initialChatId={initialChatId ?? null}
      currentUserEmail={session.user?.email ?? undefined}
      currentUserName={session.user?.name ?? undefined}
    />
  );
}
