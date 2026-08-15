export function storageFailureMessage(error: unknown, fallback: string) {
  const name =
    error instanceof DOMException ? error.name : error instanceof Error ? error.name : "";
  const text = error instanceof Error ? error.message : "";
  if (name === "QuotaExceededError" || /quota|storage.*full/i.test(text))
    return "This device is short on storage. Your draft is still here; remove some files or export first, then try again.";
  return error instanceof Error && error.message ? error.message : fallback;
}
