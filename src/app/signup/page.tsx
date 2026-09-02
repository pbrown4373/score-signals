import { AuthPage } from "@/components/auth-page";
import { signupAction } from "@/modules/auth/actions";
import { AuthForm } from "@/modules/auth/auth-form";

export default function SignupPage() {
  return (
    <AuthPage
      description="Create your account and private workspace. No demo or onboarding call required."
      title="Start with SCORE"
    >
      <AuthForm action={signupAction} mode="signup" />
    </AuthPage>
  );
}
