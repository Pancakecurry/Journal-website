import Link from "next/link";
import { DeskSurface, FocusPaper, Label } from "@/design-system/surfaces";

export default function NotFound() {
  return (
    <DeskSurface>
      <FocusPaper>
        <Label>Page not found</Label>
        <h1>That page is not in this notebook.</h1>
        <p>No journal data was changed.</p>
        <Link href="/today">Return to Today</Link>
      </FocusPaper>
    </DeskSurface>
  );
}
