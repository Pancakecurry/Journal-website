import Link from "next/link";
import { DeskSurface, FocusPaper, Label } from "@/design-system/surfaces";

export default function AuthFoundationPage() {
  return (
    <DeskSurface>
      <FocusPaper>
        <Label>Private account foundation</Label>
        <h1>Your journal stays yours.</h1>
        <p>
          Authentication is structurally prepared, but no account provider is configured in this
          local checkout. Add the documented Supabase public environment values before implementing
          sign-in flows.
        </p>
        <Link href="/today">Continue to the local foundation</Link>
      </FocusPaper>
    </DeskSurface>
  );
}
