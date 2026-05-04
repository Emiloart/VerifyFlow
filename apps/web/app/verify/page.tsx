import { auth } from "../../auth";
import { RequireSignIn, VerifyFlow } from "../components";

export default async function VerifyPage() {
  const session = await auth();
  if (session?.user?.email === undefined) {
    return <RequireSignIn />;
  }

  return <VerifyFlow />;
}

