ALTER TABLE job_applications
  ADD COLUMN IF NOT EXISTS rejection_reason_id uuid REFERENCES rejection_reasons(id);
