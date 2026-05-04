import { auth } from "../../auth";
import { RequireSignIn, SettingsView } from "../components";

export default async function SettingsPage() {
  const session = await auth();
  if (typeof session?.user?.email !== "string") {
    return <RequireSignIn />;
  }

  return <SettingsView email={session.user.email} />;
}
