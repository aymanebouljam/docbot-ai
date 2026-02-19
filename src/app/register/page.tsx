import { AuthShell } from "@/features/auth/components/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { getAuthenticatedUser } from "@/server/auth-user";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const user = await getAuthenticatedUser();

  if (user) {
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
