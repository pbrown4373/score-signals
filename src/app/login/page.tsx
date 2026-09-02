import { AuthPage } from "@/components/auth-page";
import { loginAction } from "@/modules/auth/actions";
import { AuthForm } from "@/modules/auth/auth-form";

export default function LoginPage() {
  return (
    <AuthPage
      description="Continue to your private creative intelligence workspace."
      title="Welcome back"
    >
      <AuthForm action={loginAction} mode="login" />
    </AuthPage>
  );
}
