"use client";

import { useMemo, useState } from "react";
import type { KeepsakeSource } from "@/domain/personal-world";
import type { LocalDate } from "@/domain/shared";
import { getApplicationDatabase } from "@/infrastructure/local/database";
import { LocalPersonalWorldRepository } from "@/infrastructure/local/personal-world-repository";
import { LOCAL_FOUNDATION_USER_ID } from "@/lib/journal-session";

export function KeepsakeButton(props: {
  sourceType: KeepsakeSource;
  sourceId: string;
  dayId?: string | null;
  localDate?: LocalDate | null;
  month?: string | null;
  title: string;
  preview?: string;
}) {
  const repository = useMemo(() => new LocalPersonalWorldRepository(getApplicationDatabase()), []);
  const [status, setStatus] = useState("Keep this");
  return (
    <button
      type="button"
      aria-label={`Keep ${props.title}`}
      onClick={async () => {
        await repository.addKeepsake({ userId: LOCAL_FOUNDATION_USER_ID, ...props });
        setStatus("Tucked away");
      }}
    >
      {status}
    </button>
  );
}
