import type { SupabaseClient } from "@supabase/supabase-js";
import type { JournalDatabase } from "@/infrastructure/local/database";
import type { OutboxOperation } from "@/domain/sync";
import { refreshDayDerived } from "@/infrastructure/local/derived-indexes";

const TABLES: Record<OutboxOperation["entityType"], { remote: string; local: string }> = {
  day: { remote: "days", local: "days" },
  moment: { remote: "moments", local: "moments" },
  journal_entry: { remote: "journal_entries", local: "journalEntries" },
  media: { remote: "media", local: "media" },
  reflection: { remote: "reflections", local: "reflections" },
  preferences: { remote: "user_preferences", local: "preferences" },
  bookmark: { remote: "bookmarks", local: "bookmarks" },
  tracker_definition: { remote: "tracker_definitions", local: "trackerDefinitions" },
  tracker_entry: { remote: "tracker_entries", local: "trackerEntries" },
  monthly_reflection: { remote: "monthly_reflections", local: "monthlyReflections" },
  keepsake: { remote: "keepsakes", local: "keepsakes" },
  doodle: { remote: "doodles", local: "doodles" },
  hidden_memory: { remote: "hidden_memories", local: "hiddenMemories" },
};

export class SupabasePullService {
  constructor(
    private readonly database: JournalDatabase,
    private readonly client: SupabaseClient,
  ) {}
  async pull(userId: string) {
    const meta = await this.database.syncMeta.get(userId);
    const cursor = meta?.pullCursor ?? 0;
    const { data, error } = await this.client
      .from("sync_changes")
      .select("change_id,entity_type,entity_id")
      .gt("change_id", cursor)
      .order("change_id")
      .limit(500);
    if (error) throw new Error("Remote changes are waiting for the next sync.");
    let applied = 0;
    let next = cursor;
    for (const change of data ?? []) {
      next = Math.max(next, Number(change.change_id));
      const type = change.entity_type as OutboxOperation["entityType"];
      const target = TABLES[type];
      if (!target) continue;
      const key = type === "preferences" ? "user_id" : "id";
      const result = await this.client
        .from(target.remote)
        .select("*")
        .eq(key, change.entity_id)
        .maybeSingle();
      if (result.error || !result.data) continue;
      const remote = result.data as Record<string, unknown>;
      const localTable = this.database.table(target.local);
      const current = (await localTable.get(change.entity_id)) as
        Record<string, unknown> | undefined;
      const remoteUpdated = String(remote.client_updated_at ?? remote.created_at ?? "");
      if (
        current?.syncState === "pending" &&
        String(current.updatedAt ?? current.createdAt ?? "") > remoteUpdated
      )
        continue;
      const record = fromRemote(type, remote, current) as Record<string, unknown>;
      await localTable.put(record);
      const dayId = String(record.dayId ?? (type === "day" ? record.id : ""));
      if (dayId) await refreshDayDerived(this.database, userId, dayId);
      applied += 1;
    }
    await this.database.syncMeta.put({
      userId,
      pullCursor: next,
      lastSyncedAt: new Date().toISOString(),
    });
    return applied;
  }
}

function fromRemote(
  type: OutboxOperation["entityType"],
  row: Record<string, unknown>,
  current?: Record<string, unknown>,
) {
  const base = {
    id: String(type === "preferences" ? row.user_id : row.id),
    userId: String(row.user_id),
    version: Math.max(0, Number(row.version ?? 1) - 1),
    syncState: "synced",
    deletedAt: row.deleted_at ? String(row.deleted_at) : null,
  };
  switch (type) {
    case "day":
      return {
        ...base,
        localDate: String(row.local_date),
        timeZone: String(row.timezone),
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "moment":
      return {
        ...base,
        dayId: String(row.day_id),
        occurredAt: String(row.occurred_at),
        content: row.content,
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "journal_entry":
      return {
        ...base,
        dayId: String(row.day_id),
        title: row.title ? String(row.title) : null,
        body: String(row.body ?? ""),
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "media":
      return {
        ...base,
        dayId: String(row.day_id),
        momentId: row.moment_id ? String(row.moment_id) : null,
        mimeType: String(row.mime_type),
        byteSize: Number(row.byte_size),
        width: Number(row.width),
        height: Number(row.height),
        caption: String(row.caption ?? ""),
        objectKey: row.object_key ? String(row.object_key) : null,
        status: row.deleted_at ? "pending_delete" : row.object_key ? "uploaded" : "pending_upload",
        uploadAttempts: Number(row.upload_attempts ?? 0),
        lastError: null,
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
        blob: current?.blob ?? null,
      };
    case "reflection":
      return {
        ...base,
        dayId: String(row.day_id),
        period: row.period,
        answers: row.answers,
        currentQuestion: Number(row.current_question),
        completedAt: row.completed_at ? String(row.completed_at) : null,
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "preferences":
      return {
        ...base,
        accent: row.accent,
        paper: row.paper,
        notebookCover: row.notebook_cover,
        environmentDensity: row.environment_density,
        reflectionEnabled: Boolean(row.reflection_enabled),
        reducedMotionOverride: row.reduced_motion_override,
        memoryResurfacingEnabled: Boolean(row.memory_resurfacing_enabled),
        memoryRangeYears: Number(row.memory_range_years),
        onboardingComplete: Boolean(row.onboarding_complete),
        aiEnabled: Boolean(row.ai_enabled),
        aiExternalProcessingConsent: Boolean(row.ai_external_processing_consent),
        aiContentScopes: row.ai_content_scopes,
        createdAt: String(current?.createdAt ?? row.client_updated_at),
        updatedAt: String(row.client_updated_at),
      };
    case "bookmark":
      return {
        ...base,
        journalEntryId: String(row.journal_entry_id),
        createdAt: String(row.client_created_at),
      };
    case "tracker_definition":
      return {
        ...base,
        name: String(row.name),
        description: String(row.description ?? ""),
        type: row.tracker_type,
        options: row.options,
        unit: String(row.unit ?? ""),
        pinned: Boolean(row.pinned),
        archivedAt: row.archived_at ? String(row.archived_at) : null,
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "tracker_entry":
      return {
        ...base,
        trackerId: String(row.tracker_id),
        dayId: String(row.day_id),
        localDate: String(row.local_date),
        value: row.value,
        note: String(row.note ?? ""),
        occurredAt: String(row.occurred_at),
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "monthly_reflection":
      return {
        ...base,
        month: String(row.month).slice(0, 7),
        body: String(row.body ?? ""),
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "keepsake":
      return {
        ...base,
        sourceType: row.source_type,
        sourceId: String(row.source_id),
        dayId: row.day_id ? String(row.day_id) : null,
        localDate: row.local_date ? String(row.local_date) : null,
        month: row.month ? String(row.month).slice(0, 7) : null,
        title: String(row.title ?? ""),
        preview: String(row.preview ?? ""),
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "doodle":
      return {
        ...base,
        dayId: String(row.day_id),
        localDate: String(row.local_date),
        title: String(row.title ?? ""),
        description: String(row.description ?? ""),
        width: Number(row.canvas_width),
        height: Number(row.canvas_height),
        strokes: row.strokes,
        previewDataUrl: String(row.preview_data_url ?? ""),
        createdAt: String(row.client_created_at),
        updatedAt: String(row.client_updated_at),
      };
    case "hidden_memory":
      return {
        ...base,
        scope: row.scope,
        entityType: row.entity_type,
        entityId: String(row.entity_id),
        dayId: String(row.day_id),
        createdAt: String(row.client_created_at),
      };
  }
}
