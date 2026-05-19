import { auth } from "../../auth";
import { RequireSignIn, OnboardingFlow } from "../components";

export default async function OnboardingPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (typeof email !== "string" || email.trim() === "") {
    return <RequireSignIn />;
  }

  return <OnboardingFlow email={email} mode="basic" />;
}
