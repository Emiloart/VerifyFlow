import { auth } from "../../auth";
import { RequireSignIn, OnboardingFlow } from "../components";

export default async function OnboardingPage() {
  const session = await auth();
  if (session?.user?.email === undefined) {
    return <RequireSignIn />;
  }

  return <OnboardingFlow mode="basic" />;
}

