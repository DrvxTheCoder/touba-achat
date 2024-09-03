CREATE OR REPLACE FUNCTION update_odm_status() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date < CURRENT_DATE AND NEW.status != 'COMPLETED' THEN
    NEW.status = 'COMPLETED';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_odm_completion
BEFORE UPDATE ON "OrdreDeMission"
FOR EACH ROW
EXECUTE FUNCTION update_odm_status();

CREATE TRIGGER check_odm_completion_on_insert
BEFORE INSERT ON "OrdreDeMission"
FOR EACH ROW
EXECUTE FUNCTION update_odm_status();
