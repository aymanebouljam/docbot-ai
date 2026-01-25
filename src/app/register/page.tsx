import { redirect } from "next/navigation";

import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getServerAuthSession } from "@/server/auth";

export default async function RegisterPage() {
  const session = await getServerAuthSession();

  if (session) {
    redirect("/");
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start your medical conversations with DocBot."
    >
      <RegisterForm />
    </AuthShell>
  );
}
