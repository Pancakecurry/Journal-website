import { DeskSurface, Sheet, Label } from "@/design-system/surfaces";

export default function Loading() {
  return (
    <DeskSurface>
      <Sheet aria-busy="true" aria-live="polite">
        <Label>Opening your notebook</Label>
        <p>Restoring what is available on this device…</p>
      </Sheet>
    </DeskSurface>
  );
}
