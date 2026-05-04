import { auth } from "../../auth";
import { RequireSignIn, UpgradeFlow } from "../components";

export default async function UpgradePage() {
  const session = await auth();
  if (session?.user?.email === undefined) {
    return <RequireSignIn />;
  }

  return <UpgradeFlow />;
}

