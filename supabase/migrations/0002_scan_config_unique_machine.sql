-- Add unique constraint on scan_config.machine_id
-- Required for upsert onConflict: "machine_id" in Server Actions

alter table public.scan_config
  add constraint scan_config_machine_id_unique unique (machine_id);
