import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutboxOperation } from "@/domain/sync";
import type { PushResult, SyncRemote } from "@/sync/engine";

const TABLES = {
  day: "days",
  moment: "moments",
  journal_entry: "journal_entries",
  media: "media",
  reflection: "reflections",
  preferences: "user_preferences",
  bookmark: "bookmarks",
  tracker_definition: "tracker_definitions",
  tracker_entry: "tracker_entries",
  monthly_reflection: "monthly_reflections",
  keepsake: "keepsakes",
  doodle: "doodles",
  hidden_memory: "hidden_memories",
} as const;

export class SupabaseSyncRemote implements SyncRemote {
  constructor(private readonly client: SupabaseClient) {}

  async push(operation: OutboxOperation): Promise<PushResult> {
    const { data: identity } = await this.client.auth.getUser();
    if (!identity.user || identity.user.id !== operation.userId)
      throw new Error("Sign in again before syncing.");
    const previous = await this.client
      .from("sync_operations")
      .select("result_version")
      .eq("operation_id", operation.operationId)
      .maybeSingle();
    if (previous.error) throw new Error("Remote sync is temporarily unavailable.");
    if (previous.data)
      return {
        status: "duplicate",
        serverVersion: Number(previous.data.result_version ?? operation.expectedVersion + 1),
      };
    const table = TABLES[operation.entityType];
    const payload = toRemote(operation.entityType, operation.payload as Record<string, unknown>);
    const nextVersion = operation.expectedVersion + 1;
    let result: { data: Record<string, unknown> | null; error: { code?: string } | null };
    if (operation.expectedVersion === 0) {
      result = (await this.client
        .from(table)
        .insert({ ...payload, version: nextVersion })
        .select("*")
        .maybeSingle()) as typeof result;
      if (result.error?.code === "23505") {
        const remote = await this.fetchRecord(operation);
        if (sameRevision(remote, operation.payload))
          return this.record(operation, nextVersion, "duplicate");
        return {
          status: "conflict",
          serverVersion: Number(remote?.version ?? 1),
          remoteRecord: remote,
        };
      }
    } else {
      const key = operation.entityType === "preferences" ? "user_id" : "id";
      result = (await this.client
        .from(table)
        .update({ ...payload, version: nextVersion })
        .eq(key, operation.entityId)
        .eq("version", operation.expectedVersion)
        .select("*")
        .maybeSingle()) as typeof result;
      if (!result.error && !result.data) {
        const remote = await this.fetchRecord(operation);
        if (sameRevision(remote, operation.payload))
          return this.record(operation, Number(remote?.version ?? nextVersion), "duplicate");
        return {
          status: "conflict",
          serverVersion: Number(remote?.version ?? operation.expectedVersion),
          remoteRecord: remote,
        };
      }
    }
    if (result.error) throw new Error("Remote sync is temporarily unavailable.");
    return this.record(operation, nextVersion, "applied");
  }

  private async fetchRecord(operation: OutboxOperation) {
    const key = operation.entityType === "preferences" ? "user_id" : "id";
    const { data } = await this.client
      .from(TABLES[operation.entityType])
      .select("*")
      .eq(key, operation.entityId)
      .maybeSingle();
    return data as Record<string, unknown> | null;
  }

  private async record(
    operation: OutboxOperation,
    version: number,
    status: "applied" | "duplicate",
  ) {
    const { error } = await this.client.from("sync_operations").upsert(
      {
        operation_id: operation.operationId,
        user_id: operation.userId,
        entity_type: operation.entityType,
        entity_id: operation.entityId,
        action: operation.action,
        result_version: version,
      },
      { onConflict: "operation_id" },
    );
    if (error) throw new Error("Remote sync acknowledgement failed; it will retry safely.");
    return { status, serverVersion: version } as PushResult;
  }
}

function toRemote(type: OutboxOperation["entityType"], value: Record<string, unknown>) {
  const common = { user_id: value.userId, deleted_at: value.deletedAt ?? null };
  switch (type) {
    case "day":
      return {
        ...common,
        id: value.id,
        local_date: value.localDate,
        timezone: value.timeZone,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "moment":
      return {
        ...common,
        id: value.id,
        day_id: value.dayId,
        occurred_at: value.occurredAt,
        content: value.content,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "journal_entry":
      return {
        ...common,
        id: value.id,
        day_id: value.dayId,
        title: value.title,
        body: value.body,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "media":
      return {
        ...common,
        id: value.id,
        day_id: value.dayId,
        moment_id: value.momentId,
        object_key: value.objectKey,
        mime_type: value.mimeType,
        byte_size: value.byteSize,
        width: value.width,
        height: value.height,
        caption: value.caption,
        upload_attempts: value.uploadAttempts,
        last_error: value.lastError,
        status: value.deletedAt
          ? "pending_delete"
          : value.objectKey
            ? "uploaded"
            : "pending_upload",
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "reflection":
      return {
        ...common,
        id: value.id,
        day_id: value.dayId,
        period: value.period,
        answers: value.answers,
        current_question: value.currentQuestion,
        completed_at: value.completedAt,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "preferences":
      return {
        user_id: value.userId,
        accent: value.accent,
        paper: value.paper,
        notebook_cover: value.notebookCover,
        environment_density: value.environmentDensity,
        reflection_enabled: value.reflectionEnabled,
        reduced_motion_override: value.reducedMotionOverride,
        memory_resurfacing_enabled: value.memoryResurfacingEnabled,
        memory_range_years: value.memoryRangeYears,
        onboarding_complete: value.onboardingComplete,
        ai_enabled: value.aiEnabled,
        ai_external_processing_consent: value.aiExternalProcessingConsent,
        ai_content_scopes: value.aiContentScopes,
        client_updated_at: value.updatedAt,
      };
    case "bookmark":
      return {
        ...common,
        id: value.id,
        journal_entry_id: value.journalEntryId,
        client_created_at: value.createdAt,
      };
    case "tracker_definition":
      return {
        ...common,
        id: value.id,
        name: value.name,
        description: value.description,
        tracker_type: value.type,
        options: value.options,
        unit: value.unit,
        pinned: value.pinned,
        archived_at: value.archivedAt,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "tracker_entry":
      return {
        ...common,
        id: value.id,
        tracker_id: value.trackerId,
        day_id: value.dayId,
        local_date: value.localDate,
        value: value.value,
        note: value.note,
        occurred_at: value.occurredAt,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "monthly_reflection":
      return {
        ...common,
        id: value.id,
        month: `${String(value.month).slice(0, 7)}-01`,
        body: value.body,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "keepsake":
      return {
        ...common,
        id: value.id,
        source_type: value.sourceType,
        source_id: value.sourceId,
        day_id: value.dayId,
        local_date: value.localDate,
        month: value.month ? `${String(value.month).slice(0, 7)}-01` : null,
        title: value.title,
        preview: value.preview,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "doodle":
      return {
        ...common,
        id: value.id,
        day_id: value.dayId,
        local_date: value.localDate,
        title: value.title,
        description: value.description,
        canvas_width: value.width,
        canvas_height: value.height,
        strokes: value.strokes,
        preview_data_url: value.previewDataUrl,
        client_created_at: value.createdAt,
        client_updated_at: value.updatedAt,
      };
    case "hidden_memory":
      return {
        ...common,
        id: value.id,
        scope: value.scope,
        entity_type: value.entityType,
        entity_id: value.entityId,
        day_id: value.dayId,
        client_created_at: value.createdAt,
      };
  }
}

function sameRevision(remote: Record<string, unknown> | null, local: unknown) {
  if (!remote || !local || typeof local !== "object") return false;
  const updated =
    (local as Record<string, unknown>).updatedAt ?? (local as Record<string, unknown>).createdAt;
  return remote.client_updated_at === updated;
}
