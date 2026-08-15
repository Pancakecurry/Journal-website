import { DeskSurface, Sheet, Label } from "@/design-system/surfaces";

export default function Loading() {
  return (
    <DeskSurface>
      <Sheet aria-busy="true" aria-live="polite">
        <Label>Getting your notebook</Label>
        <p>Putting your local pages back where you left them…</p>
      </Sheet>
    </DeskSurface>
  );
}
