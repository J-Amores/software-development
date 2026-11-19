-- Reading an Application reads its whole Timeline, and saving one replaces it, so
-- every access to this table is by application_id.
create index status_changes_by_application on status_changes (application_id);
