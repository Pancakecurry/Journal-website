import Link from "next/link";
import { DeskSurface, FocusPaper, Label } from "@/design-system/surfaces";

export default function NotFound() {
  return (
    <DeskSurface>
      <FocusPaper>
        <Label>Page not found</Label>
        <h1>That page has wandered off.</h1>
        <p>Your journal is fine. This link just leads nowhere useful.</p>
        <Link href="/today">Back to today</Link>
      </FocusPaper>
    </DeskSurface>
  );
}
