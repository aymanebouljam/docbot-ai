import { ChatShell } from "@/features/chat/components/chat-shell";
import { getAuthenticatedUser, getServerAuthSession } from "@/server/auth";
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
  const user = await getAuthenticatedUser();

  return (
    <ChatShell
      initialChatId={initialChatId ?? null}
      currentUserEmail={user?.email ?? session.user?.email ?? undefined}
      currentUserName={user?.name ?? session.user?.name ?? undefined}
      currentUserImage={user?.image ?? session.user?.image ?? undefined}
    />
  );
}
