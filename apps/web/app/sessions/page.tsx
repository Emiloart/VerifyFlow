import { auth } from "../../auth";
import { isAdminEmail } from "../../auth-policy";
import { RequireSignIn, SessionsView } from "../components";

export default async function SessionsPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (typeof email !== "string") {
    return <RequireSignIn />;
  }

  if (!isAdminEmail(email)) {
    return <RequireSignIn title="Admin access required" message="Cross-user measurement sessions require a VerifyFlow admin account." />;
  }

  return <SessionsView />;
}
