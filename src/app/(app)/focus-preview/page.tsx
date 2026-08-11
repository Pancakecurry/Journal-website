import type { Metadata } from "next";
import { DeskSurface, FocusPaper, Label, Highlight } from "@/design-system/surfaces";

export const metadata: Metadata = { title: "Paper intensity preview" };

export default function FocusPreviewPage() {
  return (
    <DeskSurface>
      <FocusPaper>
        <Label>Paper intensity · foundation fixture</Label>
        <h1>When the writing begins, the desk grows quiet.</h1>
        <p>
          This non-production fixture confirms that the same ink, paper, and spacing system can move
          from expressive surfaces into a focused reading mode. It is{" "}
          <Highlight>not the journal editor</Highlight>.
        </p>
      </FocusPaper>
    </DeskSurface>
  );
}
