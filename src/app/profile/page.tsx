import { redirect } from "next/navigation";

import { ProfileForm } from "@/features/profile/components/profile-form";
import { getAuthenticatedUser } from "@/server/auth";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <ProfileForm
      initialUser={{
        name: user.name,
        email: user.email,
        image: user.image ?? null,
      }}
    />
  );
}
