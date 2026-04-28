-- Allow school year strings like 2025-2026 in classes.year
ALTER TABLE classes
  ALTER COLUMN year TYPE TEXT
  USING year::text;
