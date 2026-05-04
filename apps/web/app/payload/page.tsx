import { auth } from "../../auth";
import { ProviderPayloadView, RequireSignIn } from "../components";

export default async function PayloadPage() {
  const session = await auth();
  if (session?.user?.email === undefined) {
    return <RequireSignIn />;
  }

  return <ProviderPayloadView />;
}

