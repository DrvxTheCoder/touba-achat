-- Drop triggers
DROP TRIGGER IF EXISTS check_odm_completion ON "OrdreDeMission";
DROP TRIGGER IF EXISTS check_odm_completion_on_insert ON "OrdreDeMission";

-- Drop function
DROP FUNCTION IF EXISTS update_odm_status();