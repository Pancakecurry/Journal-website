-- AI preferences are canonical consent choices; embeddings and assistant answers
-- remain derived/ephemeral local data and are intentionally not stored here.
alter table public.user_preferences
  add column ai_enabled boolean not null default false,
  add column ai_external_processing_consent boolean not null default false,
  add column ai_content_scopes jsonb not null default '{"moment":false,"journal":false,"reflection":false,"photo_caption":false,"tracker":false,"monthly_reflection":false,"doodle":false}'::jsonb,
  add constraint user_preferences_ai_requires_consent
    check (not ai_enabled or ai_external_processing_consent),
  add constraint user_preferences_ai_scopes_object
    check (jsonb_typeof(ai_content_scopes) = 'object');

comment on column public.user_preferences.ai_external_processing_consent is
  'Explicit user choice; does not by itself authorize a request without the short-lived server consent grant.';
